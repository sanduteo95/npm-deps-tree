const validate = require('validate-npm-package-name')
const semver = require('semver')

const logger = require('./logger')

/**
 * Validates the name and throws and error if it's invalid by NPM standard.
 * Throws an error if invalid.
 * @param {string} name The name of the package.
 * @returns {string} The validated name or throws an error.
 */
const validateName = name => {
  const { validForNewPackages, validForOldPackages } = validate(name)
  if (validForNewPackages || /* istanbul ignore next */ validForOldPackages) {
    return name
  } else {
    logger.error('Name is not a valid NPM package name.')
    throw new Error('Name is not a valid NPM package name.')
  }
}

// Helper function to cleanup the version
const _cleanupVersion = version => {
  logger.info(`Original version was ${version}`)

  // TODO: semver allows complex logic
  // e.g. 1.x || >=2.5.0 || 5.0.0 - 7.2.3
  // why reinvent the wheel?
  if (version.indexOf('<') > 0) {
    version = version.substring(0, version.indexOf('<'))
  }

  // eslint-disable-next-line
  version = version.replace(/[^0-9a-zA-Z\-\.\x\*]/g, '')
  logger.info(`Cleaned up version is ${version}`)

  return version
}

// Helper version to further cleanup the version and remove leading zeros
const _removeLeadingZeroes = minVersion => {
  return minVersion === '0' || minVersion.charAt(1) === '-'
    ? minVersion
    : minVersion.replaceAll(/^0+/g, '')
}

/**
 * Formats and validates the version based on semver rules: https://docs.npmjs.com/about-semantic-versioning.
 * @param {string} version The version of the package.
 * @returns {string} The validated version or throws an error.
 */
//
const validateVersion = version => {
  // latest is allowed
  if (version === 'latest') {
    return version
  }

  version = _cleanupVersion(version)

  const minorVersions = version.split('.') || /* istanbul ignore next */[]
  if (minorVersions.length !== 3) {
    logger.error(`Not fully specified versions are not accepted. Needs to have the following format "x.x.x" but had "${version}"`)
    throw new Error('The version needs to be fully specified.')
  }

  if (minorVersions[0] === '' || minorVersions[0] === 'x' || minorVersions[0] === '*' ||
      minorVersions[1] === '' || minorVersions[1] === 'x' || minorVersions[1] === '*' ||
      minorVersions[2] === '') {
    logger.error(`This format of the version is not accepted. Can only use * and x for the minor version but had "${version}".`)
    throw new Error('Major versions cannot be specified with x and *.')
  }

  return minorVersions.map(_removeLeadingZeroes).join('.')
}

const versionsMatch = (availableVersion, version) => {
  logger.info(`Checking if ${availableVersion} matches ${version}: ${semver.satisfies(availableVersion, version)}`)
  return semver.satisfies(availableVersion, version)
}

module.exports = {
  validateName,
  validateVersion,
  versionsMatch
}
