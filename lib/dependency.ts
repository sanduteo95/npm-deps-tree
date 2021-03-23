import * as cache from '../persistence/cache'
import logger from '../utils/logger'
import * as utils from '../utils/registry'
import { VERSION_REGEX } from '../utils/validation'

/**
 * Computes the dependency tree for a given package with a given version.
 * It recursively builds the dependency tree for each dependency until no more dependencies can be found.
 * At the end, it caches the result.
 * If the package was previously cached for the provided version, it is returned without further computation.
 * @param {string} name The name of the package.
 * @param {string} version The version of the package.
 * @returns {Promise<Object>} The formatted dependencies.
 * @function
 */
export const computeDependencyTreeForPackage = async (name, version) => {
  logger.info(`Computing dependency tree for ${name}:${version}`)

  try {
    let actualVersion
    let dependencyTree
    if (version !== 'latest' && cache.isCached(name, version)) {
      logger.info(`Package with name ${name} and version ${version} has been previously cached`)
      dependencyTree = cache.getCachedValue(name, version)
      actualVersion = version
    } else {
      const { dependencies, matchVersion } = await _getPackageDependencies(name, version)

      // look for cyclic dependency first, to avoid extra computation
      if (_hasCyclicDependency(dependencies, name)) {
        logger.error(`Dependency ${name} self-references itself`)
        throw new Error('Cannot have cyclic dependencies.')
      }

      const promises: Promise<any>[] = []
      for (const dependency in dependencies) {
        promises.push(computeDependencyTreeForPackage(dependency, dependencies[dependency]))
      }
      dependencyTree = await Promise.all(promises)

      logger.info(`Caching package with name ${name} and version ${matchVersion}`)
      cache.setCachedValue(name, matchVersion, dependencyTree)
      actualVersion = matchVersion
    }
    return {
      [name]: {
        version: actualVersion,
        dependencies: dependencyTree
      }
    }
  } catch (error) {
    logger.error(`Failed to compute dependency tree for package ${name}`, { err: error })
    throw error
  }
}

/**
 * Helper function for deciding if there's a self-referred dependency in the list of dependencies
 * @param {Object} dependencies The dependencies.
 * @param {string} name The name of the package.
 * @returns {boolean} Flag signaling if there is a cyclic dependency.
 * @inner
 * @function
 */
const _hasCyclicDependency = (dependencies, name) => {
  return dependencies !== undefined && dependencies[name] !== undefined
}

/**
 * Helper function to get a package's dependencies
 * @param {string} name The name of the package.
 * @param {string} version The version of the package.
 * @returns {Promise<Object>} An object containing the dependencies and matchVersion: { "dependencies": <>, "matchVersion": <>"}
 * @inner
 * @function
 */
export const _getPackageDependencies = async (name, version) => {
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
      dependencies: downloadedPackage.dependencies,
      matchVersion: downloadedPackage.version
    }
  } catch (error) {
    logger.error('Failed to retrieve the list of dependencies', { err: error })
    throw error
  }
}