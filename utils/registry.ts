import got from 'got'
import semver from 'semver'

import logger from './logger'
import * as types from '../types'

const REGISTRY_URL = 'https://registry.npmjs.org'
let RETRIES = 5

// Helper function to set retries for tests
export const _setRetries = (retries: number): void => {
  RETRIES = retries
}

/**
 * Downloads the package with the given version.
 * @param name The name of the package.
 * @param version The version of the package.
 * @returns The package.
 */
export const downloadPackageWithVersion = async (name: types.Name, version: types.Version): Promise<types.Package> => {
  try {
    const body = await _makeRegistryCall(`/${name}/${version}`)
    logger.info(`Downloaded package ${name}:${version}`)
    return body
  } catch (error) {
    logger.error(`Failed to download package ${name}:${version}`, { err: error })
    throw error
  }
}

/**
 * Downloads the package versions and looks for the package that matches the given version.
 * @param name The name of the package.
 * @param version The semver version of the package.
 * @returns The package.
 */
export const downloadPackage = async (name: types.Name, version: types.Version): Promise<types.Package> => {
  try {
    const body = await _makeRegistryCall(`/${name}`)

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
 * @param path The path to call
 * @returns The package
 * @internal
 */
export const _makeRegistryCall = async (path: string): Promise<types.Package> => {
  const url = `${REGISTRY_URL}${path}`
  try {
    logger.info(`Calling out to ${url}`)
    const response = await got.get<types.Package>(url, { responseType: 'json', retry: RETRIES })
    return response.body
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
 * @param versions The available versions
 * @param version The provided version to match them to
 * @returns The matching version
 * @internal
 */
const _getMatchingVersion = (versions: types.Versions, version: types.Version): (string | undefined) => {
  // look at available versions in reverse order and find the first version that matches
  return Object.keys(versions).reverse().find(availableVersion => {
    return semver.satisfies(availableVersion, version)
  })
}