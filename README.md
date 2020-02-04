# FaunaDB Connection

This contains a basic wrapper class for working with the FaunaDB via the Javascript API. 

## Basic Use

To use the wrapper, import it and instantiate with your scret key. Using an admin key will allow you full access to actions within your fauna account while using other key with different permissions may limit what queries may be run.

``` javascript
const FaunaConnection = require('./FaunaConnection')
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
