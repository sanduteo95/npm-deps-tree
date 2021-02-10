/* eslint-disable no-unused-expressions */
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
const nock = require('nock')

const utils = require('../../utils/utils')
const cache = require('../../utils/cache')

describe('utils.js', () => {
  describe('_downloadPackage', () => {
    before(() => {
      utils.internal._setRetries(0)
    })

    it('returns the response by calling the npmjs registry', async () => {
      const response = {
        dependencies: {
          dep1: '1.2.3',
          dep2: '2.3.4'
        }
      }
      nock('https://registry.npmjs.org')
        .get('/name/version')
        .reply(200, response)
      const actual = await (utils.internal._downloadPackage('name', 'version'))
      expect(actual).to.deep.equal(response)
    })

    it('adds a dependencies section if missing', async () => {
      const response = {}
      nock('https://registry.npmjs.org')
        .get('/name/version')
        .reply(200, response)
      const actual = await (utils.internal._downloadPackage('name', 'version'))
      expect(actual).to.deep.equal({
        dependencies: {}
      })
    })

    it('throws an error if call fails', async () => {
      try {
        nock('https://registry.npmjs.org')
          .get('/name/version')
          .replyWithError('Test')
        await (utils.internal._downloadPackage('name', 'version'))
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.not.equal('')
      }
    })
  })

  describe('getPackageDependencies', () => {
    let _downloadPackageStub
    beforeEach(() => {
      _downloadPackageStub = sinon.stub(utils.internal, '_downloadPackage')
    })

    afterEach(() => {
      _downloadPackageStub.restore()
    })

    describe('it returns the formatted dependencies', () => {
      let isCachedStub
      let getCachedValueStub
      let setCachedValueSpy

      beforeEach(() => {
        isCachedStub = sinon.stub(cache, 'isCached')
        getCachedValueStub = sinon.stub(cache, 'getCachedValue')
        setCachedValueSpy = sinon.spy(cache, 'setCachedValue')
      })

      afterEach(() => {
        isCachedStub.restore()
        getCachedValueStub.restore()
        setCachedValueSpy.restore()
      })

      it('returns the cached depedencies if present', async () => {
        isCachedStub.returns(true)
        const cachedDependencies = [
          {
            name: 'dep1',
            version: '1.2.3'
          }
        ]
        getCachedValueStub.returns(cachedDependencies)
        const actual = await utils.getPackageDependencies('package', 'v')
        expect(actual).to.deep.equal(cachedDependencies)
        expect(_downloadPackageStub.callCount).to.equal(0)
        expect(setCachedValueSpy.callCount).to.equal(0)
      })

      it('computes the depedencies and caches them if not present', async () => {
        isCachedStub.returns(false)
        const testDependencies = {
          dependencies: {
            dep1: '1.2.3',
            dep2: '2.3.4'
          }
        }
        _downloadPackageStub.resolves(testDependencies)
        const actual = await utils.getPackageDependencies('package', 'v')
        expect(actual).to.deep.equal([
          {
            name: 'dep1',
            version: '1.2.3'
          },
          {
            name: 'dep2',
            version: '2.3.4'
          }
        ])
        expect(_downloadPackageStub.callCount).to.equal(1)
        expect(setCachedValueSpy.callCount).to.equal(1)
      })

      it('throws an error if the name is invalid', async () => {
        isCachedStub.returns(false)
        const testDependencies = {
          dependencies: {
            ' dep1': '1.2.3',
            dep2: '2.3.4'
          }
        }
        _downloadPackageStub.resolves(testDependencies)
        try {
          await utils.getPackageDependencies('package', 'v')
          expect('Test should fail').to.be.true
        } catch (err) {
          expect(err.message).to.equal('Name is not a valid NPM package name.')
          expect(_downloadPackageStub.callCount).to.equal(1)
          expect(setCachedValueSpy.callCount).to.equal(0)
        }
      })

      it('throws an error if the version is invalid', async () => {
        isCachedStub.returns(false)
        const testDependencies = {
          dependencies: {
            dep1: 'a.b.c',
            dep2: '2.3.4'
          }
        }
        _downloadPackageStub.resolves(testDependencies)
        try {
          await utils.getPackageDependencies('package', 'v')
          expect('Test should fail').to.be.true
        } catch (err) {
          expect(err.message).to.equal('Major versions cannot be specified with x and *.')
          expect(_downloadPackageStub.callCount).to.equal(1)
          expect(setCachedValueSpy.callCount).to.equal(0)
        }
      })
    })

    describe('catches an error', () => {
      let isCachedStub

      beforeEach(() => {
        isCachedStub = sinon.stub(cache, 'isCached').returns(false)
        _downloadPackageStub.rejects(new Error('Test'))
      })

      afterEach(() => {
        isCachedStub.restore()
      })

      it('re-throws the error', async () => {
        try {
          await utils.getPackageDependencies('package', 'v')
          expect('Test should fail').to.be.true
        } catch (err) {
          expect(err.message).to.equal('Test')
        }
      })
    })
  })
})
