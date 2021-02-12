const dependency = require('./dependency')

const logger = require('../utils/logger')

/**
 * Computes the dependency tree for a given package with a given version.
 * It recursively builds the dependency tree for each dependency until no more can be found.
 * @param {string} name The name of the package.
 * @param {string} version The version of the package.
 * @param {boolean} useSemver Flag to tell if we want to try to resolve complex semver versions.
 * @returns {string} The formatted dependencies.
 */
const computeDependencyTreeForPackage = async (name, version, useSemver) => {
  logger.info(`Computing dependency tree for ${name}:${version}`)

  try {
    const dependencies = await dependency.getPackageDependencies(name, version, useSemver)
    const promisedDependencies = dependencies.map(async dependency => {
      if (dependency.name === name) {
        logger.error(`Dependency ${name} self-references itself`)
        throw new Error('Cannot have cycling dependencies.')
      }
      return computeDependencyTreeForPackage(dependency.name, dependency.version, useSemver)
    })
    return {
      name: name,
      version: version,
      dependencies: await Promise.all(promisedDependencies)
    }
  } catch (error) {
    logger.error(`Failed to compute dependency tree for package ${name}`, { err: error })
    throw error
  }
}

module.exports = {
  computeDependencyTreeForPackage: computeDependencyTreeForPackage
}
