// Server-side Pusher configuration
import PusherServer from 'pusher'

// Client-side Pusher configuration
import PusherClient from 'pusher-js'

declare global {
  var pusher: PusherServer | undefined
  var pusherClient: PusherClient | undefined
}

// Server Pusher instance
export const pusher: PusherServer = global.pusher ?? new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true
})

// Client Pusher instance
export const pusherClient: PusherClient = global.pusherClient ?? new PusherClient(
  process.env.PUSHER_KEY!,
  {
    cluster: process.env.PUSHER_CLUSTER || 'eu'
  }
)

if (process.env.NODE_ENV !== 'production') {
  global.pusher = pusher
  global.pusherClient = pusherClient
}