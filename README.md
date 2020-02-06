# FaunaDB Connection

This is a convenience wrapper class for the basic functionality of the FaunaDB Javascript API. This wrapper helps to simplify some of the syntax for these basic operations while still exposing the faunaDB package and Fauna Client. You can find more information on the FaunaDB javascript API [here](https://docs.fauna.com/fauna/current/drivers/javascript.html) and basic tutorials [here](https://docs.fauna.com/fauna/current/tutorials/crud). 

## Basic use

To use the wrapper, import it and instantiate with your secret key. Using an admin key will allow you full access to actions within your fauna account while using other keys with different permissions or roles may limit what queries may be run.

``` javascript
const FaunaConnection = require('./faunadb-connector')
const fauna = new FaunaConnection({secret: <your_fauna_secret_here>})
```

All of the class functions return a promise. The connection can then be used like this:
``` javascript
fauna
  .createCollection('blog_posts')
  .then(res => console.log(res))
  .catch(err => console.log(err))
```

The underlying functions and client can be accessed as below for writing your own queries for those cases where the provided basic functions lack the scope you need.
``` javascript
fauna.q is faunadb.query
fauna.client is the faunadb.Client
``` 
  
Visit [this webage to view the class api](https://silverfox70.github.io/faunadb-connector/FaunaConnection.html).

## Usage

### Create a database

This will work only as long as the permissions/role of the secret key you provided are scoped to allow database creation.
``` javascript
fauna
  .createDB('blog_posts')
  .then(res => console.log(res))
  .catch(err => console.log(err))
```

The output should look like:
``` bash
{ 
  ref: Database("blog_posts"), 
  ts: 1580933987495000, 
  name: 'blog_posts' 
}
```

### Create Collection
``` javascript
fauna
  .createCollection('authors')
  .then(res => console.log(res))
  .catch(err => console.log(err))
```  

The output should look like:
``` bash
{ 
  ref: Collection("authors"),
  ts: 1580934704606000,
  history_days: 30,
  name: 'authors' 
}
```

### Create Index

`createIndex(name, src, terms=null, values=null)`

| arg     | type   | description                                |
|---------|--------|--------------------------------------------|
| name    | string | a descriptive name for this index          |
| src     | string | the source collection this index will be applied to |
| terms   | object | the terms to use for the index             |
| values  | object | the values to be used for the index        |

If you have just created a collection you will need to create an _all_ index so that you can easily retrieve the items in your collection. Below is the most basic index you can create and requires no other arguments other than a descriptive index name and the collection that is the source.

``` javascript
fauna
  .createIndex('all_authors', 'authors')
  .then(res => console.log(res))
  .catch(err => console.log(err))
``` 

The output should look like:
``` bash
{ 
  ref: Index("all_authors"),
  ts: 1580935056400000,
  active: true,
  serialized: true,
  name: 'all_authors',
  source: Collection("authors"),
  partitions: 8 
}
```

Indexes can be substantially more complicated than what you see above and much of that discussion is beyond the scope of this document. For more information on using Indexes, please [check this out](https://docs.fauna.com/fauna/current/tutorials/indexes/). 

As to how to create more detailed indexes with this wrapper, know that you can pass in a **terms** and **values** object for building your index. For example, let's suppose you have a _collection_ of authors, and each author document has a first name and a last name field. We might want to sort our authors by last name and then by first name in ascending order, so let's create an index to do that.

``` javascript

const values = [
  { field: ["data", "last"] },
  { field: ["data", "first"] },
  { field: ["ref"] }
]

fauna
  .createIndex('authors_sort_by_last_first_asc', 'authors', null, values)
  .then(res => console.log(res))
  .catch(err => console.log(err))
```

Our response should look something like:
```bash
{ 
  ref: Index("authors_sort_by_last_first_asc"),
  ts: 1580935873770000,
  active: true,
  serialized: true,
  name: 'authors_sort_by_last_first_asc',
  source: Collection("authors"),
  values:
    [ 
      { field: [Array] }, 
      { field: [Array] }, 
      { field: [Array] } 
    ],
  partitions: 8 
}
```

### Create a document

All documents live inside _collections_, so to create a new document in FaunaDB, we pass in the collection name and the document we wish to store.

``` javascript
const author = {
  first_name: "Alex",
  last_name: "Smith"
}

fauna
  .create('authors', author)
  .then(res => console.log(res))
  .catch(err => console.log(err))
```

The response should look something like:
```bash
{ 
  ref: Ref(Collection("authors"), "256563456795214345"),
  ts: 1580936829280000,
  data: { first_name: 'Alex', last_name: 'Smith' } 
}
```

### Creating multiple documents at once

The same `#create` function will also accept an array of documents. Each element in the array will be created as its own record.

``` javascript
const authorList = [
  {
    first_name: "Jack",
    last_name: "London"
  },
  {
    first_name: "Aldous",
    last_name: "Huxley"
  },
  {
    first_name: "Jane",
    last_name: "Austen"
  },
  {
    first_name: "Maya",
    last_name: "Angelou"
  },
]

fauna
  .create('authors', authorList)
  .then(res => console.log(res))
  .catch(err => console.log(err))
```

The response should look something like:
```bash
[ 
  { 
    ref: Ref(Collection("authors"), "256569179938754057"),
    ts: 1580942287315000,
    data: { first_name: 'Jack', last_name: 'London' } 
  },
  { 
    ref: Ref(Collection("authors"), "256569179938752009"),
    ts: 1580942287315000,
    data: { first_name: 'Aldous', last_name: 'Huxley' } 
  },
  { 
    ref: Ref(Collection("authors"), "256569179938750985"),
    ts: 1580942287315000,
    data: { first_name: 'Jane', last_name: 'Austen' } 
  },
  { 
    ref: Ref(Collection("authors"), "256569179938753033"),
    ts: 1580942287315000,
    data: { first_name: 'Maya', last_name: 'Angelou' } 
  } 
]
```

### Creating with custom ID

The process is the same as above for creating documents, except that an array of touples must be passed in the function below. Each touple consists of `[<custom_id>, <document>]`. Each custom_id must be unique.

**fauna.createWithCustomID(collection, touples)**

### Getting a document

There are several methods for retrieving a document from a collection within a database. The most basic `#get` works with the `ref`, or ID of the document and the collection name.


``` javascript
fauna
  .get('authors', '256569179938753033')
  .then(res => console.log(res))
  .catch(err => console.log(err))
``` 

The response should look something like:
```bash
{ 
  ref: Ref(Collection("authors"), "256569179938753033"),
  ts: 1580942287315000,
  data: { first_name: 'Maya', last_name: 'Angelou' } 
}
```

In order to get a document based on data within a document itself, we must first have created and index for this and told Fauna which term we would like to search on. For example, let's consider that we created an index as below:

``` javascript

const terms = [{ field: ['data', 'title'] }]

fauna.createIndex('posts_by_title', 'posts', term, null)
```

The above index would allow us to get a particular 'post' document by searching for it's title as shown below:

``` javascript
fauna
  .getMatch('posts_by_title', 'My cat and other marvels')
  .then(res => console.log(res))
  .catch(err => console.log(err))
```

Which, if the document exists, will return something like:
``` bash
{ 
  ref: Ref(Collection("posts"), "256027278950009353"),
  ts: 1580425490300000,
  data: { title: 'My cat and other marvels' } 
}
```

### Getting Multiple Documents

There are many options which can be used and I encourage you to check out [the class api](https://silverfox70.github.io/faunadb-connector/FaunaConnection.html) for greater detail. Here we will go over the most basic implementation of retrieving all of the docs within a collection.

``` javascript
fauna
  .getAllDocsByIndex('all_authors')
  .then(res => console.log(res))
  .catch(err => console.log(err))
```

This call should return all of the documents in the collection in a form like this, where the nested `data` Object is the document itself:
``` bash
{ 
  data:[ 
    { 
      ref: Ref(Collection("authors"), "256563456795214345"),
       ts: 1580936829280000,
       data: [Object] 
    },
    { 
      ref: Ref(Collection("authors"), "256568566847898122"),
       ts: 1580941702620000,
       data: [Object] 
    },
    { 
      ref: Ref(Collection("authors"), "256569179938750985"),
       ts: 1580942287315000,
       data: [Object] 
    },
    { 
      ref: Ref(Collection("authors"), "256569179938752009"),
       ts: 1580942287315000,
       data: [Object] 
    },
    { 
      ref: Ref(Collection("authors"), "256569179938753033"),
       ts: 1580942287315000,
       data: [Object] 
    },
    { 
      ref: Ref(Collection("authors"), "256569179938754057"),
       ts: 1580942287315000,
       data: [Object] 
    },
    { 
      ref: Ref(Collection("authors"), "256569241022497289"),
       ts: 1580942345550000,
       data: [Object] 
    } 
  ] 
}
```

### Updating a document

> Information coming soon!

### Deleting a document

> Information coming soon!