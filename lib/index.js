const utils = require('../utils/utils')

const logger = require('../utils/logger')

const computeDependencyTreeForPackage = async (name, version) => {
  // ASSUMPTION: This is for production code so we don't actually care about devDependencies

  try {
    const dependencies = await utils.getPackageDependencies(name, version)
    const promisedDependencies = dependencies.map(async dependency => {
      if (dependency.name === name) {
        throw new Error('Cannot have cycling dependencies.')
      }
      return computeDependencyTreeForPackage(dependency.name, dependency.version)
    })
    return {
      name: name,
      version: version,
      dependencies: await Promise.all(promisedDependencies)
    }
  } catch (error) {
    console.log(error)
    logger.error(`Failed to compute dependency tree for package ${name}`, { err: error })
    throw error
  }
}

module.exports = {
  computeDependencyTreeForPackage: computeDependencyTreeForPackage
}
