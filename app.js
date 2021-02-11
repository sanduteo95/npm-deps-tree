const express = require('express')
const bodyParser = require('body-parser')

const index = require('./lib/index')
const { validateName, validateVersion } = require('./utils/validation')
const logger = require('./utils/logger')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// TODO: better errors
const _formatError = (status, message) => {
  const err = new Error(message)
  err.status = status
  return err
}

// Middleware for computing the name and version
app.use('/package/:package', (req, res, next) => {
  try {
    logger.info('Validating package name and version')
    req.name = validateName(req.params.package)
    req.version = req.body !== undefined && req.body.version !== undefined ? validateVersion(req.body.version) : 'latest'
  } catch (error) {
    logger.error('Package name or version was invalid', { err: error })
    next(_formatError(400, error.message))
  }

  next()
})

const _getDepedencyTree = async (req, res, next) => {
  logger.info(`Received call to get the dependency tree of package ${req.name}:${req.version}`)
  try {
    const dependencyTree = await index.computeDependencyTreeForPackage(req.name, req.version)
    res.send(dependencyTree)
  } catch (error) {
    next(_formatError(500, error.message))
  }
}

// TODO: keep both the GET and the POST?
app.get('/package/:package', _getDepedencyTree)
app.post('/package/:package', _getDepedencyTree)

// Middleware for catching calls to undefined routes
app.use((req, res, next) => {
  next(_formatError(404, 'Not implemented!'))
})

// Middleware for returning errors
app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.send({
    error: err.message
  })
})

module.exports = app
