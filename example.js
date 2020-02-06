require('dotenv').config()
const secret = process.env.FAUNADB_SECRET_KEY
const FaunaConnection = require('./FaunaConnection')
console.log('secret: ', secret)
const fauna = new FaunaConnection({secret: secret})


fauna
  .getAllDocsByIndex('all_People')
  .then(res => {
    console.log(res)
    if (res.data.length > 0) res.data.forEach(doc => console.log('doc: ', doc))

  })
  .catch(err => console.log(err))