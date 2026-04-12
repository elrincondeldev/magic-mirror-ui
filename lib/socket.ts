import { io, Socket } from 'socket.io-client'

// Singleton socket instance — reused across all client components
let socket: Socket | undefined

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
  }
  return socket
}
