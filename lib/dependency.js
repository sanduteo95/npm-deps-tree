const cache = require('../utils/cache')
const logger = require('../utils/logger')
const utils = require('../utils/utils')
const { validateName, validateVersion, versionsMatch } = require('../utils/validation')

/**
 * Retrives the dependencies for a package with given name and version.
 * If cached, then retrieves the cached version.
 * If not, it sets the newly computed set of dependencies.
 * @param {string} name The name of the package.
 * @param {string} version The version of the package.
 * @param {boolean} useSemver Flag to tell if we want to try to resolve complex semver versions.
 * @returns {string} The formatted dependencies.
 */
const getPackageDependencies = async (name, version, useSemver) => {
  if (!cache.isCached(name, version)) {
    try {
      logger.info('Retrieving the list of dependencies')
      let downloadedPackage
      /* istanbul ignore next */
      if (!useSemver || version === 'latest' || /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)/.test(version)) {
        downloadedPackage = await module.exports.internal._downloadPackageWithVersion(name, version)
      } else {
        downloadedPackage = await module.exports.internal._downloadPackage(name, version)
      }

      if (downloadedPackage.dependencies === undefined) {
        downloadedPackage.dependencies = {}
      }

      // ASSUMPTION: This is for production code so we don't actually care about devDependencies
      logger.info(`Retrieved ${Object.keys(downloadedPackage.dependencies).length} dependencies`)
      const formattedDependencies = _formatDependencies(downloadedPackage.dependencies, useSemver)
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

// Helper function to download a package with a given version from the npmjs registry
const _downloadPackageWithVersion = async (name, version) => {
  try {
    const { body } = await utils.makeRegistryCall(`/${name}/${version}`)
    logger.info(`Downloaded package ${name}:${version}`)
    return body
  } catch (error) {
    logger.error(`Failed to download package ${name}:${version}`, { err: error })
    throw error
  }
}

// Helper function to download a package from the npmjs registry and find appropriate version
const _downloadPackage = async (name, version) => {
  try {
    const { body } = await utils.makeRegistryCall(`/${name}`)

    // look at available versions in reverse order
    const matchingVersion = Object.keys(body.versions).slice(0).reverse().find(availableVersion => {
      return versionsMatch(availableVersion, version)
    })

    if (matchingVersion === undefined) {
      throw new Error(`Could not find matching version for ${name}:${version}`)
    }

    return body.versions[matchingVersion]
  } catch (error) {
    logger.error(`Failed to download package ${name}:${version}`, { err: error })
    throw error
  }
}

// Helper function to format dependencies into arrays of objects:
// { "name": <dependency name>, "version": <dependency version>"}
// If useSemver is false, then we further validate the version
const _formatDependencies = (dependencies, useSemver) => {
  try {
    return Object.keys(dependencies).map(name => {
      const version = dependencies[name]
      logger.info(`Formating dependency ${name}:${version}`)
      return {
        name: validateName(name),
        version: useSemver ? version : validateVersion(version)
      }
    })
  } catch (error) {
    logger.info('Found an invalid version. Failing the call.')
    throw error
  }
}

module.exports = {
  getPackageDependencies,
  internal: {
    _downloadPackageWithVersion,
    _downloadPackage
  }
}
