import NodeCache from 'node-cache'
const cache = new NodeCache()

let EXPIRY = 60 * 60 * 24 // 24h cache expiry

// only used for testing
export const _setExpiry = (expiry: number): void => {
  EXPIRY = expiry
}

// only used for testing
export const _clear = (): void => {
  cache.flushAll()
}

/**
 * Helper function to compute the key stored in the cache from the name and version
 * @param name The name.
 * @param version The version.
 * @returns The resulting key: "<name>:<version>".
 * @internal
 */
const _getKey = (name: string, version: string): string => {
  return `${name}:${version}`
}

/**
 * Checks if there is a cached value for the name and version pair.
 * @param name The name of the package.
 * @param version The version of the package.
 * @returns Whether it is cached or not.
 */
export const isCached = (name: string, version: string): boolean => {
  return cache.has(_getKey(name, version))
}

/**
 * Retrieves the cached value for the name and version pair.
 * @param name The name of the package.
 * @param version The version of the package.
 * @returns The cached value for the given name and version pair.
 */
export const getCachedValue = (name: string, version: string): (PackageDependencyTree | undefined) => {
  return cache.get(_getKey(name, version))
}

/**
 * Sets the cached value for the name and version pair.
 * @param name The name of the package.
 * @param version The version of the package.
 * @Param value The value to cache.
 */
export const setCachedValue = (name: string, version: string, value: PackageDependencyTree): void => {
  cache.set(_getKey(name, version), value, EXPIRY)
}