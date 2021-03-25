import NodeCache from 'node-cache'

import * as types from '../types'

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
const _getKey = (name: types.Name, version: types.Version): string => {
  return `${name}:${version}`
}

/**
 * Checks if there is a cached value for the name and version pair.
 * @param name The name of the package.
 * @param version The version of the package.
 * @returns Whether it is cached or not.
 */
export const isCached = (name: types.Name, version: types.Version): boolean => {
  return cache.has(_getKey(name, version))
}

/**
 * Retrieves the cached value for the name and version pair.
 * @param name The name of the package.
 * @param version The version of the package.
 * @returns The cached value for the given name and version pair.
 */
export const getCachedValue = (name: types.Name, version: types.Version): (types.DependencyTree[] | undefined) => {
  return cache.get(_getKey(name, version))
}

/**
 * Sets the cached value for the name and version pair.
 * @param name The name of the package.
 * @param version The version of the package.
 * @Param value The value to cache.
 */
export const setCachedValue = (name: types.Name, version: types.Version, value: types.DependencyTree[]): void => {
  cache.set(_getKey(name, version), value, EXPIRY)
}