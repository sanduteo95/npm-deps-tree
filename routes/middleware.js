
const { formatError } = require('../utils/error')
const logger = require('../utils/logger')
const { validateName, validateVersion } = require('../utils/validation')

/**
 * Middleware for validating the package name and version
 * @param {Object} The Express request.
 * @param {Object} The Express response.
 * @param {Function} The Express next callback.
 * @returns {void}
 * @function
 */
const validate = (req, res, next) => {
  logger.info(`Running validation middleware on ${req.params.package}:${req.body !== undefined && req.body.version !== undefined ? req.body.version : 'latest'}`)
  try {
    logger.info('Validating package name and version')
    req.name = validateName(req.params.package)
    req.version = req.body !== undefined && req.body.version !== undefined ? validateVersion(req.body.version) : 'latest'
  } catch (error) {
    logger.error('Package name or version was invalid', { err: error })
    next(formatError(400, error.message))
  }

  next()
}

/**
 * Middleware for undefined routes
 * @param {Object} The Express request.
 * @param {Object} The Express response.
 * @param {Function} The Express next callback.
 * @returns {void}
 * @function
 */
const notFound = (req, res, next) => {
  next(formatError(404, 'Not implemented!'))
}

/**
 * Middleware for returning errors
 * @param {Object} The Express request.
 * @param {Object} The Express response.
 * @param {Function} The Express next callback.
 * @returns {void}
 * @function
 */
const error = (err, req, res, next) => {
  res.status(err.status || /* istanbul ignore next */500)
  res.send({
    error: err.message
  })
}

module.exports = {
  validate,
  notFound,
  error
}
