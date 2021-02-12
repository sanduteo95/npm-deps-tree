const NodeCache = require('node-cache')
const cache = new NodeCache()

let EXPIRY = 60 * 60 * 24 // 24h cache expiry

// only used for testing
const _setExpiry = (expiry) => {
  EXPIRY = expiry
}

// only used for testing
const _clear = () => {
  cache.flushAll()
}

// helper function to compute the key stored in the cache
const _getKey = (name, version) => {
  return `${name}:${version}`
}

/**
 * Checks if there is a cached value for the name and version pair.
 * @param {string} name The name of the package.
 * @param {string} version The version of the package.
 * @returns {boolean} Whether it is cached or not.
 */
const isCached = (name, version) => {
  return cache.has(_getKey(name, version))
}

/**
 * Retrieves the cached value for the name and version pair.
 * @param {string} name The name of the package.
 * @param {string} version The version of the package.
 * @returns {Object} The cached value for the given name and version pair.
 */
const getCachedValue = (name, version) => {
  return cache.get(_getKey(name, version))
}

/**
 * Sets the cached value for the name and version pair.
 * @param {string} name The name of the package.
 * @param {string} version The version of the package.
 * @returns {void}
 */
const setCachedValue = (name, version, value) => {
  cache.set(_getKey(name, version), value, EXPIRY)
}

module.exports = {
  isCached,
  getCachedValue,
  setCachedValue,
  internal: {
    _setExpiry,
    _clear
  }
}
