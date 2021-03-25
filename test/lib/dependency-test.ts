import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import * as registry from '../../utils/registry'
import * as cache from '../../persistence/cache'

import * as dependency from '../../lib/dependency'

const expect = chai.expect
chai.use(sinonChai)

describe('dependency.js', () => {
  describe('_getVersionedDependencies', () => {
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
        const actual = await dependency._getVersionedDependencies('package', '1.2.3')
        expect(actual).to.deep.equal({
          dependencies: testDependencies.dependencies,
          matchVersion: testDependencies.version
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
        const actual = await dependency._getVersionedDependencies('package', '>= 1.0.0 <2')
        expect(actual).to.deep.equal({
          dependencies: testDependencies.dependencies,
          matchVersion: testDependencies.version
        })
        expect(downloadPackageWithVersionStub.callCount).to.equal(0)
        expect(downloadPackageStub.callCount).to.equal(1)
      })

      it('adds a dependencies section if missing', async () => {
        const testDependencies = {
          version: 'version'
        }
        downloadPackageWithVersionStub.resolves(testDependencies)
        const actual = await dependency._getVersionedDependencies('package', '1.2.3')
        expect(actual).to.deep.equal({
          dependencies: undefined,
          matchVersion: testDependencies.version
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
          await dependency._getVersionedDependencies('package', '1.2.3')
          expect('Test should fail').to.be.true
        } catch (err) {
          expect(err.message).to.equal('Test')
        }
      })
    })
  })

  describe('computeDependencyTreeForPackage', () => {
    let _getVersionedDependenciesStub
    let isCachedStub
    let getCachedValueStub
    let setCachedValueSpy

    beforeEach(() => {
      isCachedStub = sinon.stub(cache, 'isCached')
      getCachedValueStub = sinon.stub(cache, 'getCachedValue')
      setCachedValueSpy = sinon.spy(cache, 'setCachedValue')
      _getVersionedDependenciesStub = sinon.stub(dependency, '_getVersionedDependencies')
    })

    afterEach(() => {
      isCachedStub.restore()
      getCachedValueStub.restore()
      setCachedValueSpy.restore()
      _getVersionedDependenciesStub.restore()
    })

    it('returns cached values', async () => {
      isCachedStub.returns(true)
      getCachedValueStub.returns([])
      const actual = await dependency.computeDependencyTreeForPackage('package', '1.2.3')
      expect(actual).to.deep.equal({
        package: {
          version: '1.2.3',
          dependencies: []
        }
      })
      expect(_getVersionedDependenciesStub.callCount).to.equal(0)
      expect(getCachedValueStub.callCount).to.equal(1)
      expect(setCachedValueSpy.callCount).to.equal(0)
    })

    it('recursively gets dependencies if provided latest version', async () => {
      isCachedStub.returns(false)
      _getVersionedDependenciesStub.callsFake(async (name, version) => {
        let dependencies
        switch (name) {
          case 'package':
            dependencies = {
              dep1: '1.2.3',
              dep2: '2.3.4'
            }
            break
          case 'dep1':
            dependencies = {
              dep3: '3.4.5'
            }
            break
          case 'dep2':
            dependencies = {}
            break
          case 'dep3':
            dependencies = {
              dep4: '4.5.6',
              dep2: '2.3.4'
            }
            break
          default:
            dependencies = {}
            break
        }
        return {
          dependencies: dependencies,
          matchVersion: version
        }
      })
      const actual = await dependency.computeDependencyTreeForPackage('package', 'latest')
      expect(actual).to.deep.equal({
        package: {
          version: 'latest',
          dependencies: [
            {
              dep1: {
                version: '1.2.3',
                dependencies: [
                  {
                    dep3: {
                      version: '3.4.5',
                      dependencies: [
                        {
                          dep4: {
                            version: '4.5.6',
                            dependencies: []
                          }
                        },
                        {
                          dep2: {
                            version: '2.3.4',
                            dependencies: []
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            },
            {
              dep2: {
                version: '2.3.4',
                dependencies: []
              }
            }
          ]
        }
      })
      expect(_getVersionedDependenciesStub.callCount).to.equal(6)
      expect(getCachedValueStub.callCount).to.equal(0)
      expect(setCachedValueSpy.callCount).to.equal(6)
    })

    it('recursively gets dependencies if not cached', async () => {
      isCachedStub.returns(false)
      _getVersionedDependenciesStub.callsFake(async (name, version) => {
        let dependencies
        switch (name) {
          case 'package':
            dependencies = {
              dep1: '1.2.3',
              dep2: '2.3.4'
            }
            break
          case 'dep1':
            dependencies = {
              dep3: '3.4.5'
            }
            break
          case 'dep2':
            dependencies = {}
            break
          case 'dep3':
            dependencies = {
              dep4: '4.5.6',
              dep2: '2.3.4'
            }
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
        package: {
          version: '1.2.3',
          dependencies: [
            {
              dep1: {
                version: '1.2.3',
                dependencies: [
                  {
                    dep3: {
                      version: '3.4.5',
                      dependencies: [
                        {
                          dep4: {
                            version: '4.5.6',
                            dependencies: []
                          }
                        },
                        {
                          dep2: {
                            version: '2.3.4',
                            dependencies: []
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            },
            {
              dep2: {
                version: '2.3.4',
                dependencies: []
              }
            }
          ]
        }
      })
      expect(_getVersionedDependenciesStub.callCount).to.equal(6)
      expect(getCachedValueStub.callCount).to.equal(0)
      expect(setCachedValueSpy.callCount).to.equal(6)
    })

    it('throws an error when cyclic dependency found', async () => {
      _getVersionedDependenciesStub.callsFake(async (name, version) => {
        let dependencies
        if (name === 'package') {
          dependencies = {
            dep1: '1.2.3',
            package: 'other'
          }
        } else {
          dependencies = {}
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
        expect(_getVersionedDependenciesStub.callCount).to.equal(1)
      }
    })

    it('catches and re-throws an error', async () => {
      _getVersionedDependenciesStub.rejects(new Error('Test'))
      try {
        await dependency.computeDependencyTreeForPackage('package', 'latest')
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Test')
        expect(_getVersionedDependenciesStub.callCount).to.equal(1)
      }
    })
  })
})
