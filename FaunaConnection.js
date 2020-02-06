/*------------------------------------------------------------------------
Copyright 2020 William F Brinkert

Permission to use, copy, modify, and/or distribute this software for any 
purpose with or without fee is hereby granted, provided that the above 
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES 
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF 
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR 
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES 
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN 
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF 
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
-------------------------------------------------------------------------*/

const faunadb = require('faunadb')

/**
 * A wrapper class for using the faunuDB javascript API
 */
class FaunaConnection {
  constructor(options) {
    const { secret }  = options
    this.q = faunadb.query
    this.client = new faunadb.Client({ secret })
    this.size = 64;
  }

  /**
   * If the client was instantiated using an admin key
   * this will create a database with the given name.
   * 
   * @param  {string} name the name to use for the database
   * @return {Object}      Response object with database name and ref
   */
  createDB(name) {
    return this.client.query(
      this.q.CreateDatabase({ name: name })
    )
  }

  /**
   * If the client was instantiated with at least a
   * databse key, this will return a server role for
   * the given named database.
   * 
   * @param  {string} dbName the name of the database to create a server for
   * @return {Object}        Response object with database name and ref 
   */
  createServer(dbName) {
    return this.client.query(
      this.q.CreateKey({
        database: this.q.Database(dbName),
        role: 'server'
      })
    )
  }

  /**
   * Creates a collection of the given name
   * 
   * @param  {string} name A descriptive name for the collection
   * @return {Object}      Reference to collection object
   */
  createCollection(name) {
    return this.client.query(
      this.q.CreateCollection({ name: name})
    )
  }

  /**
   * Creates an index for use on a collection
   * 
   * @param  {string} name   descriptive name for the index
   * @param  {string} src    the name of the collection to apply this to
   * @param  {Array} terms   the terms to be used for the index
   * @param  {Array} values  the values to be used for the index
   * @return {Object}        the index object
   */
  createIndex(name, src, terms=null, values=null) {
    return this.client.query(
      this.q.CreateIndex({
        name: name,
        source: this.q.Collection(src),
        terms: terms,
        values: values
      })
    )
  }

  /**
   * Creates a document within the named collection given either single doc
   * or an array of documents.
   * @param  {string} collection name of the collection to put the doc into
   * @param  {Object} doc        the document to put in the database collection
   * @return {Object}            the document that was inserted
   */
  create(collection, docs) {
    const documents = Array.isArray(docs) ? docs : [docs]
    return this.client.query(
      this.q.Map(
        documents,
        this.q.Lambda(
          'doc',
          this.q.Create(
            this.q.Collection(collection),
            { data: this.q.Var('doc') }
          )
        )
      )
    )
  }

  /**
   * Given an array of touples [custom id,document] will iterate through 
   * and place each into the given collection in the database with the 
   * custom id is the 'ref' field for the document.
   * 
   * @param  {string} collection name of the collection to put the docs into
   * @param  {Array} docs        the documents to put in the database collection
   * @return {Array}             an array of the documents put in the database
   */
  createWithCustomID(collection, touples) {
    return this.client.query(
      this.q.Map(
        touples,
        this.q.Lambda(
          ['id', 'data'],
          this.q.Create(
            this.q.Ref(this.q.Collection(collection), this.q.Var('id')),
            { data: this.q.Var('data') }
          )
        )
      )
    )
  }

  /**
   * Retrieve a document given its ref and collection
   * 
   * @param  {string} collection the name of the collection
   * @param  {string} ref        the ID or ref of the document
   * @return {Object}            the document identified by the query
   */
  get(collection, ref) {
    return this.client.query(
      this.q.Get(
        this.q.Ref(
          this.q.Collection(collection),
          ref
        )
      )
    )
  }

  /**
   * Retrieve the first document that matches the given value 
   * of a term used to create the index. For example, if we 
   * have an index called "posts_by_title" whose term was set 
   * to "title", we can search that index using a value of 
   * "My Blog Post" to see if any posts' titles match our value.
   * 
   * @param  {string} index name of index to search on
   * @param  {multiple} value the value to match on the index term
   * @return {Object}       the first matching document
   */
  getMatch(index, value) {
    return this.client.query(
      this.q.Get(
        this.q.Match(
          this.q.Index(index),
          value
        )
      )
    )
  }

  /**
   * Given an index 'all_<items>' with no set terms or values,
   * this will return the refs of all documents in that index.
   * 
   * @param  {string} index  name of the index to use
   * @param  {integer} size  number of docs to be returned per page
   * @return {Array}         an array of the refs to the docs within
   * the index
   */
  getAllRefsByIndex(index, size) {
    return this.client.query(
      this.q.Paginate(
        this.q.Match(
          this.q.Index(index)
        ),
        { size: size || this.size }
      )
    )
  }

  _buildRef(options) {
    return this.q.Ref(this.q.Collection(options.collection), options.ref)
  }

  /**
   * Provided with an index, returns all matching documents
   * 
   * @param  {string} index   name of the index
   * @param  {Object} options options that may be passed in include:
   * before - ref to document for traversing pagination backward
   * after - ref to document for traversing pagination forward
   * term - a such term to use with a searchable index
   * size - the number of docs to return per page
   * scope - the database ref within which to perform the match
   * @return {Object}         Returns a collection of docs matching 
   * the query conditions
   */
  getAllDocsByIndex(index, options = {}) {
    if (options.before && options.before.collection) {
      options.before = this._buildRef(options.before)
    } 
    else if (options.after && options.after.collection) {
      options.after = this._buildRef(options.after)
    }
    return this.client.query(
      this.q.Map(
        this.q.Paginate(
          this.q.Match(
            this.q.Index(index, options.scope),
            options.term
          ),
          { 
            size: options.size || this.size,
            before: options.before,
            after: options.after
           }
        ),
        ref => this.q.Get(ref) 
      )
    )
  }

  /**
   * Given the ref and collection this will update the
   * data of that document.
   * 
   * @param  {string} collection the name of the collection
   * @param  {string} ref        the ID or ref of the doc
   * @param  {Object} data       the data to be updated
   * @return {Object}            the updated document
   */
  update(collection, ref, data) {
    return this.client.query(
      this.q.Update(
        this.q.Ref(
          this.q.Collection(collection),
          ref
        ),
        { data : data }
      )
    )
  }

  /**
   * Given the ref and collection this will replace the
   * data of that document whose fields match the given data.
   * Any old fields in the document that are not mentioned in
   * the data param are removed.
   * 
   * @param  {string} collection the name of the collection
   * @param  {string} ref        the ID or ref of the doc
   * @param  {Object} data       the data to be replace
   * @return {Object}            the updated document
   */
  replace(collection, ref, data) {
    return this.client.query(
      this.q.Replace(
        this.q.Ref(
          this.q.Collection(collection),
          ref
        ),
        { data: data }
      )
    )
  }

  /**
   * Destroys a document
   * 
   * @param  {string} collection the name of the collection
   * @param  {string} ref        the ID or ref of the doc
   * @return {Object}            the deleted document
   */
  delete(collection, ref) {
    return this.client.query(
      this.q.Delete(
        this.q.Ref(
          this.q.Collection(collection),
          ref
        )
      )
    )
  }

  paginateDB(dbName, size) {
    return this.client.query(
      this.q.Paginate(
        this.q.Database(dbName),
        { size: size || this.size }
      )
    )
  }

  getDatabase(dbName) {
    return this.client.query(
      this.q.Get(
        this.q.Database(dbName)
      )
    )
  }

}

module.exports = FaunaConnection
