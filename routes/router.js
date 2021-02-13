const express = require('express')

const router = express.Router()

const dependency = require('../lib/dependency')
const { formatError } = require('../utils/error')
const logger = require('../utils/logger')
const { validate } = require('./middleware')

/**
 * Helper function that handles passing over the computation of the dependency tree
 * @param {Object} The Express request.
 * @param {Object} The Express response.
 * @param {Function} The Express next callback.
 * @returns {void}
 * @inner
 * @function
 */
const _handler = async (req, res, next) => {
  logger.info(`Received call to get the dependency tree of package ${req.name}:${req.version}`)
  try {
    const dependencyTree = await dependency.computeDependencyTreeForPackage(req.name, req.version)
    res.send(dependencyTree)
  } catch (error) {
    next(formatError(500, error.message))
  }
}

router.get('/package/:package', validate, _handler)
router.post('/package/:package', validate, _handler)

module.exports = router
