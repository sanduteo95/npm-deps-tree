const { getPackageDependencies } = require('../utils/utils')

const logger = require('../utils/logger')

const computeDependencyTreeForPackage = async (name, version) => {
  // ASSUMPTION: This is for production code so we don't actually care about devDependencies

  try {
    const dependencies = await getPackageDependencies(name, version)
    const promisedDependencies = dependencies.map(dependency => computeDependencyTreeForPackage(dependency.name, dependency.version))
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
