
import { formatError, CustomError } from '../utils/error'
import logger from '../utils/logger'
import { validateName, validateVersion } from '../utils/validation'
import { Request, Response, NextFunction } from 'express'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      name: string
      version: string
    }
  }
}
/**
 * Middleware for validating the package name and version
 * @param req The Express request.
 * @param res The Express response.
 * @param next The Express next callback.
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  logger.info(`Running validation middleware on ${req.params.package}:${req.body !== undefined && req.body.version !== undefined ? req.body.version : 'latest'}`)
  try {
    logger.info('Validating package name and version')
    req.name = validateName(req.params.package)
    req.version = req.body !== undefined && req.body.version !== undefined ? validateVersion(req.body.version) : 'latest'
  } catch (err) {
    logger.error('Package name or version was invalid', { err: err })
    next(formatError(err.message, 400))
  }

  next()
}

/**
 * Middleware for undefined routes
 * @param req The Express request.
 * @param res The Express response.
 * @param next The Express next callback.
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  next(formatError('Not implemented!', 404))
}

/**
 * Middleware for returning errors
 * @param err The error.
 * @param req The Express request.
 * @param res The Express response.
 * @param next The Express next middleware.
 */
export const error = (err: CustomError, req: Request, res: Response, next: NextFunction): void  => {
  res.status(err.status || /* istanbul ignore next */500)
  res.send({
    error: err.message
  })
  next()
}
