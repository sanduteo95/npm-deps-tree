/* eslint-disable no-unused-expressions */
import chai from 'chai'
import sinon from 'sinon'
import request from 'supertest'

import app from '../app'
import * as dependency from '../lib/dependency'

const expect = chai.expect

describe('GET', () => {
  let computeDependencyTreeForPackageStub

  beforeEach(() => {
    computeDependencyTreeForPackageStub = sinon.stub(dependency, 'computeDependencyTreeForPackage')
  })

  afterEach(() => {
    computeDependencyTreeForPackageStub.restore()
  })

  it('should return a dependency tree if successful', (done) => {
    computeDependencyTreeForPackageStub.resolves({
      name: 'test',
      version: 'test',
      dependencies: []
    })
    request(app)
      .get('/package/test')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(response => {
        expect(JSON.parse(response.text)).to.deep.equal({
          name: 'test',
          version: 'test',
          dependencies: []
        })
        done()
      })
      .catch(err => done(err))
  })

  it('should return an error if failed', (done) => {
    computeDependencyTreeForPackageStub.rejects(new Error('Test'))
    request(app)
      .get('/package/test')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response: any) => {
        expect(JSON.parse(response.error.text)).to.deep.equal({
          error: 'Test'
        })
        done()
      })
      .catch(err => done(err))
  })
})

describe('POST', () => {
  let computeDependencyTreeForPackageStub

  beforeEach(() => {
    computeDependencyTreeForPackageStub = sinon.stub(dependency, 'computeDependencyTreeForPackage')
  })

  afterEach(() => {
    computeDependencyTreeForPackageStub.restore()
  })

  it('should return a dependency tree with a default version of latest', (done) => {
    computeDependencyTreeForPackageStub.resolves({
      name: 'test',
      version: 'test',
      dependencies: []
    })
    request(app)
      .post('/package/test')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(response => {
        expect(JSON.parse(response.text)).to.deep.equal({
          name: 'test',
          version: 'test',
          dependencies: []
        })
        done()
      })
      .catch(err => done(err))
  })

  it('should return a dependency tree with a provided version', (done) => {
    computeDependencyTreeForPackageStub.resolves({
      name: 'test',
      version: 'test',
      dependencies: []
    })
    request(app)
      .post('/package/test')
      .send({
        version: 'latest'
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(response => {
        expect(JSON.parse(response.text)).to.deep.equal({
          name: 'test',
          version: 'test',
          dependencies: []
        })
        done()
      })
      .catch(err => done(err))
  })

  it('should return an error if failed', (done) => {
    computeDependencyTreeForPackageStub.rejects(new Error('Test'))
    request(app)
      .get('/package/test')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(500)
      .then((response: any) => {
        expect(JSON.parse(response.error.text)).to.deep.equal({
          error: 'Test'
        })
        done()
      })
      .catch(err => done(err))
  })
})

describe('invalid name', () => {
  it('should return an error message on GET', (done) => {
    request(app)
      .get('/package/ test')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .then((response: any) => {
        expect(JSON.parse(response.error.text)).to.deep.equal({
          error: 'Name is not a valid NPM package name.'
        })
        done()
      })
      .catch(err => done(err))
  })

  it('should return an error message on POST', (done) => {
    request(app)
      .post('/package/ test')
      .send({})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .then((response: any) => {
        expect(JSON.parse(response.error.text)).to.deep.equal({
          error: 'Name is not a valid NPM package name.'
        })
        done()
      })
      .catch(err => done(err))
  })
})

describe('invalid version', () => {
  it('should return an error message on GET', (done) => {
    request(app)
      .get('/package/test')
      .send({
        version: 'foo'
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .then((response: any) => {
        expect(JSON.parse(response.error.text)).to.deep.equal({
          error: 'The version is invalid.'
        })
        done()
      })
      .catch(err => done(err))
  })

  it('should return an error message on POST', (done) => {
    request(app)
      .post('/package/test')
      .send({
        version: 'foo'
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .then((response: any) => {
        expect(JSON.parse(response.error.text)).to.deep.equal({
          error: 'The version is invalid.'
        })
        done()
      })
      .catch(err => done(err))
  })
})

describe('undefined route', () => {
  it('should return an error', (done) => {
    request(app)
      .post('/foo/bar')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404)
      .then((response: any) => {
        expect(JSON.parse(response.error.text)).to.deep.equal({
          error: 'Not implemented!'
        })
        done()
      })
      .catch(err => done(err))
  })
})
