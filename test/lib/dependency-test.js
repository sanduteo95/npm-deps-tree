/* eslint-disable no-unused-expressions */
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

const registry = require('../../utils/registry')
const cache = require('../../persistence/cache')

const dependency = require('../../lib/dependency')

describe('dependency.js', () => {
  describe('_getPackageDependencies', () => {
    let downloadPackageWithVersionStub
    let downloadPackageStub

    beforeEach(() => {
      downloadPackageWithVersionStub = sinon.stub(registry, 'downloadPackageWithVersion')
      downloadPackageStub = sinon.stub(registry, 'downloadPackage')
    })

    afterEach(() => {
      downloadPackageWithVersionStub.restore()
      downloadPackageStub.restore()
    })

    describe('it returns the formatted dependencies', () => {
      it('computes the dependencies (non-semver)', async () => {
        const testDependencies = {
          version: 'version',
          dependencies: {
            dep1: '1.2.3',
            dep2: '2.3.4'
          }
        }
        downloadPackageWithVersionStub.resolves(testDependencies)
        const actual = await dependency.internal._getPackageDependencies('package', '1.2.3')
        expect(actual).to.deep.equal({
          dependencies: [
            {
              name: 'dep1',
              version: '1.2.3'
            },
            {
              name: 'dep2',
              version: '2.3.4'
            }
          ],
          matchVersion: 'version'
        })
        expect(downloadPackageWithVersionStub.callCount).to.equal(1)
        expect(downloadPackageStub.callCount).to.equal(0)
      })

      it('computes the dependencies (semver)', async () => {
        const testDependencies = {
          version: 'version',
          dependencies: {
            dep1: '1.2.3',
            dep2: '2.3.4'
          }
        }
        downloadPackageStub.resolves(testDependencies)
        const actual = await dependency.internal._getPackageDependencies('package', '>= 1.0.0 <2', true)
        expect(actual).to.deep.equal({
          dependencies: [
            {
              name: 'dep1',
              version: '1.2.3'
            },
            {
              name: 'dep2',
              version: '2.3.4'
            }
          ],
          matchVersion: 'version'
        })
        expect(downloadPackageWithVersionStub.callCount).to.equal(0)
        expect(downloadPackageStub.callCount).to.equal(1)
      })

      it('adds a dependencies section if missing', async () => {
        const testDependencies = {
          version: 'version'
        }
        downloadPackageWithVersionStub.resolves(testDependencies)
        const actual = await dependency.internal._getPackageDependencies('package', '1.2.3')
        expect(actual).to.deep.equal({
          dependencies: [],
          matchVersion: 'version'
        })
        expect(downloadPackageWithVersionStub.callCount).to.equal(1)
        expect(downloadPackageStub.callCount).to.equal(0)
      })
    })

    describe('catches an error', () => {
      let isCachedStub

      beforeEach(() => {
        isCachedStub = sinon.stub(cache, 'isCached').returns(false)
        downloadPackageWithVersionStub.rejects(new Error('Test'))
      })

      afterEach(() => {
        isCachedStub.restore()
      })

      it('re-throws the error', async () => {
        try {
          await dependency.internal._getPackageDependencies('package', '1.2.3')
          expect('Test should fail').to.be.true
        } catch (err) {
          expect(err.message).to.equal('Test')
        }
      })
    })
  })

  describe('computeDependencyTreeForPackage', () => {
    let _getPackageDependenciesStub
    let isCachedStub
    let getCachedValueStub
    let setCachedValueSpy

    beforeEach(() => {
      isCachedStub = sinon.stub(cache, 'isCached')
      getCachedValueStub = sinon.stub(cache, 'getCachedValue')
      setCachedValueSpy = sinon.spy(cache, 'setCachedValue')
      _getPackageDependenciesStub = sinon.stub(dependency.internal, '_getPackageDependencies')
    })

    afterEach(() => {
      isCachedStub.restore()
      getCachedValueStub.restore()
      setCachedValueSpy.restore()
      _getPackageDependenciesStub.restore()
    })

    it('returns cached values', async () => {
      isCachedStub.returns(true)
      getCachedValueStub.returns([])
      const actual = await dependency.computeDependencyTreeForPackage('package', '1.2.3')
      expect(actual).to.deep.equal({
        name: 'package',
        version: '1.2.3',
        dependencies: []
      })
      expect(_getPackageDependenciesStub.callCount).to.equal(0)
      expect(getCachedValueStub.callCount).to.equal(1)
      expect(setCachedValueSpy.callCount).to.equal(0)
    })

    it('recursively gets dependencies if provided latest version', async () => {
      isCachedStub.returns(false)
      _getPackageDependenciesStub.callsFake(async (name, version) => {
        let dependencies
        switch (name) {
          case 'package':
            dependencies = [
              {
                name: 'dep1',
                version: '1.2.3'
              },
              {
                name: 'dep2',
                version: '2.3.4'
              }
            ]
            break
          case 'dep1':
            dependencies = [
              {
                name: 'dep3',
                version: '3.4.5'
              }
            ]
            break
          case 'dep2':
            dependencies = []
            break
          case 'dep3':
            dependencies = [
              {
                name: 'dep4',
                version: '4.5.6'
              },
              {
                name: 'dep2',
                version: '2.3.4'
              }
            ]
            break
          default:
            dependencies = []
            break
        }
        return {
          dependencies: dependencies,
          matchVersion: version
        }
      })
      const actual = await dependency.computeDependencyTreeForPackage('package', 'latest')
      expect(actual).to.deep.equal({
        name: 'package',
        version: 'latest',
        dependencies: [
          {
            name: 'dep1',
            version: '1.2.3',
            dependencies: [
              {
                name: 'dep3',
                version: '3.4.5',
                dependencies: [
                  {
                    name: 'dep4',
                    version: '4.5.6',
                    dependencies: []
                  },
                  {
                    name: 'dep2',
                    version: '2.3.4',
                    dependencies: []
                  }
                ]
              }
            ]
          },
          {
            name: 'dep2',
            version: '2.3.4',
            dependencies: []
          }
        ]
      })
      expect(_getPackageDependenciesStub.callCount).to.equal(6)
      expect(getCachedValueStub.callCount).to.equal(0)
      expect(setCachedValueSpy.callCount).to.equal(6)
    })

    it('recursively gets dependencies if not cached', async () => {
      isCachedStub.returns(false)
      _getPackageDependenciesStub.callsFake(async (name, version) => {
        let dependencies
        switch (name) {
          case 'package':
            dependencies = [
              {
                name: 'dep1',
                version: '1.2.3'
              },
              {
                name: 'dep2',
                version: '2.3.4'
              }
            ]
            break
          case 'dep1':
            dependencies = [
              {
                name: 'dep3',
                version: '3.4.5'
              }
            ]
            break
          case 'dep2':
            dependencies = []
            break
          case 'dep3':
            dependencies = [
              {
                name: 'dep4',
                version: '4.5.6'
              },
              {
                name: 'dep2',
                version: '2.3.4'
              }
            ]
            break
          default:
            dependencies = []
            break
        }
        return {
          dependencies: dependencies,
          matchVersion: version
        }
      })
      const actual = await dependency.computeDependencyTreeForPackage('package', '1.2.3')
      expect(actual).to.deep.equal({
        name: 'package',
        version: '1.2.3',
        dependencies: [
          {
            name: 'dep1',
            version: '1.2.3',
            dependencies: [
              {
                name: 'dep3',
                version: '3.4.5',
                dependencies: [
                  {
                    name: 'dep4',
                    version: '4.5.6',
                    dependencies: []
                  },
                  {
                    name: 'dep2',
                    version: '2.3.4',
                    dependencies: []
                  }
                ]
              }
            ]
          },
          {
            name: 'dep2',
            version: '2.3.4',
            dependencies: []
          }
        ]
      })
      expect(_getPackageDependenciesStub.callCount).to.equal(6)
      expect(getCachedValueStub.callCount).to.equal(0)
      expect(setCachedValueSpy.callCount).to.equal(6)
    })

    it('throws an error when cyclic dependency found', async () => {
      _getPackageDependenciesStub.callsFake(async (name, version) => {
        let dependencies
        switch (name) {
          case 'package':
            dependencies = [
              {
                name: 'dep1',
                version: '1.2.3'
              },
              {
                name: 'package',
                version: 'other'
              }
            ]
            break
          default:
            dependencies = []
            break
        }
        return {
          dependencies: dependencies,
          matchVersion: version
        }
      })
      try {
        await dependency.computeDependencyTreeForPackage('package', 'latest')
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Cannot have cyclic dependencies.')
        expect(_getPackageDependenciesStub.callCount).to.equal(1)
      }
    })

    it('catches and re-throws an error', async () => {
      _getPackageDependenciesStub.rejects(new Error('Test'))
      try {
        await dependency.computeDependencyTreeForPackage('package', 'latest')
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Test')
        expect(_getPackageDependenciesStub.callCount).to.equal(1)
      }
    })
  })
})
