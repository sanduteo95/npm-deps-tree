/* eslint-disable no-unused-expressions */
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

const utils = require('../../utils/utils')
const cache = require('../../utils/cache')

const dependency = require('../../lib/dependency')

describe('package.js', () => {
  let makeRegistryCallStub

  beforeEach(() => {
    makeRegistryCallStub = sinon.stub(utils, 'makeRegistryCall')
  })

  afterEach(() => {
    makeRegistryCallStub.restore()
  })

  describe('_downloadPackageWithVersion', () => {
    it('returns the response by calling the npmjs registry', async () => {
      const response = {
        dependencies: {
          dep1: '1.2.3',
          dep2: '2.3.4'
        }
      }
      makeRegistryCallStub.resolves({
        body: response
      })
      const actual = await (dependency.internal._downloadPackageWithVersion('name', 'version'))
      expect(actual).to.deep.equal(response)
    })

    it('throws an error if call fails', async () => {
      try {
        makeRegistryCallStub.rejects(new Error('Test'))
        await (dependency.internal._downloadPackageWithVersion('name', 'version'))
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Test')
      }
    })
  })

  describe('_downloadPackage', () => {
    it('returns the response by calling the npmjs registry', async () => {
      const response = {
        dependencies: {
          dep1: '1.2.3',
          dep2: '2.3.4'
        }
      }
      makeRegistryCallStub.resolves({
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
      const actual = await (dependency.internal._downloadPackage('name', '1.x.x'))
      expect(actual).to.deep.equal(response)
    })

    it('throws an error if it could not find a matching version', async () => {
      try {
        makeRegistryCallStub.resolves({
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
        await (dependency.internal._downloadPackage('name', '3.x.x'))
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Could not find matching version for name:3.x.x')
      }
    })

    it('throws an error if call fails', async () => {
      try {
        makeRegistryCallStub.rejects(new Error('Test'))
        await (dependency.internal._downloadPackage('name', 'version'))
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Test')
      }
    })
  })

  describe('getPackageDependencies', () => {
    let _downloadPackageWithVersionStub
    let _downloadPackageStub

    beforeEach(() => {
      _downloadPackageWithVersionStub = sinon.stub(dependency.internal, '_downloadPackageWithVersion')
      _downloadPackageStub = sinon.stub(dependency.internal, '_downloadPackage')
    })

    afterEach(() => {
      _downloadPackageWithVersionStub.restore()
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
        const actual = await dependency.getPackageDependencies('package', 'v')
        expect(actual).to.deep.equal(cachedDependencies)
        expect(_downloadPackageWithVersionStub.callCount).to.equal(0)
        expect(_downloadPackageStub.callCount).to.equal(0)
        expect(setCachedValueSpy.callCount).to.equal(0)
      })

      it('computes the depedencies and caches them if not present (non-semver)', async () => {
        isCachedStub.returns(false)
        const testDependencies = {
          dependencies: {
            dep1: '1.2.3',
            dep2: '2.3.4'
          }
        }
        _downloadPackageWithVersionStub.resolves(testDependencies)
        const actual = await dependency.getPackageDependencies('package', 'v')
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
        expect(_downloadPackageWithVersionStub.callCount).to.equal(1)
        expect(_downloadPackageStub.callCount).to.equal(0)
        expect(setCachedValueSpy.callCount).to.equal(1)
      })

      it('computes the depedencies and caches them if not present (semver)', async () => {
        isCachedStub.returns(false)
        const testDependencies = {
          dependencies: {
            dep1: '1.2.3',
            dep2: '2.3.4'
          }
        }
        _downloadPackageStub.resolves(testDependencies)
        const actual = await dependency.getPackageDependencies('package', 'v', true)
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
        expect(_downloadPackageWithVersionStub.callCount).to.equal(0)
        expect(_downloadPackageStub.callCount).to.equal(1)
        expect(setCachedValueSpy.callCount).to.equal(1)
      })

      it('adds a dependencies section if missing', async () => {
        isCachedStub.returns(false)
        const testDependencies = {}
        _downloadPackageWithVersionStub.resolves(testDependencies)
        const actual = await dependency.getPackageDependencies('package', 'v')
        expect(actual).to.deep.equal([])
        expect(_downloadPackageWithVersionStub.callCount).to.equal(1)
        expect(_downloadPackageStub.callCount).to.equal(0)
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
        _downloadPackageWithVersionStub.resolves(testDependencies)
        try {
          await dependency.getPackageDependencies('package', 'v')
          expect('Test should fail').to.be.true
        } catch (err) {
          expect(err.message).to.equal('Name is not a valid NPM package name.')
          expect(_downloadPackageWithVersionStub.callCount).to.equal(1)
          expect(_downloadPackageStub.callCount).to.equal(0)
          expect(setCachedValueSpy.callCount).to.equal(0)
        }
      })

      it('throws an error if the version is invalid', async () => {
        isCachedStub.returns(false)
        const testDependencies = {
          dependencies: {
            dep1: '1.x.x',
            dep2: '2.3.4'
          }
        }
        _downloadPackageWithVersionStub.resolves(testDependencies)
        try {
          await dependency.getPackageDependencies('package', 'v')
          expect('Test should fail').to.be.true
        } catch (err) {
          expect(err.message).to.equal('Major versions cannot be specified with x and *.')
          expect(_downloadPackageWithVersionStub.callCount).to.equal(1)
          expect(_downloadPackageStub.callCount).to.equal(0)
          expect(setCachedValueSpy.callCount).to.equal(0)
        }
      })
    })

    describe('catches an error', () => {
      let isCachedStub

      beforeEach(() => {
        isCachedStub = sinon.stub(cache, 'isCached').returns(false)
        _downloadPackageWithVersionStub.rejects(new Error('Test'))
      })

      afterEach(() => {
        isCachedStub.restore()
      })

      it('re-throws the error', async () => {
        try {
          await dependency.getPackageDependencies('package', 'v')
          expect('Test should fail').to.be.true
        } catch (err) {
          expect(err.message).to.equal('Test')
        }
      })
    })
  })
})
