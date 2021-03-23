import { expect } from 'chai'

import { validateName, validateVersion } from '../../utils/validation'

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
        expect(validateVersion.bind(validateVersion, '1.2')).to.throw('The version is invalid.')
      })

      it('1', () => {
        expect(validateVersion.bind(validateVersion, '1')).to.throw('The version is invalid.')
      })

      it('1.x.3', () => {
        expect(validateVersion.bind(validateVersion, '1.x.3')).to.throw('The version is invalid.')
      })

      it('x.2.3', () => {
        expect(validateVersion.bind(validateVersion, 'x.2.3')).to.throw('The version is invalid.')
      })

      it('1.*.3', () => {
        expect(validateVersion.bind(validateVersion, '1.*.3')).to.throw('The version is invalid.')
      })

      it('*.2.3', () => {
        expect(validateVersion.bind(validateVersion, '*.2.3')).to.throw('The version is invalid.')
      })

      it('empty', () => {
        expect(validateVersion.bind(validateVersion, 'empty')).to.throw('The version is invalid.')
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
