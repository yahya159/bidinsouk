# 🎯 SOPHISTICATED AUCTION SYSTEM ARCHITECTURE

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Bidding Algorithm](#bidding-algorithm)
4. [Proxy Bidding Logic](#proxy-bidding-logic)
5. [Auto-Extend Mechanism](#auto-extend-mechanism)
6. [Reserve Price Logic](#reserve-price-logic)
7. [Buy Now Functionality](#buy-now-functionality)
8. [Winner Determination](#winner-determination)
9. [Race Condition Prevention](#race-condition-prevention)
10. [State Transition Diagram](#state-transition-diagram)
11. [Monitoring & Automation](#monitoring--automation)
12. [Query Optimization](#query-optimization)
13. [Edge Cases](#edge-cases)

---

## Overview

This auction system implements sophisticated eBay-style mechanics with:
- **Proxy/Auto-Bidding**: Users set max amount, system bids automatically
- **Reserve Price**: Hidden minimum price for auction success
- **Auto-Extend**: Anti-snipe protection (extends if bid in last 5 minutes)
- **Buy Now**: Instant purchase option
- **Race Condition Prevention**: Database-level locking with SERIALIZABLE isolation
- **Real-time Updates**: WebSocket notifications via Pusher

---

## Database Schema

### Enhanced Auction Table
```sql
CREATE TABLE Auction (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  storeId BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pricing
  startPrice DECIMAL(12,2) NOT NULL,
  currentBid DECIMAL(12,2) DEFAULT 0,
  reservePrice DECIMAL(12,2) NULL,          -- Hidden minimum
  reserveMet BOOLEAN DEFAULT FALSE,          -- Reserve reached?
  buyNowPrice DECIMAL(12,2) NULL,            -- Instant win price
  minIncrement DECIMAL(12,2) NOT NULL,       -- Minimum bid raise
  
  -- Timing
  startAt DATETIME NOT NULL,
  endAt DATETIME NOT NULL,
  duration INT,                              -- Original duration (hours)
  
  -- Auto-Extend
  autoExtend BOOLEAN DEFAULT FALSE,
  extendMinutes INT DEFAULT 5,
  extensionCount INT DEFAULT 0,              -- Times extended
  lastExtendedAt DATETIME NULL,
  
  -- State
  status ENUM('DRAFT', 'SCHEDULED', 'ACTIVE', 'RUNNING', 
              'ENDING_SOON', 'ENDED', 'CANCELLED', 'ARCHIVED'),
  winnerId BIGINT NULL,
  winningBidId BIGINT NULL,
  
  -- Stats
  views INT DEFAULT 0,
  watchers INT DEFAULT 0,
  
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_status_endAt (status, endAt),
  INDEX idx_winnerId (winnerId),
  FOREIGN KEY (winnerId) REFERENCES Client(id)
);
```

### Enhanced Bid Table
```sql
CREATE TABLE Bid (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  auctionId BIGINT NOT NULL,
  clientId BIGINT NOT NULL,
  
  -- Amounts
  amount DECIMAL(12,2) NOT NULL,             -- Actual bid amount
  maxAmount DECIMAL(12,2) NULL,              -- Max for proxy bidding
  
  -- Proxy Bidding
  isAuto BOOLEAN DEFAULT FALSE,
  isProxyBid BOOLEAN DEFAULT FALSE,          -- System-generated?
  proxyGeneratedBy BIGINT NULL,              -- Original bid that triggered this
  
  -- Status
  status ENUM('ACTIVE', 'OUTBID', 'WINNING', 'WON', 'LOST') DEFAULT 'ACTIVE',
  
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_auction_amount (auctionId, amount DESC),
  INDEX idx_client_status (clientId, status),
  INDEX idx_maxAmount (maxAmount),
  FOREIGN KEY (auctionId) REFERENCES Auction(id),
  FOREIGN KEY (clientId) REFERENCES Client(id)
);
```

---

## Bidding Algorithm

### Main Bid Placement Algorithm

```typescript
ALGORITHM: PlaceBid(auctionId, userId, amount, maxAmount?)

INPUT:
  - auctionId: BigInt
  - userId: BigInt  
  - amount: Decimal (user's current bid)
  - maxAmount: Decimal? (optional, for proxy bidding)

OUTPUT:
  - BidPlacementResult { success, bid, auction, error }

BEGIN TRANSACTION (SERIALIZABLE isolation)

  // STEP 1: Lock auction for update
  auction ← LOCK_FOR_UPDATE(SELECT * FROM Auction WHERE id = auctionId)
  
  IF auction IS NULL THEN
    RETURN { success: false, error: "Auction not found" }
  END IF
  
  // STEP 2: Validate auction state
  IF auction.status NOT IN ['ACTIVE', 'RUNNING', 'ENDING_SOON'] THEN
    RETURN { success: false, error: "Auction not accepting bids" }
  END IF
  
  // STEP 3: Check if auction ended (time-based)
  now ← CURRENT_TIMESTAMP()
  IF auction.endAt ≤ now THEN
    UPDATE Auction SET status = 'ENDED' WHERE id = auctionId
    RETURN { success: false, error: "Auction has ended" }
  END IF
  
  // STEP 4: Validate bidder permissions
  seller ← GET_SELLER(auction)
  IF seller.userId = userId THEN
    RETURN { success: false, error: "Sellers cannot bid on own auctions" }
  END IF
  
  client ← GET_CLIENT(userId)
  IF client IS NULL THEN
    RETURN { success: false, error: "Client profile not found" }
  END IF
  
  // STEP 5: Calculate minimum bid
  minBid ← auction.currentBid > 0 
    ? auction.currentBid + auction.minIncrement
    : auction.startPrice
    
  IF amount < minBid THEN
    RETURN { success: false, error: "Bid must be at least {minBid}" }
  END IF
  
  // STEP 6: Validate maxAmount
  IF maxAmount IS NOT NULL AND maxAmount < amount THEN
    RETURN { success: false, error: "Max amount must be ≥ bid amount" }
  END IF
  
  // STEP 7: Check if already highest bidder
  currentHighestBid ← GET_HIGHEST_BID(auction)
  IF currentHighestBid.clientId = client.id THEN
    RETURN { success: false, error: "Already highest bidder" }
  END IF
  
  // STEP 8: Handle proxy bidding (see Proxy Algorithm below)
  proxyResult ← HANDLE_PROXY_BIDDING({
    auction, 
    newBidderId: client.id, 
    amount, 
    maxAmount, 
    currentHighestBid
  })
  
  IF NOT proxyResult.success THEN
    RETURN proxyResult
  END IF
  
  finalAmount ← proxyResult.finalAmount
  
  // STEP 9: Create new bid
  newBid ← INSERT INTO Bid (
    auctionId: auctionId,
    clientId: client.id,
    amount: finalAmount,
    maxAmount: maxAmount,
    status: 'WINNING'
  )
  
  // STEP 10: Update previous highest bid
  IF currentHighestBid IS NOT NULL THEN
    UPDATE Bid SET status = 'OUTBID' WHERE id = currentHighestBid.id
  END IF
  
  // STEP 11: Check reserve price
  reserveMet ← (auction.reservePrice IS NULL) OR 
               (finalAmount ≥ auction.reservePrice)
  
  // STEP 12: Handle auto-extend
  wasExtended ← FALSE
  newEndTime ← auction.endAt
  
  IF auction.autoExtend = TRUE THEN
    timeRemaining ← auction.endAt - now
    extendThreshold ← auction.extendMinutes * 60 * 1000
    
    IF timeRemaining < extendThreshold THEN
      newEndTime ← now + extendThreshold
      wasExtended ← TRUE
    END IF
  END IF
  
  // STEP 13: Determine new status
  timeToEnd ← newEndTime - now
  newStatus ← auction.status
  
  IF timeToEnd < 15 * 60 * 1000 THEN  // 15 minutes
    newStatus ← 'ENDING_SOON'
  ELSE IF newStatus = 'SCHEDULED' THEN
    newStatus ← 'ACTIVE'
  END IF
  
  // STEP 14: Update auction
  UPDATE Auction SET
    currentBid = finalAmount,
    reserveMet = reserveMet,
    status = newStatus,
    endAt = newEndTime,
    extensionCount = wasExtended ? extensionCount + 1 : extensionCount,
    lastExtendedAt = wasExtended ? now : lastExtendedAt
  WHERE id = auctionId
  
  // STEP 15: Log activity
  INSERT INTO AuctionActivity (
    auctionId, 
    activityType: 'BID_PLACED',
    userId,
    metadata: { amount: finalAmount, wasExtended }
  )

COMMIT TRANSACTION

// STEP 16: Send real-time notifications (outside transaction)
PUSHER.trigger("auction-{auctionId}", "bid:placed", {
  amount: finalAmount,
  bidderId: client.id,
  wasExtended: wasExtended,
  newEndTime: newEndTime
})

RETURN { 
  success: true, 
  bid: newBid, 
  auction: updatedAuction,
  wasExtended 
}

END ALGORITHM
```

---

## Proxy Bidding Logic

### Proxy Bidding Algorithm (eBay-Style)

**Concept**: Users set a maximum amount they're willing to pay. The system automatically bids on their behalf, incrementally, up to their max amount.

**Rules**:
1. User A bids $100 with max $200
2. System places bid at $100 (starting price or current + increment)
3. User B bids $150 with max $250
4. System automatically:
   - Outbids A at $150
   - A's proxy kicks in at $160 (B's bid + increment)
   - B's proxy kicks in at $170
   - Continue until one max is reached
5. Winner is at loser's max + increment

**Tiebreaker**: If both users have same max amount, **first bidder wins**

```typescript
ALGORITHM: HandleProxyBidding(context)

INPUT:
  - auctionId: BigInt
  - newBidderId: BigInt
  - newBidAmount: Decimal
  - newMaxAmount: Decimal?
  - currentHighestBid: Bid?

OUTPUT:
  - { success, finalAmount, proxyBidsCreated, error }

// CASE 1: No max amount → regular bid
IF newMaxAmount IS NULL THEN
  RETURN { success: true, finalAmount: newBidAmount }
END IF

// CASE 2: No current highest bid → new bid wins
IF currentHighestBid IS NULL THEN
  RETURN { success: true, finalAmount: newBidAmount }
END IF

// CASE 3: Current high bidder has NO proxy
IF currentHighestBid.maxAmount IS NULL THEN
  RETURN { success: true, finalAmount: newBidAmount }
END IF

// CASE 4: Both have proxy bids - PROXY BATTLE!
currentMax ← currentHighestBid.maxAmount
minIncrement ← auction.minIncrement

// Check if new bidder's max is too low
IF newMaxAmount ≤ currentHighestBid.amount THEN
  RETURN { 
    success: false, 
    error: "Your max bid is not high enough" 
  }
END IF

// Determine winner of proxy battle
IF newMaxAmount > currentMax THEN
  // New bidder has higher max → they win at currentMax + increment
  finalAmount ← currentMax + minIncrement
  
  // Cap at their max
  IF finalAmount > newMaxAmount THEN
    finalAmount ← newMaxAmount
  END IF
  
  RETURN { 
    success: true, 
    finalAmount: finalAmount,
    proxyBidsCreated: 1
  }
  
ELSE IF newMaxAmount = currentMax THEN
  // TIE → first bidder wins (current highest)
  RETURN { 
    success: false, 
    error: "Tie: first bidder wins",
    errorCode: "TIE_FIRST_BIDDER_WINS"
  }
  
ELSE  // newMaxAmount < currentMax
  // Current bidder has higher max → they maintain lead
  finalAmount ← newMaxAmount
  
  // Create counter-proxy bid for current bidder
  counterBidAmount ← newMaxAmount + minIncrement
  
  IF counterBidAmount ≤ currentMax THEN
    INSERT INTO Bid (
      auctionId: auctionId,
      clientId: currentHighestBid.clientId,
      amount: counterBidAmount,
      maxAmount: currentMax,
      isProxyBid: TRUE,
      proxyGeneratedBy: currentHighestBid.id,
      status: 'WINNING'
    )
    
    // New bidder will be immediately outbid
    RETURN {
      success: false,
      error: "Outbid by proxy bid",
      errorCode: "PROXY_OUTBID"
    }
  END IF
END IF

END ALGORITHM
```

### Proxy Bidding Examples

**Example 1: Simple Proxy**
```
Initial: Starting price $100
User A: Bids $120 with max $200
Result: A wins at $100 (no competition)

User B: Bids $150 with max $180
Result: B's bid $150 placed
        A's proxy kicks in → $160
        B's proxy kicks in → $170
        A's proxy kicks in → $180
        B's proxy kicks in → $190 (would exceed B's max)
        FINAL: A wins at $190
```

**Example 2: Tie Scenario**
```
User A: Bids $100 with max $200
User B: Bids $150 with max $200
Result: TIE at $200 → User A wins (first bidder)
```

**Example 3: One-Sided Proxy**
```
User A: Bids $100 (no max)
User B: Bids $120 with max $200
Result: B wins at $120 (A has no proxy, B wins at their bid amount)
```

---

## Auto-Extend Mechanism

### Anti-Snipe Protection

**Purpose**: Prevent "sniping" (last-second bids that deny others time to respond)

**How it works**:
1. If a bid is placed in the last **5 minutes** (configurable)
2. AND `autoExtend` is enabled
3. THEN extend auction by **5 more minutes**
4. Repeat indefinitely until no bids in last 5 minutes

```typescript
ALGORITHM: CheckAutoExtend(auction, now)

INPUT:
  - auction: Auction object
  - now: Current timestamp

OUTPUT:
  - { shouldExtend: boolean, newEndTime: DateTime }

IF auction.autoExtend = FALSE THEN
  RETURN { shouldExtend: false, newEndTime: auction.endAt }
END IF

timeRemaining ← auction.endAt - now
extendThreshold ← auction.extendMinutes * 60 * 1000  // Convert to milliseconds

IF timeRemaining < extendThreshold THEN
  newEndTime ← now + extendThreshold
  RETURN { shouldExtend: true, newEndTime: newEndTime }
ELSE
  RETURN { shouldExtend: false, newEndTime: auction.endAt }
END IF

END ALGORITHM
```

**Auto-Extend Tracking**:
- `extensionCount`: Number of times extended
- `lastExtendedAt`: Timestamp of last extension
- Display to users: "Extended 3 times" with indicator

---

## Reserve Price Logic

### Hidden Minimum Price

**Purpose**: Seller sets minimum acceptable price, hidden from buyers

**Rules**:
1. Reserve price is NEVER shown to buyers
2. Buyers see "Reserve not met" or "Reserve met"
3. If highest bid < reserve at end → auction FAILS (no winner)
4. Seller can see reserve status in dashboard

```typescript
ALGORITHM: CheckReserveMet(currentBid, reservePrice)

IF reservePrice IS NULL THEN
  RETURN true  // No reserve = always met
END IF

RETURN currentBid ≥ reservePrice

END ALGORITHM
```

**Auction Success/Failure**:
```
END OF AUCTION:
  IF highestBid ≥ reservePrice (or no reserve) THEN
    status ← 'ENDED'
    winnerId ← highestBidder
    reserveMet ← TRUE
    → Create OrderRequest for winner
    → Notify winner
  ELSE
    status ← 'ENDED'
    winnerId ← NULL
    reserveMet ← FALSE
    → Notify seller: "Reserve not met"
    → Notify bidders: "Auction ended without sale"
  END IF
```

---

## Buy Now Functionality

### Instant Win

**Purpose**: Allow buyers to instantly win auction at fixed price

**Rules**:
1. `buyNowPrice` set by seller (optional)
2. Available only while auction is ACTIVE
3. Clicking "Buy Now" immediately:
   - Ends auction
   - Makes buyer the winner
   - Marks all other bids as LOST
4. Cannot be undone

```typescript
ALGORITHM: ExecuteBuyNow(auctionId, userId)

BEGIN TRANSACTION (SERIALIZABLE)

  auction ← LOCK_FOR_UPDATE(SELECT * FROM Auction WHERE id = auctionId)
  
  IF auction.buyNowPrice IS NULL THEN
    RETURN { success: false, error: "Buy Now not available" }
  END IF
  
  IF auction.status NOT IN ['ACTIVE', 'RUNNING', 'ENDING_SOON'] THEN
    RETURN { success: false, error: "Auction not active" }
  END IF
  
  client ← GET_CLIENT(userId)
  
  // Create winning bid
  winningBid ← INSERT INTO Bid (
    auctionId: auctionId,
    clientId: client.id,
    amount: auction.buyNowPrice,
    status: 'WON'
  )
  
  // Mark all other bids as LOST
  UPDATE Bid 
  SET status = 'LOST' 
  WHERE auctionId = auctionId AND id != winningBid.id
  
  // End auction immediately
  UPDATE Auction SET
    status = 'ENDED',
    currentBid = buyNowPrice,
    winnerId = client.id,
    winningBidId = winningBid.id,
    reserveMet = TRUE,
    endAt = CURRENT_TIMESTAMP()
  WHERE id = auctionId
  
  // Log activity
  INSERT INTO AuctionActivity (
    auctionId,
    activityType: 'BUY_NOW_EXECUTED',
    userId,
    metadata: { amount: buyNowPrice }
  )

COMMIT TRANSACTION

// Notify all watchers
PUSHER.trigger("auction-{auctionId}", "buy-now:executed", {
  winnerId: client.id
})

RETURN { success: true, auction, winningBid }

END ALGORITHM
```

---

## Winner Determination

### End-of-Auction Logic

**Tiebreaker Rule**: If multiple bids at same amount, **first bidder wins**

```typescript
ALGORITHM: DetermineWinner(auction)

// Get highest bid(s)
highestBids ← SELECT * FROM Bid 
              WHERE auctionId = auction.id 
              ORDER BY amount DESC, createdAt ASC
              LIMIT 1

IF highestBids IS EMPTY THEN
  // No bids → auction failed
  UPDATE Auction SET
    status = 'ENDED',
    winnerId = NULL,
    reserveMet = FALSE
  RETURN { success: false, reason: "NO_BIDS" }
END IF

winningBid ← highestBids[0]
winningAmount ← winningBid.amount

// Check reserve price
IF auction.reservePrice IS NOT NULL AND 
   winningAmount < auction.reservePrice THEN
  // Reserve not met → auction failed
  UPDATE Auction SET
    status = 'ENDED',
    winnerId = NULL,
    reserveMet = FALSE
  
  UPDATE Bid SET status = 'LOST' WHERE auctionId = auction.id
  
  NOTIFY_SELLER("Reserve not met")
  NOTIFY_BIDDERS("Auction ended without sale")
  
  RETURN { success: false, reason: "RESERVE_NOT_MET" }
END IF

// SUCCESS: Assign winner
UPDATE Auction SET
  status = 'ENDED',
  winnerId = winningBid.clientId,
  winningBidId = winningBid.id,
  reserveMet = TRUE

UPDATE Bid SET status = 'WON' WHERE id = winningBid.id
UPDATE Bid SET status = 'LOST' WHERE auctionId = auction.id AND id != winningBid.id

NOTIFY_WINNER(winningBid.clientId, auction)
NOTIFY_SELLER(auction.sellerId, winningBid)
NOTIFY_LOSERS(auction)

CREATE_ORDER_REQUEST(winningBid)

RETURN { success: true, winnerId: winningBid.clientId }

END ALGORITHM
```

---

## Race Condition Prevention

### Critical Sections

**Problem**: Multiple users bidding simultaneously can cause:
1. Two bids at same time → both think they're winning
2. Auction extends multiple times for same bid
3. Proxy bids calculate incorrectly

**Solution**: Database-level locking with `SERIALIZABLE` isolation

### Transaction Isolation

```typescript
// Use SERIALIZABLE isolation level
await prisma.$transaction(
  async (tx) => {
    // All auction operations here
    // Database ensures no concurrent modifications
  },
  {
    isolationLevel: 'Serializable',  // Strongest isolation
    timeout: 10000  // 10 second timeout
  }
);
```

### Lock Acquisition Order

To prevent deadlocks, always acquire locks in this order:
1. Auction
2. Bids (highest first)
3. Client
4. Related entities

```typescript
// CORRECT ORDER
auction ← LOCK Auction
currentBid ← LOCK highest Bid
client ← LOCK Client
// ... perform operations

// WRONG ORDER (can deadlock)
client ← LOCK Client  // ❌
auction ← LOCK Auction  // ❌
```

### Optimistic Concurrency

For less critical operations, use version numbers:

```sql
UPDATE Auction 
SET currentBid = 150, version = version + 1
WHERE id = 123 AND version = 5
```

If `version` changed, retry transaction.

---

## State Transition Diagram

```
┌─────────┐
│  DRAFT  │ (Vendor creating auction)
└────┬────┘
     │ publish
     ▼
┌───────────┐
│ SCHEDULED │ (Waiting for startTime)
└─────┬─────┘
      │ startTime reached
      ▼
┌────────┐     timeRemaining < 15 min     ┌──────────────┐
│ ACTIVE │────────────────────────────────▶│ ENDING_SOON  │
└────┬───┘                                 └──────┬───────┘
     │                                            │
     │ timeRemaining ≤ 0                          │ timeRemaining ≤ 0
     │                                            │
     └────────────────────┬──────────────────────┘
                          ▼
                     ┌─────────┐
                     │  ENDED  │ (Determine winner)
                     └────┬────┘
                          │
                          │ after 90 days
                          ▼
                     ┌──────────┐
                     │ ARCHIVED │
                     └──────────┘

Special States:
┌───────────┐  Vendor action
│ CANCELLED │◄─────────────── Any active state
└───────────┘
```

---

## Monitoring & Automation

### Cron Job Schedule

```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/monitor-auctions",
    "schedule": "*/2 * * * *"  // Every 2 minutes
  }]
}
```

### Monitoring Tasks

**Every 2 minutes**:
1. Start scheduled auctions (`startAt` ≤ now)
2. Mark auctions as `ENDING_SOON` (< 15 min remaining)
3. End expired auctions (`endAt` ≤ now)
4. Determine winners
5. Send notifications

```typescript
ALGORITHM: MonitorAuctions()

now ← CURRENT_TIMESTAMP()

// Task 1: Start scheduled auctions
UPDATE Auction 
SET status = 'ACTIVE' 
WHERE status = 'SCHEDULED' AND startAt ≤ now

// Task 2: Mark ending soon
fifteenMinutesFromNow ← now + (15 * 60 * 1000)

UPDATE Auction 
SET status = 'ENDING_SOON'
WHERE status IN ('ACTIVE', 'RUNNING')
  AND endAt ≤ fifteenMinutesFromNow
  AND endAt > now

// Task 3: End expired auctions
expiredAuctions ← SELECT * FROM Auction
                  WHERE status IN ('ACTIVE', 'RUNNING', 'ENDING_SOON')
                    AND endAt ≤ now

FOR EACH auction IN expiredAuctions DO
  DetermineWinner(auction)
END FOR

RETURN { 
  auctionsStarted: count1, 
  auctionsEndingSoon: count2,
  auctionsEnded: count3 
}

END ALGORITHM
```

---

## Query Optimization

### Critical Queries

**1. Find Ending Soon Auctions**
```sql
SELECT * FROM Auction
WHERE status IN ('ACTIVE', 'RUNNING')
  AND endAt BETWEEN NOW() AND NOW() + INTERVAL 15 MINUTE

-- Optimized with index:
INDEX idx_status_endAt (status, endAt)
```

**2. Get Highest Bid**
```sql
SELECT * FROM Bid
WHERE auctionId = ?
  AND status IN ('ACTIVE', 'WINNING')
ORDER BY amount DESC, createdAt ASC
LIMIT 1

-- Optimized with index:
INDEX idx_auction_amount (auctionId, amount DESC)
```

**3. User's Active Bids**
```sql
SELECT b.*, a.title, a.endAt
FROM Bid b
JOIN Auction a ON b.auctionId = a.id
WHERE b.clientId = ?
  AND b.status IN ('ACTIVE', 'WINNING')
  AND a.status IN ('ACTIVE', 'RUNNING', 'ENDING_SOON')
ORDER BY a.endAt ASC

-- Optimized with index:
INDEX idx_client_status (clientId, status)
```

### Performance Tips

1. **Use Covering Indexes**: Include all SELECT columns in index
2. **Denormalize Counters**: Store `bidsCount` on Auction table
3. **Cache Hot Data**: Redis for countdown timers
4. **Pagination**: Always use LIMIT/OFFSET
5. **Avoid N+1**: Use JOIN or `include` in Prisma

---

## Edge Cases

### 1. Auction Ends During Bid Processing

**Scenario**: User clicks "Bid" but auction ends before transaction commits

**Solution**:
```typescript
// Check endAt inside transaction
IF auction.endAt ≤ CURRENT_TIMESTAMP() THEN
  RETURN { error: "Auction has ended" }
END IF
```

### 2. Multiple Bids at Same Second

**Scenario**: Two users bid exact same amount at same time

**Solution**:
- Tiebreaker: `ORDER BY amount DESC, createdAt ASC`
- First bid wins
- Database timestamp precision: milliseconds

### 3. Auto-Extend Loop

**Scenario**: Two users keep bidding in last 5 minutes → infinite extension

**Solution**:
- This is intended behavior!
- Auction continues until no bids in last 5 minutes
- Track with `extensionCount` for transparency
- Optional: Max extensions limit (e.g., 10)

### 4. Reserve Price Exactly Met

**Scenario**: Highest bid equals reserve price exactly

**Solution**:
```typescript
reserveMet ← currentBid ≥ reservePrice  // Equals counts as met
```

### 5. Buy Now During Proxy Battle

**Scenario**: User A and B in proxy battle, User C clicks Buy Now

**Solution**:
- Buy Now takes precedence
- Transaction locks auction
- User C wins immediately
- Users A and B marked as LOST

### 6. Seller Cancels Active Auction

**Scenario**: Auction has bids but seller cancels

**Solution**:
```typescript
IF auction HAS BIDS THEN
  // Refund all bidders (virtual currency)
  FOR EACH bid IN auction.bids DO
    CREATE_REFUND(bid.clientId, bid.amount)
    NOTIFY(bid.clientId, "Auction cancelled, refund issued")
  END FOR
  
  auction.status ← 'CANCELLED'
  LOG_AUDIT("Auction cancelled with bids", auction.id)
END IF
```

### 7. Network Delay (Client-Server Time Mismatch)

**Scenario**: User's clock shows 2 minutes remaining, server shows 10 seconds

**Solution**:
- **Always use server time** for logic
- Client countdown is visual only
- Sync every 30 seconds: `GET /api/auctions/:id/time-remaining`
- Show warning if client-server drift > 10 seconds

### 8. Database Connection Loss During Transaction

**Scenario**: Database crashes mid-transaction

**Solution**:
```typescript
try {
  await prisma.$transaction(async (tx) => {
    // Bid operations
  }, { 
    timeout: 10000,  // 10s timeout
    maxWait: 5000    // Max 5s wait for connection
  });
} catch (error) {
  // Transaction automatically rolled back
  // No partial state persisted
  NOTIFY_USER("Please try again")
}
```

---

## Summary

This auction system provides enterprise-grade reliability with:

✅ **Proxy Bidding**: eBay-style automatic bidding  
✅ **Anti-Snipe**: Auto-extend prevents last-second bids  
✅ **Reserve Price**: Hidden minimum for seller protection  
✅ **Buy Now**: Instant purchase option  
✅ **Race Condition Prevention**: SERIALIZABLE transactions  
✅ **Real-time Updates**: WebSocket notifications  
✅ **Robust Edge Case Handling**: All scenarios covered  
✅ **Optimized Queries**: Indexed for performance  
✅ **Automated Monitoring**: Cron-based state management  

**Next Steps**:
1. Run `npx prisma migrate dev` to apply schema changes
2. Deploy cron job to Vercel
3. Set `CRON_SECRET` environment variable
4. Test proxy bidding scenarios
5. Monitor with `/api/cron/monitor-auctions`

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auctions/:id/bids` | POST | Place bid (regular or proxy) |
| `/api/auctions/:id/bids` | GET | Get bid history |
| `/api/auctions/:id/buy-now` | POST | Execute Buy Now |
| `/api/cron/monitor-auctions` | GET | Run monitoring (cron) |
| `/api/auctions/:id` | GET | Get auction details |

---

**Documentation Version**: 1.0  
**Last Updated**: 2025-10-15  
**Author**: Auction System Architecture Team

