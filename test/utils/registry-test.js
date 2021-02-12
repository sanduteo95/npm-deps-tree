/* eslint-disable no-unused-expressions */
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
const nock = require('nock')

const registry = require('../../utils/registry')

describe('registry.js', () => {
  describe('downloadPackageWithVersion', () => {
    let _makeRegistryCallStub

    beforeEach(() => {
      _makeRegistryCallStub = sinon.stub(registry.internal, '_makeRegistryCall')
    })

    afterEach(() => {
      _makeRegistryCallStub.restore()
    })

    it('returns the response by calling the npmjs registry', async () => {
      const response = {
        dependencies: {
          dep1: '1.2.3',
          dep2: '2.3.4'
        }
      }
      _makeRegistryCallStub.resolves({
        body: response
      })
      const actual = await (registry.downloadPackageWithVersion('name', 'version'))
      expect(actual).to.deep.equal(response)
    })

    it('throws an error if call fails', async () => {
      try {
        _makeRegistryCallStub.rejects(new Error('Test'))
        await (registry.downloadPackageWithVersion('name', 'version'))
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Test')
      }
    })
  })

  describe('downloadPackage', () => {
    let _makeRegistryCallStub

    beforeEach(() => {
      _makeRegistryCallStub = sinon.stub(registry.internal, '_makeRegistryCall')
    })

    afterEach(() => {
      _makeRegistryCallStub.restore()
    })

    it('returns the response by calling the npmjs registry', async () => {
      const response = {
        dependencies: {
          dep1: '1.2.3',
          dep2: '2.3.4'
        }
      }
      _makeRegistryCallStub.resolves({
        body: {
          versions: {
            '1.0.0': {
              dependencies: {
                dep1: '1.2.3',
                dep2: '2.3.4'
              }
            },
            '2.0.0': {
              dependencies: {
                dep1: '1.2.3',
                dep2: '2.3.4'
              }
            }
          }
        }
      })
      const actual = await (registry.downloadPackage('name', '1.x.x'))
      expect(actual).to.deep.equal(response)
    })

    it('throws an error if it could not find a matching version', async () => {
      try {
        _makeRegistryCallStub.resolves({
          body: {
            versions: {
              '1.0.0': {
                dependencies: {
                  dep1: '1.2.3',
                  dep2: '2.3.4'
                }
              },
              '2.0.0': {
                dependencies: {
                  dep1: '1.2.3',
                  dep2: '2.3.4'
                }
              }
            }
          }
        })
        await (registry.downloadPackage('name', '3.x.x'))
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Could not find matching version for name:3.x.x')
      }
    })

    it('throws an error if call fails', async () => {
      try {
        _makeRegistryCallStub.rejects(new Error('Test'))
        await (registry.downloadPackage('name', 'version'))
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Test')
      }
    })
  })

  describe('_makeRegistryCall', () => {
    before(() => {
      registry.internal._setRetries(0)
    })

    it('returns response if call succeeds', async () => {
      const response = {
        foo: 'bar'
      }
      nock('https://registry.npmjs.org')
        .get('/test')
        .reply(200, response)
      const { body } = await (registry.internal._makeRegistryCall('/test'))
      expect(body).to.deep.equal(response)
    })

    it('throws an error if call fails', async () => {
      try {
        nock('https://registry.npmjs.org')
          .get('/test')
          .replyWithError('Test')
        await (registry.internal._makeRegistryCall('/test'))
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Test')
      }
    })
  })
})
