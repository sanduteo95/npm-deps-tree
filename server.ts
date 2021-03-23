import app from './app'

const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`)
})

const handleExit = (signal) => {
  console.log(`Received ${signal}. Close my server properly.`)
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGINT', handleExit)
process.on('SIGQUIT', handleExit)
process.on('SIGTERM', handleExit)
