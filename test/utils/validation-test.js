/* eslint-disable no-unused-expressions */
const expect = require('chai').expect

const { validateName, validateVersion } = require('../../utils/validation')

describe('validation.js', () => {
  describe('validateName', () => {
    it('throws an error if name is not valid', () => {
      expect(validateName.bind(validateName, ' test')).to.throw('Name is not a valid NPM package name.')
    })

    it('returns the name if it is valid', () => {
      expect(validateName('test')).to.equal('test')
    })
  })

  describe('validateVersion', () => {
    it('returns the version if it is "latest"', () => {
      expect(validateVersion('latest')).to.equal('latest')
    })

    describe('throws an error if version is invalid', () => {
      it('1.2', () => {
        expect(validateVersion.bind(validateVersion, '1.2')).to.throw('The version needs to be fully specified.')
      })

      it('1', () => {
        expect(validateVersion.bind(validateVersion, '1')).to.throw('The version needs to be fully specified.')
      })

      it('1.x.3', () => {
        expect(validateVersion.bind(validateVersion, '1.x.3')).to.throw('Major versions cannot be specified with x and *.')
      })

      it('x.2.3', () => {
        expect(validateVersion.bind(validateVersion, 'x.2.3')).to.throw('Major versions cannot be specified with x and *.')
      })

      it('1.*.3', () => {
        expect(validateVersion.bind(validateVersion, '1.*.3')).to.throw('Major versions cannot be specified with x and *.')
      })

      it('*.2.3', () => {
        expect(validateVersion.bind(validateVersion, '*.2.3')).to.throw('Major versions cannot be specified with x and *.')
      })

      it('empty', () => {
        expect(validateVersion.bind(validateVersion, 'empty')).to.throw('The version needs to be fully specified.')
      })
    })

    describe('cleans up the version', () => {
      it('~1.2.3', () => {
        expect(validateVersion('~1.2.3')).to.equal('1.2.3')
      })

      it('^1.2.3', () => {
        expect(validateVersion('^1.2.3')).to.equal('1.2.3')
      })

      it('^1.2.3', () => {
        expect(validateVersion('^1.2.3')).to.equal('1.2.3')
      })

      it('>=1.2.3 <2', () => {
        expect(validateVersion('>=1.2.3 <2')).to.equal('1.2.3')
      })

      it('01.02.03', () => {
        expect(validateVersion('01.02.03')).to.equal('1.2.3')
      })
    })

    describe('returns the version if it is valid', () => {
      it('1.2.3', () => {
        expect(validateVersion('1.2.3')).to.equal('1.2.3')
      })

      it('1.2.*', () => {
        expect(validateVersion('1.2.*')).to.equal('1.2.*')
      })

      it('1.2.x', () => {
        expect(validateVersion('1.2.x')).to.equal('1.2.x')
      })

      it('1.2.0', () => {
        expect(validateVersion('1.2.0')).to.equal('1.2.0')
      })

      it('1.0.0-rc3', () => {
        expect(validateVersion('1.0.0-rc3')).to.equal('1.0.0-rc3')
      })
    })
  })
})
