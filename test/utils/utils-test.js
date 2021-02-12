/* eslint-disable no-unused-expressions */
const chai = require('chai')
const expect = chai.expect
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
const nock = require('nock')

const utils = require('../../utils/utils')

describe('utils.js', () => {
  describe('makeRegistryCall', () => {
    before(() => {
      utils.internal._setRetries(0)
    })

    it('returns response if call succeeds', async () => {
      const response = {
        foo: 'bar'
      }
      nock('https://registry.npmjs.org')
        .get('/test')
        .reply(200, response)
      const { body } = await (utils.makeRegistryCall('/test'))
      expect(body).to.deep.equal(response)
    })

    it('throws an error if call fails', async () => {
      try {
        nock('https://registry.npmjs.org')
          .get('/test')
          .replyWithError('Test')
        await (utils.makeRegistryCall('/test'))
        expect('Test should fail').to.be.true
      } catch (err) {
        expect(err.message).to.equal('Test')
      }
    })
  })
})
