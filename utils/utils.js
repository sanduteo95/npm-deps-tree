const got = require('got')

const cache = require('./cache')
const logger = require('./logger')
const { validateName, validateVersion } = require('./validation')

const REGISTRY_URL = 'https://registry.npmjs.org'
let RETRIES = 5

// Helper function to set retries for tests
const _setRetries = retries => {
  RETRIES = retries
}

// Helper function to download a package from the npmjs registry
const _downloadPackage = async (name, version) => {
  const url = `${REGISTRY_URL}/${name}/${version}`

  try {
    logger.info(`Calling out to ${url} to download package`)
    const { body } = await got.get(url, { responseType: 'json', retries: RETRIES })
    logger.info(`Downloaded package ${name}:${version}`)
    if (body.dependencies === undefined) {
      body.dependencies = {}
    }
    return body
  } catch (error) {
    logger.error(`Failed to download package ${name}:${version}`, { err: error })
    /* istanbul ignore next */
    if (typeof error === 'string') {
      throw new Error(error)
    } /* istanbul ignore next */ else if (error.response && error.response.body) {
      throw new Error(error.response.body)
    } else {
      throw new Error(JSON.stringify(error))
    }
  }
}

// Helper function to format dependencies into arrays of objects:
// { "name": <dependency name>, "version": <dependency version>"}
const _formatDependencies = dependencies => {
  try {
    return Object.keys(dependencies).map(name => {
      const version = dependencies[name]
      return {
        name: validateName(name),
        version: validateVersion(version)
      }
    })
  } catch (error) {
    logger.info('Found an invalid version. Failing the call.')
    throw error
  }
}

/**
 * Retrives the depdendencies for a package with given name and version.
 * If cached, then retrieves the cached version.
 * If not, it sets the newly computed set of dependencies.
 * @param {string} name The name of the package.
 * @param {string} version The version of the package.
 * @returns {string} The formatted dependencies.
 */
const getPackageDependencies = async (name, version) => {
  if (!cache.isCached(name, version)) {
    try {
      logger.info('Retrieving the list of dependencies')
      const { dependencies } = await module.exports.internal._downloadPackage(name, version)
      logger.info(`Retrieved ${Object.keys(dependencies).length} dependencies`)

      // TODO: are duplicate dependencies valid?
      const formattedDependencies = _formatDependencies(dependencies)
      cache.setCachedValue(name, version, formattedDependencies)
      return formattedDependencies
    } catch (error) {
      logger.error('Failed to retrieve the list of dependencies', { err: error })
      throw error
    }
  } else {
    return cache.getCachedValue(name, version)
  }
}

module.exports = {
  getPackageDependencies,
  internal: {
    _setRetries,
    _downloadPackage
  }
}
