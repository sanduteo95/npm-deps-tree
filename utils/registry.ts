import got from 'got'
import semver from 'semver'

import logger from './logger'

const REGISTRY_URL = 'https://registry.npmjs.org'
let RETRIES = 5

// Helper function to set retries for tests
export const _setRetries = retries => {
  RETRIES = retries
}

/**
 * Downloads the package with the given version.
 * @param {string} name The name of the package.
 * @param {string} version The version of the package.
 * @returns {Promise<Object>} The package.
 * @function
 */
export const downloadPackageWithVersion = async (name, version) => {
  try {
    const { body } = await _makeRegistryCall(`/${name}/${version}`)
    logger.info(`Downloaded package ${name}:${version}`)
    return body
  } catch (error) {
    logger.error(`Failed to download package ${name}:${version}`, { err: error })
    throw error
  }
}

/**
 * Downloads the package versions and looks for the package that matches the given version.
 * @param {string} name The name of the package.
 * @param {string} version The semver version of the package.
 * @returns {Promise<Object>} The package.
 * @function
 */
export const downloadPackage = async (name, version) => {
  try {
    const { body } = await _makeRegistryCall(`/${name}`)

    const matchingVersion = _getMatchingVersion(body.versions, version)
    if (matchingVersion === undefined) {
      throw new Error(`Could not find matching version for ${name}:${version}`)
    }
    return body.versions[matchingVersion]
  } catch (error) {
    logger.error(`Failed to download package ${name}:${version}`, { err: error })
    throw error
  }
}

/**
 * Helper function to make the registry call
 * @param {string} path The path to call
 * @returns {Promise<any>} The package
 * @inner
 * @function
 */
export const _makeRegistryCall: any = async path => {
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

/**
 * Helper function to find the first matching version in reverse
 * @param {Array} versions The available versions
 * @param {string} version The provided version to match them to
 * @returns {string} The matching version
 * @inner
 * @function
 */
const _getMatchingVersion = (versions, version) => {
  // look at available versions in reverse order and find the first version that matches
  return Object.keys(versions).reverse().find(availableVersion => {
    return semver.satisfies(availableVersion, version)
  })
}