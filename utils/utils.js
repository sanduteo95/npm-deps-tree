const got = require('got')

const cache = require('./cache')
const logger = require('./logger')
const { validateName, validateVersion } = require('./validation')

const REGISTRY_URL = 'https://registry.npmjs.org'

const _downloadPackage = async (name, version) => {
  const url = `${REGISTRY_URL}/${name}/${version}`

  try {
    logger.info(`Calling out to ${url} to download package`)
    const { body } = await got.get(url, { responseType: 'json' })
    logger.info(`Downloaded package ${name}:${version}`)
    if (body.dependencies === undefined) {
      body.dependencies = {}
    }
    return body
  } catch (error) {
    logger.error(`Failed to download package ${name}:${version}`, { err: error.response.body })
    throw new Error(error.response.body)
  }
}

const _formatDependencies = dependencies => {
  // JSON with dependency name as key and version as value
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

const getPackageDependencies = async (name, version) => {
  if (!cache.isCached(name, version)) {
    try {
      logger.info('Retrieving the list of dependencies')
      const { dependencies } = await _downloadPackage(name, version)
      logger.info(`Retrieved ${Object.keys(dependencies).length} dependencies`)

      // TODO: duplicate dependencies are valid?
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
  getPackageDependencies
}
