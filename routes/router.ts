import express, { Request, Response, NextFunction } from 'express'

import * as dependency from '../lib/dependency'
import { formatError } from '../utils/error'
import logger from '../utils/logger'
import { validate } from './middleware'

import '../types'

const router = express.Router()

/**
 * Helper function that handles passing over the computation of the dependency tree
 * @param req The Express request.
 * @param res The Express response.
 * @param next The Express next callback.
 * @internal
 */
const _handler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  logger.info(`Received call to get the dependency tree of package ${req.name}:${req.version}`)
  try {
    const dependencyTree = await dependency.computeDependencyTreeForPackage(req.name, req.version)
    res.send(dependencyTree)
  } catch (error) {
    next(formatError(error.message, 500))
  }
}

router.get('/package/:package', validate, _handler)
router.post('/package/:package', validate, _handler)

export default router
