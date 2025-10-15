// Server-side Pusher configuration
import PusherServer from 'pusher'

// Client-side Pusher configuration
import PusherClient from 'pusher-js'

declare global {
  var pusher: PusherServer | undefined
  var pusherClient: PusherClient | undefined
}

// Check if Pusher credentials are configured
const isPusherConfigured = 
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET

if (!isPusherConfigured && typeof window === 'undefined') {
  console.warn(
    '⚠️ Pusher not configured. Real-time bidding will not work.\n' +
    'Set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, and PUSHER_CLUSTER in .env.local'
  )
}

// Server Pusher instance (only create if configured)
export const pusher: PusherServer = isPusherConfigured
  ? (global.pusher ?? new PusherServer({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER || 'eu',
      useTLS: true
    }))
  : null as any // Will throw error if used without configuration

// Client Pusher instance (only create if configured on client side)
export const pusherClient: PusherClient = 
  typeof window !== 'undefined' && process.env.PUSHER_KEY
    ? (global.pusherClient ?? new PusherClient(
        process.env.PUSHER_KEY,
        {
          cluster: process.env.PUSHER_CLUSTER || 'eu'
        }
      ))
    : null as any

if (process.env.NODE_ENV !== 'production' && isPusherConfigured) {
  global.pusher = pusher
  global.pusherClient = pusherClient
}
