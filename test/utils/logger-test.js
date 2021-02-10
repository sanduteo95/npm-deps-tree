const expect = require('chai').expect

const logger = require('../../utils/logger')

describe('logger.js', () => {
  it('exports a logger', () => {
    expect(logger).to.not.equal(undefined)
    expect(logger).to.have.property('info')
    expect(logger).to.have.property('error')
  })
})
