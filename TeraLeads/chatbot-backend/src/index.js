require('dotenv').config()
const http = require('http')
const app = require('./app')
const { attachRealtime } = require('./realtime')
const logger = require('./utils/logger')

const PORT = process.env.PORT || 3001

// socket.io attaches to an http.Server, which app.listen() would not hand back.
const server = http.createServer(app)
attachRealtime(server)

server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} (HTTP + WebSocket)`)
})
