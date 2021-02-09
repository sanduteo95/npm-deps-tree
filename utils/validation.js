const validate = require('validate-npm-package-name')
const semver = require('semver')

const logger = require('./logger')

const validateName = name => {
  const { validForNewPackages, validForOldPackages } = validate(name)
  if (validForNewPackages || validForOldPackages) {
    return name
  } else {
    logger.error('Name is not a valid NPM package name.')
    throw new Error('Name is not a valid NPM package name.')
  }
}

// Formats and validates the version based on semver rules: https://docs.npmjs.com/about-semantic-versioning
const validateVersion = version => {
  // latest is allowed
  if (version === 'latest') {
    return version
  }

  logger.info(`Original version was ${version}`)
  // TODO: remove semver and improve this logic
  semver.clean(version)
  // semver does not deal with ~, <=, etc. so need extra cleanup
  if (version.indexOf('<') > 0) {
    version = version.substring(0, version.indexOf('<'))
  }
  // eslint-disable-next-line
  version = version.replace(/[^0-9\.\x\*]/g, '')
  logger.info(`Version was cleaned up from to ${version}`)

  const minorVersions = version.split('.') || []
  if (minorVersions.length !== 3) {
    logger.error(`Not fully specified versions are not accepted. Needs to have the following format "x.x.x" but had "${version}"`)
    throw new Error('The version needs to be fully specified.')
  }

  if (minorVersions[0] === 'x' || minorVersions[0] === '*' ||
        minorVersions[1] === 'x' || minorVersions[1] === '*') {
    logger.error(`This format of the version is not accepted. Can only use * and x for the minor version but had "${version}".`)
    throw new Error('Major versions cannot be specified with x and *.')
  }

  // remove leading 0s
  return minorVersions.map(minVersion => minVersion === '0' ? minVersion : minVersion.replaceAll(/^0+/g, '')).join('.')
}

module.exports = {
  validateName,
  validateVersion
}
