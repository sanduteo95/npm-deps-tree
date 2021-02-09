const express = require('express')
const bodyParser = require('body-parser')

const { computeDependencyTreeForPackage } = require('./lib/index')
const { validateName, validateVersion } = require('./utils/validation')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// TODO: better errors
const _formatError = (status, message) => {
  const err = new Error(message)
  err.status = status
  return err
}

// TODO: keep both the GET and the POST?
app.get('/package/:package', async (req, res, next) => {
  let name = req.params.package
  try {
    name = validateName(name)
  } catch (error) {
    return next(_formatError(400, error.message))
  }

  const version = 'latest'
  try {
    const dependencyTree = await computeDependencyTreeForPackage(name, version)
    res.send(dependencyTree)
  } catch (error) {
    return next(_formatError(500, error.message))
  }
})

app.post('/package/:package', async (req, res, next) => {
  let name
  try {
    name = validateName(req.params.package)
  } catch (error) {
    return next(_formatError(400, error.message))
  }

  let version
  try {
    version = validateVersion(req.body.version || 'latest')
  } catch (error) {
    return next(_formatError(400, error.message))
  }

  try {
    const dependencyTree = await computeDependencyTreeForPackage(name, version)
    res.send(dependencyTree)
  } catch (error) {
    return next(_formatError(500, error.message))
  }
})

app.use((req, res, next) => {
  next(_formatError(404, 'Not implemented!'))
})

app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.send({
    error: err.message
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`)
})
