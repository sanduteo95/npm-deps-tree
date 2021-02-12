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
    const dependencies = await module.exports.internal._getPackageDependencies(name, version)

    // look for cyclic dependency first, to avoid extra computation
    if (_hasCyclicDependency(dependencies, name)) {
      logger.error(`Dependency ${name} self-references itself`)
      throw new Error('Cannot have cyclic dependencies.')
    }

    return {
      name: name,
      version: version,
      dependencies: await Promise.all(dependencies.map(async dependency =>
        computeDependencyTreeForPackage(dependency.name, dependency.version)
      ))
    }
  } catch (error) {
    logger.error(`Failed to compute dependency tree for package ${name}`, { err: error })
    throw error
  }
}

// Helper function for deciding if there's a self-referred dependency in the list of dependencies
const _hasCyclicDependency = (dependencies, name) => {
  const cyclicDependency = dependencies.find(dependency => {
    if (dependency.name === name) {
      return name
    }
    return undefined
  })

  return cyclicDependency !== undefined
}

// Helper function to either use the cache or call download a package
const _getPackageDependencies = async (name, version) => {
  if (!cache.isCached(name, version)) {
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
      const formattedDependencies = _formatDependencies(downloadedPackage.dependencies)
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

// Helper function to format dependencies into arrays of objects:
// { "name": <dependency name>, "version": <dependency version>"}
const _formatDependencies = (dependencies) => {
  if (dependencies === undefined) {
    dependencies = {}
  }
  logger.info(`Formatting ${Object.keys(dependencies).length} dependencies`)
  return Object.keys(dependencies).map(name => {
    const version = dependencies[name]
    logger.info(`Formating dependency ${name}:${version}`)
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
