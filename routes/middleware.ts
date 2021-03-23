
import { formatError } from '../utils/error'
import logger from '../utils/logger'
import { validateName, validateVersion } from '../utils/validation'

/**
 * Middleware for validating the package name and version
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @param {Function} next The Express next callback.
 * @returns {void}
 * @function
 */
export const validate = (req, res, next) => {
  logger.info(`Running validation middleware on ${req.params.package}:${req.body !== undefined && req.body.version !== undefined ? req.body.version : 'latest'}`)
  try {
    logger.info('Validating package name and version')
    req.name = validateName(req.params.package)
    req.version = req.body !== undefined && req.body.version !== undefined ? validateVersion(req.body.version) : 'latest'
  } catch (err) {
    logger.error('Package name or version was invalid', { err: err })
    next(formatError(400, err.message))
  }

  next()
}

/**
 * Middleware for undefined routes
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @param {Function} next The Express next callback.
 * @returns {void}
 * @function
 */
export const notFound = (req, res, next) => {
  next(formatError(404, 'Not implemented!'))
}

/**
 * Middleware for returning errors
 * @param {Object} req The Express request.
 * @param {Object} res The Express response.
 * @param {Function} next The Express next callback.
 * @returns {void}
 * @function
 */
export const error = (err, req, res, next) => {
  res.status(err.status || /* istanbul ignore next */500)
  res.send({
    error: err.message
  })
}
