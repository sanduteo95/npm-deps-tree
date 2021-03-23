import { expect } from 'chai'

import * as cache from '../../persistence/cache'

describe('cache.js', () => {
  const value = {
    foo: 'bar'
  }

  describe('isCached', () => {
    afterEach(() => {
      cache._clear()
    })

    it('returns false if package is not in cache', () => {
      expect(cache.isCached('test', 'v1')).to.be.false
    })

    it('returns false if package with given version is not in cache', () => {
      cache.setCachedValue('test', 'v1', 'value')
      expect(cache.isCached('test', 'v2')).to.be.false
    })

    it('returns true if package with given version is in cache', () => {
      cache.setCachedValue('test', 'v1',  'value')
      expect(cache.isCached('test', 'v1')).to.be.true
    })
  })

  describe('getCachedValue', () => {
    beforeEach(() => {
      cache.setCachedValue('test', 'v1', value)
    })

    afterEach(() => {
      cache._clear()
    })

    it('returns the cached value if exists', () => {
      expect(cache.getCachedValue('test', 'v1')).to.deep.equal(value)
    })

    it('returns undefined if cached value does not exist', () => {
      expect(cache.getCachedValue('test', 'v2')).to.be.undefined
    })
  })

  describe('setCachedValue', () => {
    afterEach(() => {
      cache._clear()
    })

    it('returns the cached value', () => {
      cache.setCachedValue('test', 'v1', value)
      expect(cache.getCachedValue('test', 'v1')).to.deep.equal(value)
    })

    it('resets the value after the expiry time', () => {
      cache._setExpiry(3) // 3 seconds
      cache.setCachedValue('test', 'v1', value)
      expect(cache.getCachedValue('test', 'v1')).to.deep.equal(value)
      setTimeout(() => {
        expect(cache.getCachedValue('test', 'v1')).to.be.undefined
      }, 3000)
    })
  })
})
