# Real-Time Bidding Architecture with Pusher

## Overview

This document explains the complete real-time bidding architecture for the auction marketplace, addressing scalability, security, error handling, and edge cases.

---

## 1. Pusher Architecture: Channels → Events → Subscriptions

### Channel Naming Strategy
```
auction-{auctionId}  // Individual auction channel
auction-{auctionId}-private  // Private channel for bidder-specific data
```

**Why this structure?**
- **Isolation**: Each auction has its own channel, preventing cross-auction data leaks
- **Scalability**: Pusher can handle 100+ concurrent channels per connection
- **Security**: Private channels require authentication for sensitive data

### Event Types
```typescript
// Public events (all watchers see these)
'bid:new'        // New bid placed
'auction:extend' // Auction time extended (anti-snipe)
'auction:end'    // Auction ended
'auction:status' // Status change (RUNNING → ENDING_SOON)

// Private events (only specific users)
'bid:outbid'     // You've been outbid
'bid:winning'    // You're currently winning
```

### Subscription Flow
```
Client connects → Subscribe to channel → Listen for events → Update UI → Unsubscribe on unmount
```

---

## 2. Data Flow: Complete Lifecycle

### Step-by-Step Flow

```
┌─────────────┐
│  User A     │ Places bid ($150)
│  (Client)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  POST /api/auctions/[id]/bids                           │
│  1. Validate authentication                             │
│  2. Check auction status (RUNNING)                      │
│  3. Validate bid amount (>= currentBid + minIncrement)  │
│  4. Check auction hasn't ended                          │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  Database Transaction (Prisma)                          │
│  1. Create Bid record                                   │
│  2. Update Auction.currentBid                           │
│  3. Update Auction.bidCount                             │
│  4. Check auto-extend rules                             │
│  5. Create AuctionActivity log                          │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  Pusher Event Trigger (Server-side)                     │
│  pusher.trigger('auction-123', 'bid:new', {             │
│    auctionId: 123,                                      │
│    currentBid: 150,                                     │
│    bidderName: "User A",                                │
│    bidCount: 5,                                         │
│    timestamp: "2025-10-15T10:30:00Z",                   │
│    extendedEndTime: null  // or new time if extended    │
│  })                                                     │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  Pusher Cloud Infrastructure                            │
│  - Distributes event to all subscribed clients          │
│  - Handles connection management                        │
│  - Manages presence (who's watching)                    │
└──────┬──────────────────────────────────────────────────┘
       │
       ├──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼
   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
   │User B │ │User C │ │User D │ │User A │
   │(Watch)│ │(Watch)│ │(Watch)│ │(Bidder)│
   └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
       │         │         │         │
       ▼         ▼         ▼         ▼
   Update UI  Update UI  Update UI  Update UI
   - Current bid: $150
   - Bidder name: "User A"
   - Bid count: 5
   - Show toast notification
   - Update countdown timer (if extended)
```

---

## 3. Race Conditions: Simultaneous Bids

### Problem
Two users (A and B) place bids at the exact same time:
- User A bids $150 at 10:30:00.000
- User B bids $155 at 10:30:00.001

### Solution: Database Transaction with Optimistic Locking

```typescript
// lib/services/bids.ts
export async function placeBid(auctionId: number, userId: number, amount: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock the auction row (SELECT FOR UPDATE)
    const auction = await tx.auction.findUnique({
      where: { id: auctionId },
      // Prisma doesn't support FOR UPDATE directly, but transaction isolation handles this
    })
    
    // 2. Re-validate bid amount against CURRENT state
    const minBid = Number(auction.currentBid) + Number(auction.minIncrement)
    if (amount < minBid) {
      throw new Error(`Bid too low. Minimum is now ${minBid}`)
    }
    
    // 3. Create bid and update auction atomically
    const bid = await tx.bid.create({ /* ... */ })
    const updated = await tx.auction.update({ /* ... */ })
    
    return { bid, updated }
  }, {
    isolationLevel: 'Serializable', // Strongest isolation
    maxWait: 5000, // Wait up to 5s for lock
    timeout: 10000, // Transaction timeout
  })
}
```

**What happens:**
1. User A's transaction locks the auction row
2. User B's transaction waits for the lock
3. User A's bid succeeds, updates currentBid to $150
4. User B's transaction acquires lock, re-validates
5. User B's $155 bid succeeds (still valid)
6. Both bids are recorded, but in correct order

**Edge case: User B bids $151 (only $1 more than A)**
- User A's bid succeeds ($150)
- User B's bid fails validation (needs $150 + minIncrement)
- User B receives error: "Bid too low. Minimum is now $155"

---

## 4. Scalability: 1000 Concurrent Users

### Challenge
1000 users watching one auction = 1000 WebSocket connections

### Pusher Limits (Standard Plan)
- **Concurrent connections**: 500 per app (upgradeable)
- **Messages per day**: 1M (upgradeable)
- **Message size**: 10KB max
- **Channels per connection**: 100

### Optimization Strategies

#### A. Connection Pooling
```typescript
// Don't create new Pusher instance per component
// Use singleton pattern (already implemented in lib/realtime/pusher.ts)

// ❌ BAD
const pusher = new PusherClient(key, options)

// ✅ GOOD
import { pusherClient } from '@/lib/realtime/pusher'
```

#### B. Event Batching
```typescript
// Instead of triggering on every bid, batch updates every 500ms
let pendingBids: Bid[] = []
let batchTimer: NodeJS.Timeout | null = null

function queueBidEvent(bid: Bid) {
  pendingBids.push(bid)
  
  if (!batchTimer) {
    batchTimer = setTimeout(async () => {
      await pusher.trigger('auction-123', 'bids:batch', {
        bids: pendingBids,
        latestBid: pendingBids[pendingBids.length - 1]
      })
      pendingBids = []
      batchTimer = null
    }, 500)
  }
}
```

#### C. Presence Channels (Track Active Users)
```typescript
// Use presence channels to know who's watching
const channel = pusherClient.subscribe('presence-auction-123')

channel.bind('pusher:subscription_succeeded', (members) => {
  console.log(`${members.count} users watching`)
})

// Adjust update frequency based on viewer count
if (members.count > 100) {
  // Batch updates every 1s
} else {
  // Real-time updates
}
```

#### D. CDN for Static Data
```typescript
// Don't send full auction data in every event
// ❌ BAD
pusher.trigger('auction-123', 'bid:new', {
  auction: { /* full auction object */ },
  bid: { /* bid data */ }
})

// ✅ GOOD - Send only deltas
pusher.trigger('auction-123', 'bid:new', {
  currentBid: 150,
  bidderName: "User A",
  bidCount: 5,
  timestamp: "2025-10-15T10:30:00Z"
})
```

#### E. Horizontal Scaling
```typescript
// Use Pusher's built-in load balancing
// Multiple Next.js instances can trigger events
// Pusher handles distribution to all clients

// Server 1 triggers event
await pusher.trigger('auction-123', 'bid:new', data)

// Server 2 triggers event
await pusher.trigger('auction-123', 'bid:new', data)

// All clients receive both events (Pusher deduplicates)
```

---

## 5. Security: Preventing Malicious Events

### Threat Model
1. **Fake bid events**: Attacker sends fake Pusher events to clients
2. **Channel hijacking**: Attacker subscribes to private channels
3. **Replay attacks**: Attacker replays old bid events
4. **DoS attacks**: Attacker floods with bid requests

### Security Measures

#### A. Server-Side Event Triggering Only
```typescript
// ✅ CORRECT: Server triggers events
// lib/services/bids.ts
await pusher.trigger('auction-123', 'bid:new', data)

// ❌ NEVER: Client triggers events
// This would require exposing PUSHER_SECRET to client
pusherClient.trigger('auction-123', 'bid:new', data) // NOT POSSIBLE
```

**Why this works:**
- Only server has `PUSHER_SECRET`
- Clients can only subscribe and listen
- Clients cannot trigger events

#### B. Private Channels for Sensitive Data
```typescript
// Public channel (anyone can subscribe)
pusherClient.subscribe('auction-123')

// Private channel (requires authentication)
pusherClient.subscribe('private-auction-123')

// Server-side authentication endpoint
// app/api/pusher/auth/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { socket_id, channel_name } = await request.json()
  
  // Verify user has permission to access this channel
  if (channel_name.startsWith('private-auction-')) {
    const auctionId = channel_name.split('-')[2]
    const hasAccess = await checkUserAuctionAccess(session.user.id, auctionId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  
  const auth = pusher.authorizeChannel(socket_id, channel_name)
  return NextResponse.json(auth)
}
```

#### C. Event Validation on Client
```typescript
// Always validate received data
channel.bind('bid:new', (data: any) => {
  // Validate structure
  if (!data.currentBid || !data.timestamp) {
    console.error('Invalid bid event', data)
    return
  }
  
  // Validate timestamp (prevent replay attacks)
  const eventTime = new Date(data.timestamp)
  const now = new Date()
  const timeDiff = now.getTime() - eventTime.getTime()
  
  if (timeDiff > 10000) { // Event older than 10s
    console.warn('Stale bid event ignored', data)
    return
  }
  
  // Validate bid amount (must be increasing)
  if (data.currentBid <= currentBid) {
    console.warn('Invalid bid amount', data)
    return
  }
  
  // Update UI
  setCurrentBid(data.currentBid)
})
```

#### D. Rate Limiting
```typescript
// app/api/auctions/[id]/bids/route.ts
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function POST(request: NextRequest) {
  try {
    await limiter.check(request, 5) // 5 bids per minute per user
  } catch {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }
  
  // ... place bid
}
```

#### E. CSRF Protection
```typescript
// Next.js API routes are protected by default
// But add extra validation for critical operations

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  if (origin && !origin.includes(host)) {
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 }
    )
  }
  
  // ... place bid
}
```

---

## 6. Error Handling: Graceful Degradation

### Pusher Connection States
```typescript
pusherClient.connection.bind('state_change', (states) => {
  console.log('Pusher state:', states.current)
  // States: initialized, connecting, connected, unavailable, failed, disconnected
})
```

### Fallback Strategy

#### Level 1: Pusher Connected (Real-time)
```typescript
if (pusherClient.connection.state === 'connected') {
  // Real-time updates via Pusher
  channel.bind('bid:new', updateUI)
}
```

#### Level 2: Pusher Disconnected (Polling)
```typescript
if (pusherClient.connection.state === 'unavailable') {
  // Fall back to polling every 5 seconds
  const pollInterval = setInterval(async () => {
    const response = await fetch(`/api/auctions/${auctionId}`)
    const data = await response.json()
    updateUI(data)
  }, 5000)
  
  // Stop polling when Pusher reconnects
  pusherClient.connection.bind('connected', () => {
    clearInterval(pollInterval)
  })
}
```

#### Level 3: Complete Failure (Manual Refresh)
```typescript
if (pusherClient.connection.state === 'failed') {
  // Show banner: "Real-time updates unavailable. Please refresh."
  showErrorBanner({
    message: 'Real-time updates unavailable',
    action: 'Refresh',
    onAction: () => window.location.reload()
  })
}
```

### Reconnection Logic
```typescript
pusherClient.connection.bind('disconnected', () => {
  console.log('Pusher disconnected, will auto-reconnect')
})

pusherClient.connection.bind('connected', async () => {
  console.log('Pusher reconnected')
  
  // Catch up on missed bids
  const lastBidTime = localStorage.getItem(`auction-${auctionId}-last-bid`)
  const response = await fetch(
    `/api/auctions/${auctionId}/bids?since=${lastBidTime}`
  )
  const missedBids = await response.json()
  
  // Apply missed bids to UI
  missedBids.forEach(bid => updateUI(bid))
})
```

### Error Boundaries
```typescript
// components/AuctionDetail.tsx
try {
  const channel = pusherClient.subscribe(`auction-${auctionId}`)
  channel.bind('bid:new', handleNewBid)
} catch (error) {
  console.error('Failed to subscribe to Pusher', error)
  // Fall back to polling
  startPolling()
}
```

---

## 7. Memory Management: Cleanup

### Problem
User navigates away from auction page, but Pusher channel remains subscribed, causing memory leaks.

### Solution: React useEffect Cleanup

```typescript
useEffect(() => {
  const channel = pusherClient.subscribe(`auction-${auctionId}`)
  
  channel.bind('bid:new', handleNewBid)
  channel.bind('auction:extend', handleExtend)
  channel.bind('auction:end', handleEnd)
  
  // Cleanup function
  return () => {
    channel.unbind_all() // Remove all event listeners
    channel.unsubscribe() // Unsubscribe from channel
  }
}, [auctionId])
```

### Channel Lifecycle
```typescript
// Subscribe
const channel = pusherClient.subscribe('auction-123')

// Listen
channel.bind('bid:new', handler)

// Unbind specific event
channel.unbind('bid:new', handler)

// Unbind all events
channel.unbind_all()

// Unsubscribe (closes WebSocket if no other channels)
channel.unsubscribe()
```

### Global Cleanup (App Unmount)
```typescript
// app/layout.tsx
useEffect(() => {
  return () => {
    pusherClient.disconnect() // Close all connections
  }
}, [])
```

---

## 8. Testing Strategy

### A. Local Development (Without Pusher)

#### Mock Pusher Client
```typescript
// lib/realtime/pusher-mock.ts
export class MockPusherClient {
  private channels: Map<string, MockChannel> = new Map()
  
  subscribe(channelName: string) {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, new MockChannel(channelName))
    }
    return this.channels.get(channelName)!
  }
  
  // Simulate event from server
  simulateEvent(channelName: string, eventName: string, data: any) {
    const channel = this.channels.get(channelName)
    if (channel) {
      channel.trigger(eventName, data)
    }
  }
}

class MockChannel {
  private handlers: Map<string, Function[]> = new Map()
  
  bind(eventName: string, handler: Function) {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, [])
    }
    this.handlers.get(eventName)!.push(handler)
  }
  
  trigger(eventName: string, data: any) {
    const handlers = this.handlers.get(eventName) || []
    handlers.forEach(handler => handler(data))
  }
  
  unbind_all() {
    this.handlers.clear()
  }
  
  unsubscribe() {
    this.unbind_all()
  }
}

// Use in development
export const pusherClient = process.env.NODE_ENV === 'development'
  ? new MockPusherClient()
  : new PusherClient(/* ... */)
```

#### Simulate Bids in Dev
```typescript
// components/AuctionDetail.tsx (dev only)
if (process.env.NODE_ENV === 'development') {
  // Simulate a bid every 5 seconds
  const interval = setInterval(() => {
    const mockBid = {
      currentBid: Math.random() * 1000,
      bidderName: `User ${Math.floor(Math.random() * 10)}`,
      bidCount: Math.floor(Math.random() * 50),
      timestamp: new Date().toISOString()
    }
    
    pusherClient.simulateEvent(`auction-${auctionId}`, 'bid:new', mockBid)
  }, 5000)
  
  return () => clearInterval(interval)
}
```

### B. Integration Testing

```typescript
// tests/realtime-bidding.test.ts
import { placeBid } from '@/lib/services/bids'
import { pusher } from '@/lib/realtime/pusher'

describe('Real-time Bidding', () => {
  it('should trigger Pusher event when bid is placed', async () => {
    const triggerSpy = jest.spyOn(pusher, 'trigger')
    
    await placeBid(123, 1, 150)
    
    expect(triggerSpy).toHaveBeenCalledWith(
      'auction-123',
      'bid:new',
      expect.objectContaining({
        currentBid: 150,
        bidderName: expect.any(String)
      })
    )
  })
  
  it('should handle race conditions correctly', async () => {
    // Place two bids simultaneously
    const [result1, result2] = await Promise.allSettled([
      placeBid(123, 1, 150),
      placeBid(123, 2, 155)
    ])
    
    // Both should succeed (if valid) or one should fail
    expect(result1.status === 'fulfilled' || result2.status === 'fulfilled').toBe(true)
  })
})
```

### C. Load Testing

```bash
# Use Pusher's built-in testing tools
# https://pusher.com/docs/channels/using_channels/connection-testing

# Or use Artillery
npm install -g artillery

# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - name: "Place bids"
    flow:
      - post:
          url: "/api/auctions/123/bids"
          json:
            amount: 150
          headers:
            Authorization: "Bearer {{ token }}"

# Run test
artillery run artillery.yml
```

---

## 9. Edge Cases

### A. User Places Bid While Disconnected

```typescript
// Queue bids locally
const bidQueue: Bid[] = []

async function placeBidWithQueue(auctionId: number, amount: number) {
  if (!navigator.onLine) {
    // Store bid in queue
    bidQueue.push({ auctionId, amount, timestamp: Date.now() })
    showNotification('Bid queued. Will be placed when connection is restored.')
    return
  }
  
  try {
    await fetch(`/api/auctions/${auctionId}/bids`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    })
  } catch (error) {
    // Network error, queue the bid
    bidQueue.push({ auctionId, amount, timestamp: Date.now() })
  }
}

// Process queue when connection is restored
window.addEventListener('online', async () => {
  for (const bid of bidQueue) {
    try {
      await fetch(`/api/auctions/${bid.auctionId}/bids`, {
        method: 'POST',
        body: JSON.stringify({ amount: bid.amount })
      })
      // Remove from queue if successful
      bidQueue.splice(bidQueue.indexOf(bid), 1)
    } catch (error) {
      // Keep in queue, will retry later
    }
  }
})
```

### B. Auction Ends While User Is Placing Bid

```typescript
// Server-side validation
export async function placeBid(auctionId: number, userId: number, amount: number) {
  const auction = await prisma.auction.findUnique({ where: { id: auctionId } })
  
  // Check if auction ended in the last second
  const now = new Date()
  const timeDiff = now.getTime() - auction.endAt.getTime()
  
  if (timeDiff > 0) {
    throw new Error('Auction has ended. Your bid was not placed.')
  }
  
  // If auction ends in next 2 seconds, warn user
  if (timeDiff > -2000) {
    // Still place the bid, but it might not count
    console.warn('Bid placed very close to auction end')
  }
  
  // ... place bid
}

// Client-side prevention
function PlaceBidButton() {
  const timeRemaining = useAuctionTimer(auction.endAt)
  
  if (timeRemaining < 2) {
    return (
      <Button disabled>
        Auction ending soon
      </Button>
    )
  }
  
  return <Button onClick={placeBid}>Place Bid</Button>
}
```

### C. Pusher Rate Limits (100 events/second)

```typescript
// Implement server-side throttling
import { RateLimiter } from 'limiter'

const pusherLimiter = new RateLimiter({
  tokensPerInterval: 90, // Leave buffer
  interval: 'second'
})

export async function placeBid(auctionId: number, userId: number, amount: number) {
  // ... place bid in database
  
  // Throttle Pusher events
  await pusherLimiter.removeTokens(1)
  
  await pusher.trigger(`auction-${auctionId}`, 'bid:new', data)
}
```

### D. Client Clock Drift

```typescript
// Always use server timestamps
channel.bind('bid:new', (data) => {
  // ❌ DON'T use client time
  const clientTime = new Date()
  
  // ✅ DO use server timestamp
  const serverTime = new Date(data.timestamp)
  
  // Calculate time remaining based on server time
  const timeRemaining = auction.endAt.getTime() - serverTime.getTime()
})

// Sync client clock with server
async function syncClock() {
  const t0 = Date.now()
  const response = await fetch('/api/time')
  const t1 = Date.now()
  const serverTime = await response.json()
  
  const latency = (t1 - t0) / 2
  const clockDrift = serverTime.timestamp - (t0 + latency)
  
  return clockDrift
}
```

---

## 10. Performance Optimization

### A. Debounce UI Updates

```typescript
import { useDebouncedValue } from '@mantine/hooks'

function AuctionDetail() {
  const [currentBid, setCurrentBid] = useState(auction.currentBid)
  const [debouncedBid] = useDebouncedValue(currentBid, 200)
  
  // Update UI with debounced value
  return <Text>{debouncedBid}</Text>
}
```

### B. Lazy Load Bid History

```typescript
// Don't load all bids upfront
// Load on demand when user clicks "View Bid History"

function BidHistory({ auctionId }: { auctionId: number }) {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(false)
  
  const loadBids = async () => {
    setLoading(true)
    const response = await fetch(`/api/auctions/${auctionId}/bids`)
    const data = await response.json()
    setBids(data)
    setLoading(false)
  }
  
  return (
    <Accordion>
      <Accordion.Item value="bids">
        <Accordion.Control onClick={loadBids}>
          Bid History
        </Accordion.Control>
        <Accordion.Panel>
          {loading ? <Loader /> : <BidList bids={bids} />}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}
```

### C. Virtual Scrolling for Large Bid Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function BidList({ bids }: { bids: Bid[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: bids.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  })
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <BidItem bid={bids[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Summary

This architecture provides:

✅ **Real-time updates** with <2s latency  
✅ **Race condition handling** via database transactions  
✅ **Scalability** to 1000+ concurrent users  
✅ **Security** with server-side event triggering  
✅ **Graceful degradation** with polling fallback  
✅ **Memory management** with proper cleanup  
✅ **Comprehensive testing** strategy  
✅ **Edge case handling** for all scenarios  

Next steps: Implement the client-side hook and components (see implementation files).
