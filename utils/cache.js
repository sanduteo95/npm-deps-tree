const NodeCache = require('node-cache')
const cache = new NodeCache()

const EXPIRY = 60 * 60 * 24 // 24h cache expiry

const _getKey = (name, version) => {
  return `${name}:${version}`
}

const isCached = (name, version) => {
  const value = cache.get(_getKey(name, version))
  if (value === undefined) {
    return false
  }
  return true
}

const getCachedValue = (name, version) => {
  return cache.get(_getKey(name, version))
}

const setCachedValue = (name, version, value) => {
  cache.set(_getKey(name, version), value, EXPIRY)
}

module.exports = {
  isCached,
  getCachedValue,
  setCachedValue
}
