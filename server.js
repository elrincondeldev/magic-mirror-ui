const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOST || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

/** @type {{ mode: 'dashboard' | 'youtube', youtubeId: string | null, message: string, weatherCity: string }} */
let mirrorState = {
  mode: 'dashboard',
  youtubeId: null,
  message: '¡Bienvenido!',
  weatherCity: process.env.NEXT_PUBLIC_WEATHER_CITY || 'Madrid,ES',
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  const io = new Server(httpServer)

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`)

    // Send current state immediately on connection
    socket.emit('mirror:state', mirrorState)

    socket.on('mirror:update', (update) => {
      mirrorState = { ...mirrorState, ...update }
      // Broadcast new state to ALL connected clients (mirror + any open admin tabs)
      io.emit('mirror:state', mirrorState)
      console.log('[socket] state updated:', mirrorState)
    })

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${socket.id}`)
    })
  })

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://localhost:${port}`)
    console.log(`> Mirror: http://localhost:${port}/mirror`)
    console.log(`> Admin:  http://localhost:${port}/admin`)
  })
})
