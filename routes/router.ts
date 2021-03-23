import express from 'express'

import * as dependency from '../lib/dependency'
import { formatError } from '../utils/error'
import logger from '../utils/logger'
import { validate } from './middleware'

const router = express.Router()

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

export default router
