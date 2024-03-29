import validate from 'validate-npm-package-name'

import logger from './logger'
import * as types from '../types'

export const VERSION_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|\*||x\[1-9]\d*)(-[a-zA-Z\d][-a-zA-Z.\d]*)?(\+[a-zA-Z\d][-a-zA-Z.\d]*)?/

/**
 * Validates the name and throws and error if it's invalid by NPM standard.
 * Throws an error if invalid.
 * @param name The name of the package.
 * @returns The validated name or throws an error.
 */
export const validateName = (name: types.Name): types.Name => {
  const { validForNewPackages, validForOldPackages } = validate(name)
  if (validForNewPackages || /* istanbul ignore next */ validForOldPackages) {
    return name
  } else {
    logger.error('Name is not a valid NPM package name.')
    throw new Error('Name is not a valid NPM package name.')
  }
}

/**
 * Formats and validates the version based on semver rules: https://docs.npmjs.com/about-semantic-versioning.
 * @param version The version of the package.
 * @returns The validated version or throws an error.
 */
export const validateVersion = (version: types.Version): types.Version => {
  // latest is allowed
  if (version === 'latest' || VERSION_REGEX.test(version)) {
    return version
  }

  logger.error(`Version ${version} is invalid`)
  throw new Error('The version is invalid.')
}
