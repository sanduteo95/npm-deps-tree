const got = require('got')

const logger = require('./logger')

const REGISTRY_URL = 'https://registry.npmjs.org'
let RETRIES = 5

// Helper function to set retries for tests
const _setRetries = retries => {
  RETRIES = retries
}

const makeRegistryCall = async path => {
  const url = `${REGISTRY_URL}${path}`
  try {
    logger.info(`Calling out to ${url}`)
    return await got.get(url, { responseType: 'json', retries: RETRIES })
  } catch (error) {
    /* istanbul ignore next */
    if (error.response && error.response.body) {
      throw new Error(error.response.body)
    } else if (error instanceof Error) {
      throw error
    } else {
      throw new Error(error)
    }
  }
}

module.exports = {
  makeRegistryCall,
  internal: {
    _setRetries
  }
}
