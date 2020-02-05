# FaunaDB Connection

This contains a basic wrapper class for working with the FaunaDB via the Javascript API. This wrapper helps to simplify some of the syntax for basic operations while still exposing the faunaDB package and Fauna Client.

## Basic Use

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
