
import { expect } from 'chai'

import { formatError, CustomError } from '../../utils/error'

describe('error.js', () => {
  describe('formatError', () => {
    it('returns a CustomError with a provided status code', () => {
      const err = formatError('test', 404)
      expect(err instanceof CustomError).to.equal(true)
      expect(err.message).to.equal('test')
      expect(err.status).to.equal(404)
    })

    it('returns a CustomError with a default status code of 500 if not provided', () => {
      const err = formatError('test')
      expect(err instanceof CustomError).to.equal(true)
      expect(err.message).to.equal('test')
      expect(err.status).to.equal(500)
    })
  })
})
