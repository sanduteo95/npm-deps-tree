import * as cache from '../persistence/cache'
import logger from '../utils/logger'
import * as utils from '../utils/registry'
import { VERSION_REGEX } from '../utils/validation'
import * as types from '../types'

/**
 * Computes the dependency tree for a given package with a given version.
 * It recursively builds the dependency tree for each dependency until no more dependencies can be found.
 * At the end, it caches the result.
 * If the package was previously cached for the provided version, it is returned without further computation.
 * @param name The name of the package.
 * @param version The version of the package.
 * @returns The formatted dependencies.
 */
export const computeDependencyTreeForPackage = async (name: types.Name, version: types.Version): Promise<types.DependencyTree> => {
  logger.info(`Computing dependency tree for ${name}:${version}`)

  try {
    let actualVersion
    let dependencyTree
    if (version !== 'latest' && cache.isCached(name, version)) {
      logger.info(`Package with name ${name} and version ${version} has been previously cached`)
      dependencyTree = cache.getCachedValue(name, version)
      actualVersion = version
    } else {
      const { dependencies, matchVersion } = await _getVersionedDependencies(name, version)

      // look for cyclic dependency first, to avoid extra computation
      if (_hasCyclicDependency(dependencies, name)) {
        logger.error(`Dependency ${name} self-references itself`)
        throw new Error('Cannot have cyclic dependencies.')
      }

      const promises: Promise<types.DependencyTree>[] = []
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
 * @param dependencies The dependencies.
 * @param name The name of the package.
 * @returns Flag signaling if there is a cyclic dependency.
 * @internal
 */
const _hasCyclicDependency = (dependencies: types.Dependencies, name: types.Name): boolean => {
  return dependencies !== undefined && dependencies[name] !== undefined
}


/**
 * Helper function to get a package's dependencies
 * @param  name The name of the package.
 * @param version The version of the package.
 * @returns An object containing the dependencies and matchVersion: { "dependencies": <>, "matchVersion": <>"}
 * @internal
 */
export const _getVersionedDependencies = async (name: types.Name, version: types.Version): Promise<types.VersionedDependencies> => {
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
