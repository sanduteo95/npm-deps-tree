/* eslint-disable no-unused-expressions */
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')

const { computeDependencyTreeForPackage } = require('../../lib/index')
const dependency = require('../../lib/dependency')

describe('index.js', () => {
  let getPackageDependenciesStub

  beforeEach(() => {
    getPackageDependenciesStub = sinon.stub(dependency, 'getPackageDependencies')
  })

  afterEach(() => {
    getPackageDependenciesStub.restore()
  })

  describe('computeDependencyTreeForPackage', () => {
    it('recursively gets dependencies', async () => {
      getPackageDependenciesStub.callsFake(async (name, version) => {
        switch (name) {
          case 'package':
            return [
              {
                name: 'dep1',
                version: '1.2.3'
              },
              {
                name: 'dep2',
                version: '2.3.4'
              }
            ]
          case 'dep1':
            return [
              {
                name: 'dep3',
                version: '3.4.5'
              }
            ]
          case 'dep2':
            return []
          case 'dep3':
            return [
              {
                name: 'dep4',
                version: '4.5.6'
              },
              {
                name: 'dep2',
                version: '2.3.4'
              }
            ]
          default:
            return []
        }
      })
      const actual = await computeDependencyTreeForPackage('package', 'latest')
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
      expect(getPackageDependenciesStub.callCount).to.equal(6)
    })

    it('throws an error when cycling dependency found', async () => {
      getPackageDependenciesStub.callsFake(async (name, version) => {
        switch (name) {
          case 'package':
            return [
              {
                name: 'dep1',
                version: '1.2.3'
              },
              {
                name: 'package',
                version: 'other'
              }
            ]
          default:
            return []
        }
      })
      try {
        await computeDependencyTreeForPackage('package', 'latest')
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Cannot have cycling dependencies.')
        expect(getPackageDependenciesStub.callCount).to.equal(2)
      }
    })

    it('catches and re-throws an error', async () => {
      getPackageDependenciesStub.rejects(new Error('Test'))
      try {
        await computeDependencyTreeForPackage('package', 'latest')
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Test')
        expect(getPackageDependenciesStub.callCount).to.equal(1)
      }
    })
  })
})
