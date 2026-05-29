require('dotenv').config()
const http = require('http')
const app = require('./app')
const { attachRealtime } = require('./realtime')

const PORT = process.env.PORT || 3001

// An explicit http.Server, because socket.io needs to attach to one.
// `app.listen()` creates one internally and never hands it back.
const server = http.createServer(app)
attachRealtime(server)

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (HTTP + WebSocket)`)
})
