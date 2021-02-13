const cache = require('../persistence/cache')
const logger = require('../utils/logger')
const utils = require('../utils/registry')
const { VERSION_REGEX } = require('../utils/validation')

/**
 * Computes the dependency tree for a given package with a given version.
 * It recursively builds the dependency tree for each dependency until no more can be found.
 * @param {string} name The name of the package.
 * @param {string} version The version of the package.
 * @returns {Object} The formatted dependencies.
 */
const computeDependencyTreeForPackage = async (name, version) => {
  logger.info(`Computing dependency tree for ${name}:${version}`)

  try {
    let actualVersion
    let dependencyTree
    if (version !== 'latest' && cache.isCached(name, version)) {
      logger.info(`Package with name ${name} and version ${version} has been previously cached`)
      dependencyTree = cache.getCachedValue(name, version)
      actualVersion = version
    } else {
      const { dependencies, matchVersion } = await module.exports.internal._getPackageDependencies(name, version)

      // look for cyclic dependency first, to avoid extra computation
      if (_hasCyclicDependency(dependencies, name)) {
        logger.error(`Dependency ${name} self-references itself`)
        throw new Error('Cannot have cyclic dependencies.')
      }

      dependencyTree = await Promise.all(dependencies.map(async dependency =>
        computeDependencyTreeForPackage(dependency.name, dependency.version)
      ))
      logger.info(`Caching package with name ${name} and version ${matchVersion}`)
      cache.setCachedValue(name, matchVersion, dependencyTree)
      actualVersion = matchVersion
    }
    return {
      name: name,
      version: actualVersion,
      dependencies: dependencyTree
    }
  } catch (error) {
    logger.error(`Failed to compute dependency tree for package ${name}`, { err: error })
    throw error
  }
}

// Helper function for deciding if there's a self-referred dependency in the list of dependencies
const _hasCyclicDependency = (dependencies, name) => {
  return Object.keys(dependencies).includes(name)
}

// Helper function to get a package's dependencies
const _getPackageDependencies = async (name, version) => {
  try {
    logger.info('Retrieving the list of dependencies')
    let downloadedPackage

    /* istanbul ignore next */
    if (version === 'latest' || VERSION_REGEX.test(version)) {
      // If version is resolved, get the package directly
      downloadedPackage = await utils.downloadPackageWithVersion(name, version)
    } else {
      // If not, then find the corresponding version
      downloadedPackage = await utils.downloadPackage(name, version)
    }

    // ASSUMPTION: This is for production code so we don't actually care about devDependencies
    return {
      dependencies: _formatDependencies(downloadedPackage.dependencies),
      matchVersion: downloadedPackage.version
    }
  } catch (error) {
    logger.error('Failed to retrieve the list of dependencies', { err: error })
    throw error
  }
}

// Helper function to format dependencies into arrays of objects:
// { "name": <dependency name>, "version": <dependency version>"}
const _formatDependencies = dependencies => {
  if (dependencies === undefined) {
    dependencies = {}
  }
  return Object.keys(dependencies).map(name => {
    const version = dependencies[name]
    return {
      name: name,
      version: version
    }
  })
}

module.exports = {
  computeDependencyTreeForPackage,
  internal: {
    _getPackageDependencies
  }
}