# Real-Time Bidding Visual Diagrams

Visual representations of the real-time bidding system architecture.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     REAL-TIME BIDDING SYSTEM                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser A  │     │   Browser B  │     │   Browser C  │
│  (User 1)    │     │  (User 2)    │     │  (User 3)    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ WebSocket          │ WebSocket          │ WebSocket
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  PUSHER CLOUD  │
                    │   (WebSocket   │
                    │   Hub/Router)  │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  NEXT.JS APP   │
                    │  (API Routes)  │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  MySQL + ORM   │
                    │   (Prisma)     │
                    └────────────────┘
```

---

## 2. Bid Placement Flow

```
USER PLACES BID
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. CLIENT-SIDE VALIDATION                                   │
│    - Check minimum bid amount                               │
│    - Check auction status                                   │
│    - Check user authentication                              │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. HTTP POST REQUEST                                        │
│    POST /api/auctions/[id]/bids                             │
│    Body: { amount: 150 }                                    │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SERVER-SIDE VALIDATION                                   │
│    - Verify authentication                                  │
│    - Check auction status (RUNNING)                         │
│    - Validate bid amount                                    │
│    - Check auction hasn't ended                             │
│    - Verify user is not seller                              │
│    - Check user not already highest bidder                  │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. DATABASE TRANSACTION (Serializable Isolation)            │
│    BEGIN TRANSACTION                                        │
│    ├─ Lock auction row                                      │
│    ├─ Re-validate bid amount (race condition prevention)    │
│    ├─ Create Bid record                                     │
│    ├─ Update Auction.currentBid                             │
│    ├─ Check auto-extend rules                               │
│    ├─ Update Auction.endAt (if extended)                    │
│    ├─ Create AuctionActivity log                            │
│    └─ COMMIT                                                │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. PUSHER EVENT TRIGGER                                     │
│    pusher.trigger('auction-123', 'bid:new', {               │
│      currentBid: 150,                                       │
│      bidderName: "John Doe",                                │
│      bidCount: 5,                                           │
│      timestamp: "2025-10-15T10:30:00Z"                      │
│    })                                                       │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. PUSHER CLOUD DISTRIBUTION                                │
│    Pusher receives event and broadcasts to all              │
│    clients subscribed to 'auction-123' channel              │
└─────────────────────────────────────────────────────────────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
   Browser A      Browser B      Browser C      Browser D
   (Bidder)       (Watcher)      (Watcher)      (Watcher)
       │              │              │              │
       ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. CLIENT-SIDE EVENT HANDLING                               │
│    - Validate event data                                    │
│    - Check timestamp (prevent replay)                       │
│    - Validate bid amount (must increase)                    │
│    - Update UI state                                        │
│    - Show toast notification                                │
│    - Update countdown timer (if extended)                   │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
   UI UPDATED
```

---

## 3. Race Condition Prevention

### Scenario: Two users bid simultaneously

```
TIME: 10:30:00.000

User A                          User B
  │                               │
  │ Bid $150                      │ Bid $155
  │                               │
  ▼                               ▼
┌─────────────────────────────────────────────┐
│         DATABASE TRANSACTION QUEUE          │
└─────────────────────────────────────────────┘
  │                               │
  │ Transaction A starts          │
  │ (locks auction row)           │
  │                               │
  │ Current bid: $100             │ Transaction B waits
  │ Min bid: $110                 │ (waiting for lock)
  │ $150 >= $110 ✓                │
  │                               │
  │ Create bid                    │
  │ Update currentBid = $150      │
  │                               │
  │ COMMIT                        │
  │ (releases lock)               │
  │                               ▼
  │                               Transaction B starts
  │                               (acquires lock)
  │                               │
  │                               Current bid: $150 (updated!)
  │                               Min bid: $160
  │                               $155 < $160 ✗
  │                               │
  │                               ROLLBACK
  │                               Error: "Bid must be at least $160"
  │                               │
  ▼                               ▼
SUCCESS                         FAILURE
$150 bid placed                 User B sees error
Pusher event sent               Must bid higher
```

**Key Points:**
- Serializable isolation prevents dirty reads
- Lock ensures only one transaction modifies auction at a time
- Re-validation within transaction catches stale data
- User B gets clear error message with updated minimum

---

## 4. Connection States & Fallback

```
┌─────────────────────────────────────────────────────────────┐
│                    CONNECTION STATES                        │
└─────────────────────────────────────────────────────────────┘

INITIALIZED
    │
    ▼
CONNECTING ──────────────┐
    │                    │
    │ Success            │ Failure
    ▼                    ▼
CONNECTED            UNAVAILABLE
    │                    │
    │                    │ Start polling
    │                    │ (every 5s)
    │                    │
    │ Disconnect         │ Retry
    ▼                    │
DISCONNECTED ────────────┘
    │
    │ Auto-reconnect
    │
    ▼
CONNECTING


┌─────────────────────────────────────────────────────────────┐
│                    FALLBACK STRATEGY                        │
└─────────────────────────────────────────────────────────────┘

Level 1: CONNECTED
├─ Real-time updates via Pusher
├─ <2 second latency
└─ Best user experience

Level 2: UNAVAILABLE
├─ Polling fallback (every 5s)
├─ 5 second latency
└─ Degraded but functional

Level 3: FAILED
├─ Manual refresh prompt
├─ User-initiated updates
└─ Minimal functionality
```

---

## 5. Scalability Architecture

### Single Server (100 users)

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Client 1 │  │ Client 2 │  │ Client N │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┼─────────────┘
                   │
            ┌──────▼──────┐
            │   PUSHER    │
            └──────┬──────┘
                   │
            ┌──────▼──────┐
            │  Next.js    │
            │  Server 1   │
            └──────┬──────┘
                   │
            ┌──────▼──────┐
            │   MySQL     │
            └─────────────┘
```

### Horizontal Scaling (1000+ users)

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Client 1 │  │ Client 2 │  │ Client N │  │ Client M │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │
     └─────────────┼─────────────┼─────────────┘
                   │             │
            ┌──────▼─────────────▼──────┐
            │      PUSHER CLOUD          │
            │  (Handles distribution)    │
            └──────┬─────────────┬───────┘
                   │             │
         ┌─────────▼───┐   ┌────▼──────────┐
         │  Next.js    │   │   Next.js     │
         │  Server 1   │   │   Server 2    │
         └─────────┬───┘   └────┬──────────┘
                   │             │
         ┌─────────▼─────────────▼───────┐
         │     Load Balancer              │
         └─────────┬────────────────────┘
                   │
         ┌─────────▼────────┐
         │  MySQL Cluster   │
         │  (Primary +      │
         │   Replicas)      │
         └──────────────────┘
```

**Key Optimizations:**
- Pusher handles WebSocket distribution
- Multiple Next.js servers share load
- Database read replicas for queries
- Connection pooling reduces overhead

---

## 6. Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                        │
└─────────────────────────────────────────────────────────────┘

Layer 1: CLIENT-SIDE VALIDATION
├─ Input validation (amount, format)
├─ UI state checks (auction status)
└─ User feedback (errors, warnings)
    │
    ▼
Layer 2: AUTHENTICATION
├─ NextAuth session verification
├─ JWT token validation
└─ User role checks (CLIENT, VENDOR, ADMIN)
    │
    ▼
Layer 3: AUTHORIZATION
├─ User owns client profile
├─ User not seller of auction
├─ User not already highest bidder
└─ Auction allows bidding
    │
    ▼
Layer 4: BUSINESS LOGIC VALIDATION
├─ Auction status (RUNNING)
├─ Auction not ended
├─ Bid amount >= minimum
└─ Rate limiting (5 bids/min)
    │
    ▼
Layer 5: DATABASE TRANSACTION
├─ Serializable isolation
├─ Row-level locking
├─ Re-validation within transaction
└─ Atomic operations
    │
    ▼
Layer 6: EVENT VALIDATION (Client)
├─ Timestamp validation (no replay)
├─ Amount validation (must increase)
├─ Data structure validation
└─ Source verification (Pusher only)
```

---

## 7. Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PUSHER EVENT TYPES                       │
└─────────────────────────────────────────────────────────────┘

bid:new
├─ Triggered: When any user places a bid
├─ Payload: { currentBid, bidderName, bidCount, timestamp }
├─ Received by: All users watching auction
└─ Action: Update current bid, show notification

auction:extend
├─ Triggered: When auction time is extended (anti-snipe)
├─ Payload: { newEndTime, extendMinutes, timestamp }
├─ Received by: All users watching auction
└─ Action: Update countdown timer, show notification

auction:status
├─ Triggered: When auction status changes
├─ Payload: { status, timestamp }
├─ Received by: All users watching auction
└─ Action: Update status badge, adjust UI

auction:end
├─ Triggered: When auction ends
├─ Payload: { winnerId?, winningBid?, timestamp }
├─ Received by: All users watching auction
└─ Action: Show winner, disable bidding


┌─────────────────────────────────────────────────────────────┐
│                    CHANNEL STRUCTURE                        │
└─────────────────────────────────────────────────────────────┘

Public Channels (anyone can subscribe)
├─ auction-1
├─ auction-2
└─ auction-N

Private Channels (authentication required)
├─ private-auction-1
├─ private-auction-2
└─ private-auction-N

Presence Channels (track who's online)
├─ presence-auction-1
├─ presence-auction-2
└─ presence-auction-N
```

---

## 8. Memory Management

```
┌─────────────────────────────────────────────────────────────┐
│                  COMPONENT LIFECYCLE                        │
└─────────────────────────────────────────────────────────────┘

MOUNT
  │
  ├─ Create Pusher client (singleton)
  │
  ├─ Subscribe to channel
  │  const channel = pusher.subscribe('auction-123')
  │
  ├─ Bind event handlers
  │  channel.bind('bid:new', handleBid)
  │  channel.bind('auction:extend', handleExtend)
  │
  └─ Start listening
     │
     │ ... Component active ...
     │
UNMOUNT
  │
  ├─ Unbind event handlers
  │  channel.unbind('bid:new', handleBid)
  │  channel.unbind_all()
  │
  ├─ Unsubscribe from channel
  │  channel.unsubscribe()
  │
  └─ Cleanup complete
     (No memory leaks!)


┌─────────────────────────────────────────────────────────────┐
│                  MEMORY LEAK PREVENTION                     │
└─────────────────────────────────────────────────────────────┘

❌ BAD - Memory Leak
function Component() {
  const channel = pusher.subscribe('auction-123')
  channel.bind('bid:new', handleBid)
  // No cleanup! Channel stays subscribed forever
}

✅ GOOD - Proper Cleanup
function Component() {
  useEffect(() => {
    const channel = pusher.subscribe('auction-123')
    channel.bind('bid:new', handleBid)
    
    return () => {
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [])
}
```

---

## 9. Testing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTING STRATEGY                         │
└─────────────────────────────────────────────────────────────┘

1. UNIT TESTS
   ├─ Bid validation logic
   ├─ Event payload formatting
   └─ Error handling

2. INTEGRATION TESTS
   ├─ API endpoint testing
   ├─ Database transaction testing
   └─ Pusher event triggering

3. E2E TESTS
   ├─ Full bid placement flow
   ├─ Real-time update verification
   └─ Multi-user scenarios

4. LOAD TESTS
   ├─ Concurrent bid placement
   ├─ Race condition testing
   └─ Scalability verification


┌─────────────────────────────────────────────────────────────┐
│                  AUTOMATED TEST FLOW                        │
└─────────────────────────────────────────────────────────────┘

npm run test:realtime 1
  │
  ├─ Fetch auction details
  │
  ├─ Find test users
  │
  ├─ Test sequential bids
  │  ├─ User 1 bids $110
  │  ├─ User 2 bids $120
  │  └─ User 3 bids $130
  │
  ├─ Test race conditions
  │  ├─ User 1 and User 2 bid simultaneously
  │  └─ Verify both handled correctly
  │
  ├─ Test invalid scenarios
  │  ├─ Bid below minimum
  │  └─ User bidding against themselves
  │
  └─ Generate summary report
```

---

## 10. Production Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                  DEPLOYMENT CHECKLIST                       │
└─────────────────────────────────────────────────────────────┘

DEVELOPMENT
├─ Set up Pusher account
├─ Configure .env variables
├─ Test locally
└─ Verify Pusher Debug Console

STAGING
├─ Deploy to staging environment
├─ Set production Pusher credentials
├─ Run load tests
├─ Verify monitoring
└─ Test failover scenarios

PRODUCTION
├─ Deploy to production
├─ Monitor Pusher dashboard
├─ Set up alerts
├─ Monitor error rates
└─ Scale as needed


┌─────────────────────────────────────────────────────────────┐
│                  MONITORING DASHBOARD                       │
└─────────────────────────────────────────────────────────────┘

Pusher Metrics
├─ Connection count: 234 / 500
├─ Messages today: 45,678 / 1,000,000
├─ Average latency: 127ms
└─ Error rate: 0.02%

Application Metrics
├─ Bids per minute: 12
├─ Active auctions: 45
├─ Database response time: 23ms
└─ API success rate: 99.98%
```

---

These diagrams provide visual representations of the real-time bidding system architecture, making it easier to understand the flow of data, security layers, and system behavior.
