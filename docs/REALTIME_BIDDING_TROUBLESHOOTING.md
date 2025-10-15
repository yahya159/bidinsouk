# Real-Time Bidding Troubleshooting Guide

Common issues and their solutions.

---

## Quick Diagnostics

Run these commands to quickly diagnose issues:

```bash
# 1. Check Pusher connection
npx tsx -e "import { pusher } from './lib/realtime/pusher'; pusher.trigger('test', 'test', {}).then(() => console.log('✅ OK')).catch(e => console.error('❌', e))"

# 2. Test real-time bidding
npm run test:realtime 1

# 3. Check database connection
npx prisma db pull

# 4. Verify environment variables
node -e "console.log(process.env.PUSHER_KEY ? '✅ PUSHER_KEY set' : '❌ PUSHER_KEY missing')"
```

---

## Issue Categories

1. [Connection Issues](#connection-issues)
2. [Event Issues](#event-issues)
3. [Bid Placement Issues](#bid-placement-issues)
4. [Performance Issues](#performance-issues)
5. [Security Issues](#security-issues)

---

## Connection Issues

### Issue: "Pusher connection failed"

**Symptoms:**
- Browser console shows: `Pusher : Error : {"type":"WebSocketError"}`
- Connection state stuck at "connecting" or "unavailable"
- No real-time updates received

**Diagnosis:**
```javascript
// In browser console
console.log(pusherClient.connection.state)
// Should be "connected", if not, there's an issue
```

**Solutions:**

1. **Check credentials in .env**
   ```bash
   # Verify these are set
   PUSHER_APP_ID=123456
   PUSHER_KEY=abcdef123456
   PUSHER_SECRET=xyz789secret
   PUSHER_CLUSTER=eu
   
   NEXT_PUBLIC_PUSHER_KEY=abcdef123456
   NEXT_PUBLIC_PUSHER_CLUSTER=eu
   ```

2. **Restart dev server**
   ```bash
   # Environment variables only load on server start
   # Stop server (Ctrl+C) and restart
   npm run dev
   ```

3. **Check Pusher dashboard**
   - Go to https://dashboard.pusher.com
   - Verify app is active (not suspended)
   - Check "Debug Console" for connection attempts

4. **Check firewall/proxy**
   ```bash
   # Test WebSocket connection
   curl -I https://ws-eu.pusher.com
   ```

5. **Verify cluster**
   ```javascript
   // Cluster must match your Pusher app
   // Common clusters: eu, us2, us3, ap1, ap2, ap3, ap4
   ```

---

### Issue: "Connection keeps dropping"

**Symptoms:**
- Connection state changes frequently
- "Reconnecting..." message appears often
- Intermittent real-time updates

**Solutions:**

1. **Check network stability**
   ```bash
   # Test connection stability
   ping -c 100 ws-eu.pusher.com
   ```

2. **Increase reconnection timeout**
   ```typescript
   // lib/realtime/pusher.ts
   export const pusherClient = new PusherClient(key, {
     cluster: 'eu',
     activityTimeout: 120000, // 2 minutes (default: 120s)
     pongTimeout: 30000,      // 30 seconds (default: 30s)
   })
   ```

3. **Enable polling fallback**
   ```typescript
   // Already enabled in useRealtimeAuction hook
   enablePollingFallback: true
   ```

---

### Issue: "WebSocket blocked by browser"

**Symptoms:**
- Browser console shows: `WebSocket connection to 'wss://...' failed`
- Works in some browsers but not others
- Works on HTTP but not HTTPS

**Solutions:**

1. **Check browser extensions**
   - Disable ad blockers temporarily
   - Disable privacy extensions (Privacy Badger, uBlock Origin)
   - Test in incognito mode

2. **Check HTTPS configuration**
   ```javascript
   // Ensure forceTLS is set correctly
   const pusherClient = new PusherClient(key, {
     cluster: 'eu',
     forceTLS: true, // Use WSS (secure WebSocket)
   })
   ```

3. **Check Content Security Policy**
   ```typescript
   // next.config.ts
   const nextConfig = {
     async headers() {
       return [{
         source: '/:path*',
         headers: [{
           key: 'Content-Security-Policy',
           value: "connect-src 'self' wss://*.pusher.com https://*.pusher.com"
         }]
       }]
     }
   }
   ```

---

## Event Issues

### Issue: "Events not received in browser"

**Symptoms:**
- Bid placed successfully
- No toast notification appears
- UI doesn't update
- Pusher Debug Console shows events being sent

**Diagnosis:**
```javascript
// In browser console
const channel = pusherClient.subscribe('auction-123')
channel.bind_global((event, data) => {
  console.log('Event received:', event, data)
})
// Place a bid and check if event logs
```

**Solutions:**

1. **Verify channel subscription**
   ```javascript
   // Check if subscribed
   console.log(channel.subscribed) // Should be true
   
   // Check subscription state
   channel.bind('pusher:subscription_succeeded', () => {
     console.log('✅ Subscribed successfully')
   })
   
   channel.bind('pusher:subscription_error', (error) => {
     console.error('❌ Subscription failed:', error)
   })
   ```

2. **Check event binding**
   ```javascript
   // Verify event name matches
   channel.bind('bid:new', (data) => {
     console.log('Bid event:', data)
   })
   // Event name must match exactly (case-sensitive)
   ```

3. **Check for duplicate subscriptions**
   ```typescript
   // ❌ BAD - Creates new subscription on every render
   function Component() {
     const channel = pusherClient.subscribe('auction-123')
   }
   
   // ✅ GOOD - Subscribes once
   function Component() {
     useEffect(() => {
       const channel = pusherClient.subscribe('auction-123')
       return () => channel.unsubscribe()
     }, [])
   }
   ```

4. **Check React StrictMode**
   ```typescript
   // React 18 StrictMode mounts components twice in dev
   // This can cause double subscriptions
   // Solution: Proper cleanup in useEffect (already implemented)
   ```

---

### Issue: "Multiple events received for one bid"

**Symptoms:**
- One bid triggers multiple toast notifications
- UI updates multiple times
- Event logs show duplicate events

**Solutions:**

1. **Check for duplicate subscriptions**
   ```typescript
   // Use ref to track subscription
   const channelRef = useRef<any>(null)
   
   useEffect(() => {
     if (channelRef.current) return // Already subscribed
     
     const channel = pusherClient.subscribe('auction-123')
     channelRef.current = channel
     
     return () => {
       channel.unsubscribe()
       channelRef.current = null
     }
   }, [])
   ```

2. **Check event handler cleanup**
   ```typescript
   useEffect(() => {
     const channel = pusherClient.subscribe('auction-123')
     const handler = (data) => console.log(data)
     
     channel.bind('bid:new', handler)
     
     return () => {
       channel.unbind('bid:new', handler) // Unbind specific handler
       channel.unsubscribe()
     }
   }, [])
   ```

3. **Deduplicate events**
   ```typescript
   const lastEventId = useRef<string | null>(null)
   
   const handleBidEvent = (data: any) => {
     const eventId = `${data.auctionId}-${data.timestamp}`
     
     if (lastEventId.current === eventId) {
       console.log('Duplicate event ignored')
       return
     }
     
     lastEventId.current = eventId
     // Process event
   }
   ```

---

### Issue: "Stale events received"

**Symptoms:**
- Old bids appear after page refresh
- Events from previous sessions
- Timestamp validation fails

**Solutions:**

1. **Validate timestamps**
   ```typescript
   // Already implemented in useRealtimeAuction
   const eventTime = new Date(data.timestamp).getTime()
   const now = Date.now()
   const timeDiff = now - eventTime
   
   if (timeDiff > 10000) { // 10 seconds
     console.warn('Stale event ignored')
     return
   }
   ```

2. **Clear local storage**
   ```javascript
   // Clear cached data
   localStorage.removeItem(`auction-${auctionId}-last-bid`)
   ```

3. **Unsubscribe on unmount**
   ```typescript
   // Ensure cleanup happens
   useEffect(() => {
     return () => {
       channel.unbind_all()
       channel.unsubscribe()
     }
   }, [])
   ```

---

## Bid Placement Issues

### Issue: "Bid placed but no Pusher event"

**Symptoms:**
- Bid saved to database
- No real-time updates
- Pusher Debug Console shows no events

**Diagnosis:**
```bash
# Check server logs
# Look for "Failed to trigger Pusher event"
```

**Solutions:**

1. **Check Pusher credentials**
   ```bash
   # Verify server-side credentials
   echo $PUSHER_APP_ID
   echo $PUSHER_KEY
   echo $PUSHER_SECRET
   ```

2. **Check Pusher error logs**
   ```typescript
   // lib/services/bids-enhanced.ts
   try {
     await pusher.trigger('auction-123', 'bid:new', data)
   } catch (error) {
     console.error('Pusher error:', error)
     // Check this log
   }
   ```

3. **Verify Pusher plan limits**
   - Free tier: 100 connections, 200K messages/day
   - Check dashboard for rate limit warnings

4. **Test Pusher connection**
   ```bash
   npx tsx -e "
   import { pusher } from './lib/realtime/pusher';
   pusher.trigger('test', 'test', { message: 'test' })
     .then(() => console.log('✅ Pusher works'))
     .catch(err => console.error('❌ Pusher error:', err))
   "
   ```

---

### Issue: "Bid rejected with 'Bid must be at least...'"

**Symptoms:**
- Bid amount seems valid
- Error says minimum is higher than expected
- Race condition suspected

**Explanation:**
This is **expected behavior** when another user bids first.

**Example:**
```
1. You see current bid: $100, minimum: $110
2. You enter $110
3. Another user bids $110 first
4. Your bid is validated against new minimum: $120
5. Your $110 bid is rejected
```

**Solutions:**

1. **Retry with updated amount**
   ```typescript
   // Client automatically updates minimum
   // User just needs to bid again
   ```

2. **Implement auto-increment**
   ```typescript
   const handleBidError = (error: string) => {
     if (error.includes('Bid must be at least')) {
       // Extract new minimum from error
       const match = error.match(/\$(\d+)/)
       if (match) {
         const newMin = parseInt(match[1])
         setBidAmount(newMin)
         notifications.show({
           message: `Minimum bid updated to $${newMin}`,
           color: 'orange'
         })
       }
     }
   }
   ```

---

### Issue: "You are already the highest bidder"

**Symptoms:**
- User tries to bid again
- Error: "You are already the highest bidder"

**Explanation:**
This is **expected behavior** to prevent users from bidding against themselves.

**Solutions:**

1. **Disable bid button**
   ```typescript
   const isHighestBidder = lastBid?.userId === currentUserId
   
   <Button disabled={isHighestBidder}>
     {isHighestBidder ? 'You are winning' : 'Place Bid'}
   </Button>
   ```

2. **Show winning status**
   ```typescript
   {isHighestBidder && (
     <Alert color="green">
       🎉 You are currently winning this auction!
     </Alert>
   )}
   ```

---

### Issue: "Auction has ended"

**Symptoms:**
- Bid placed just before auction end
- Error: "Auction has ended"
- Timer shows time remaining

**Explanation:**
Server time may differ from client time (clock drift).

**Solutions:**

1. **Sync with server time**
   ```typescript
   // Fetch server time
   const response = await fetch('/api/time')
   const { timestamp } = await response.json()
   const clockDrift = timestamp - Date.now()
   
   // Adjust countdown
   const adjustedTimeRemaining = timeRemaining - clockDrift
   ```

2. **Disable bidding near end**
   ```typescript
   const canBid = timeRemaining > 2000 // 2 seconds buffer
   
   <Button disabled={!canBid}>
     {canBid ? 'Place Bid' : 'Auction ending soon'}
   </Button>
   ```

---

## Performance Issues

### Issue: "Slow bid placement"

**Symptoms:**
- Bid takes >2 seconds to process
- Database queries slow
- High server load

**Diagnosis:**
```bash
# Check database performance
npx prisma studio
# Look at query execution times
```

**Solutions:**

1. **Add database indexes**
   ```prisma
   // prisma/schema.prisma
   model Bid {
     // ...
     @@index([auctionId])
     @@index([clientId])
     @@index([createdAt])
   }
   ```

2. **Optimize transaction**
   ```typescript
   // Reduce transaction timeout
   await prisma.$transaction(async (tx) => {
     // ...
   }, {
     timeout: 5000 // 5 seconds (default: 10s)
   })
   ```

3. **Use connection pooling**
   ```env
   # .env
   DATABASE_URL="mysql://user:pass@localhost:3306/db?connection_limit=10"
   ```

---

### Issue: "High memory usage"

**Symptoms:**
- Browser tab uses >500MB RAM
- Page becomes sluggish
- Memory leak suspected

**Diagnosis:**
```javascript
// In browser console
// Take heap snapshot in DevTools > Memory
// Look for detached DOM nodes or large arrays
```

**Solutions:**

1. **Check for memory leaks**
   ```typescript
   // Ensure cleanup in useEffect
   useEffect(() => {
     const channel = pusherClient.subscribe('auction-123')
     
     return () => {
       channel.unbind_all() // Important!
       channel.unsubscribe() // Important!
     }
   }, [])
   ```

2. **Limit bid history**
   ```typescript
   // Don't load all bids at once
   const [bids, setBids] = useState<Bid[]>([])
   const [page, setPage] = useState(1)
   const BIDS_PER_PAGE = 20
   
   // Load on demand
   const loadMoreBids = async () => {
     const response = await fetch(`/api/auctions/${id}/bids?page=${page}`)
     const newBids = await response.json()
     setBids(prev => [...prev, ...newBids])
   }
   ```

3. **Use virtual scrolling**
   ```typescript
   // For large bid lists
   import { useVirtualizer } from '@tanstack/react-virtual'
   ```

---

### Issue: "Pusher rate limit exceeded"

**Symptoms:**
- Error: "Rate limit exceeded"
- Events stop being sent
- Pusher dashboard shows warnings

**Solutions:**

1. **Check current usage**
   - Go to Pusher dashboard
   - Check "Metrics" tab
   - Look for rate limit warnings

2. **Implement server-side throttling**
   ```typescript
   // Already implemented in bids-enhanced.ts
   // Limits to 90 events/second (buffer for 100 limit)
   ```

3. **Batch events**
   ```typescript
   // Instead of one event per bid
   // Batch multiple bids into one event
   const bids: Bid[] = []
   
   setInterval(async () => {
     if (bids.length > 0) {
       await pusher.trigger('auction-123', 'bids:batch', {
         bids,
         count: bids.length
       })
       bids.length = 0
     }
   }, 1000) // Every second
   ```

4. **Upgrade Pusher plan**
   - Free: 100 events/second
   - Startup: 200 events/second
   - Professional: 500 events/second

---

## Security Issues

### Issue: "Unauthorized bid placement"

**Symptoms:**
- User can bid without authentication
- User can bid on own auction
- User can place invalid bids

**Diagnosis:**
```bash
# Test without authentication
curl -X POST http://localhost:3000/api/auctions/1/bids \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
# Should return 401 Unauthorized
```

**Solutions:**

1. **Verify authentication**
   ```typescript
   // Already implemented in API route
   const user = await requireAuth(request)
   if (!user) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   ```

2. **Check authorization**
   ```typescript
   // Verify user is not seller
   if (auction.store.seller.userId === userId) {
     throw new Error('Sellers cannot bid on their own auctions')
   }
   ```

3. **Validate on server**
   ```typescript
   // Never trust client-side validation
   // Always validate on server
   ```

---

### Issue: "Fake Pusher events"

**Symptoms:**
- Suspicious events in browser
- Events don't match database
- Security concern

**Explanation:**
Clients **cannot** trigger Pusher events (requires PUSHER_SECRET).

**Verification:**
```javascript
// This will fail (client doesn't have secret)
pusherClient.trigger('auction-123', 'bid:new', {})
// Error: "trigger is not a function"
```

**Solutions:**

1. **Validate events client-side**
   ```typescript
   // Already implemented in useRealtimeAuction
   // - Timestamp validation
   // - Amount validation
   // - Structure validation
   ```

2. **Never expose PUSHER_SECRET**
   ```bash
   # ✅ GOOD - Server only
   PUSHER_SECRET=xyz789secret
   
   # ❌ BAD - Never do this!
   NEXT_PUBLIC_PUSHER_SECRET=xyz789secret
   ```

---

## Getting Help

If you're still stuck:

1. **Check documentation**
   - `docs/REALTIME_BIDDING_ARCHITECTURE.md`
   - `docs/REALTIME_BIDDING_SETUP.md`
   - `docs/REALTIME_BIDDING_QUICK_REFERENCE.md`

2. **Check Pusher docs**
   - https://pusher.com/docs/channels

3. **Check browser console**
   - Look for errors
   - Check network tab
   - Inspect WebSocket messages

4. **Check server logs**
   - Look for Pusher errors
   - Check database errors
   - Verify transaction logs

5. **Test in isolation**
   ```bash
   # Test Pusher connection
   npm run test:realtime 1
   
   # Test database
   npx prisma studio
   
   # Test API
   curl http://localhost:3000/api/auctions/1
   ```

---

**Still need help? Create an issue with:**
- Error message
- Steps to reproduce
- Browser console logs
- Server logs
- Environment (OS, Node version, browser)
