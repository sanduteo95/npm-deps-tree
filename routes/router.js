const express = require('express')

const router = express.Router()

const dependency = require('../lib/dependency')
const { formatError } = require('../utils/error')
const logger = require('../utils/logger')
const { validate } = require('./middleware')

/**
 * Helper function that handles passing over the computation of the dependency tree
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @param {Function} next The Express next callback.
 * @returns {Promise<void>}
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
