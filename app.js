const express = require('express')
const bodyParser = require('body-parser')

const router = require('./routes/router')
const { notFound, error } = require('./routes/middleware')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(router)

// Middleware for catching calls to undefined routes
app.use(notFound)

// Middleware for returning errors
app.use(error)

module.exports = app
