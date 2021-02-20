const express = require('express')
const bodyParser = require('body-parser')
const rateLimit = require('express-rate-limit')

const router = require('./routes/router')
const { notFound, error } = require('./routes/middleware')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many accounts created from this IP, please try again in 15 minutes'
}))

app.use(router)

// Middleware for catching calls to undefined routes
app.use(notFound)

// Middleware for returning errors
app.use(error)

module.exports = app
