# Real-Time Bidding Quick Reference

Fast reference for common tasks and patterns.

---

## Quick Start (5 Minutes)

```bash
# 1. Set up Pusher credentials in .env
PUSHER_APP_ID=123456
PUSHER_KEY=abcdef
PUSHER_SECRET=secret
NEXT_PUBLIC_PUSHER_KEY=abcdef

# 2. Test connection
npm run test:realtime 1

# 3. Start dev server
npm run dev

# 4. Open http://localhost:3000/auctions/1
```

---

## Common Patterns

### 1. Subscribe to Auction Updates

```typescript
import { useRealtimeAuction } from '@/hooks/useRealtimeAuction';

function AuctionComponent({ auctionId }: { auctionId: number }) {
  const { isConnected } = useRealtimeAuction({
    auctionId,
    onBidUpdate: (data) => {
      console.log('New bid:', data.currentBid);
    },
  });

  return <div>{isConnected ? 'Live' : 'Offline'}</div>;
}
```

### 2. Place a Bid

```typescript
async function placeBid(auctionId: number, amount: number) {
  const response = await fetch(`/api/auctions/${auctionId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error);
  }
  
  return data;
}
```

### 3. Trigger Custom Event (Server-Side)

```typescript
import { pusher } from '@/lib/realtime/pusher';

await pusher.trigger('auction-123', 'custom:event', {
  message: 'Something happened',
  timestamp: new Date().toISOString(),
});
```

### 4. Listen for Custom Event (Client-Side)

```typescript
useEffect(() => {
  const channel = pusherClient.subscribe(`auction-${auctionId}`);
  
  channel.bind('custom:event', (data) => {
    console.log('Custom event:', data);
  });
  
  return () => {
    channel.unbind('custom:event');
    channel.unsubscribe();
  };
}, [auctionId]);
```

---

## Event Types

### Standard Events

| Event | Triggered When | Payload |
|-------|---------------|---------|
| `bid:new` | New bid placed | `{ currentBid, bidderName, bidCount, timestamp }` |
| `auction:extend` | Auction extended | `{ newEndTime, extendMinutes, timestamp }` |
| `auction:status` | Status changed | `{ status, timestamp }` |
| `auction:end` | Auction ended | `{ winnerId?, winningBid?, timestamp }` |

### Custom Events

You can trigger custom events for:
- Auction starting soon
- Reserve price met
- Bidder notifications
- Admin actions

---

## API Endpoints

### Place Bid
```
POST /api/auctions/[id]/bids
Body: { amount: number }
Response: { success: boolean, bid?, auction?, error? }
```

### Get Missed Bids
```
GET /api/auctions/[id]/bids-since?since=<timestamp>
Response: Bid[]
```

### Get Auction Details
```
GET /api/auctions/[id]
Response: Auction
```

---

## Error Handling

### Client-Side

```typescript
try {
  await placeBid(auctionId, amount);
} catch (error) {
  if (error.message.includes('Bid must be at least')) {
    // Show minimum bid error
  } else if (error.message.includes('already the highest bidder')) {
    // Show self-bid error
  } else if (error.message.includes('ended')) {
    // Show auction ended error
  } else {
    // Generic error
  }
}
```

### Server-Side

```typescript
import { placeBidEnhanced } from '@/lib/services/bids-enhanced';

const result = await placeBidEnhanced(auctionId, userId, amount);

if (!result.success) {
  // Handle error
  console.error(result.error);
  return NextResponse.json({ error: result.error }, { status: 400 });
}

// Success
return NextResponse.json(result);
```

---

## Testing Commands

```bash
# Test real-time bidding
npm run test:realtime 1

# Get auction IDs
npx tsx scripts/get-auction-ids.ts

# Seed test data
npm run seed:complete

# Check Pusher connection
npx tsx -e "import { pusher } from './lib/realtime/pusher'; pusher.trigger('test', 'test', {}).then(() => console.log('OK'))"
```

---

## Debugging

### Check Pusher Connection State

```typescript
import { pusherClient } from '@/lib/realtime/pusher';

console.log('State:', pusherClient.connection.state);
// States: initialized, connecting, connected, unavailable, failed, disconnected
```

### Monitor Events in Browser

```javascript
// Open DevTools Console
const channel = pusherClient.subscribe('auction-123');
channel.bind_global((event, data) => {
  console.log('Event:', event, 'Data:', data);
});
```

### Check Server Logs

```bash
# Look for Pusher errors
grep -i "pusher" logs/app.log

# Or in development
# Check terminal output for "Failed to trigger Pusher event"
```

---

## Performance Tips

### 1. Debounce UI Updates

```typescript
import { useDebouncedValue } from '@mantine/hooks';

const [currentBid, setCurrentBid] = useState(100);
const [debouncedBid] = useDebouncedValue(currentBid, 200);

// Use debouncedBid in UI
```

### 2. Unsubscribe When Not Needed

```typescript
useEffect(() => {
  if (!isVisible) {
    channel.unsubscribe();
  }
}, [isVisible]);
```

### 3. Batch Updates

```typescript
// Instead of updating on every bid
channel.bind('bid:new', (data) => {
  // Batch updates every 500ms
  queueUpdate(data);
});
```

---

## Security Best Practices

✅ **DO:**
- Validate all bids server-side
- Use transactions for race condition prevention
- Rate limit bid API
- Validate event timestamps client-side
- Keep `PUSHER_SECRET` secret

❌ **DON'T:**
- Trust client-side validation alone
- Expose `PUSHER_SECRET` to client
- Allow clients to trigger events
- Skip timestamp validation
- Ignore rate limits

---

## Common Issues & Solutions

### Issue: Events not received

```typescript
// Check connection state
console.log(pusherClient.connection.state);

// Verify channel subscription
console.log(channel.subscribed); // Should be true

// Check event binding
channel.bind('bid:new', (data) => {
  console.log('Received:', data); // Should log on new bid
});
```

### Issue: Multiple subscriptions

```typescript
// ❌ BAD - Creates new subscription on every render
function Component() {
  const channel = pusherClient.subscribe('auction-123');
  // ...
}

// ✅ GOOD - Subscribes once, cleans up
function Component() {
  useEffect(() => {
    const channel = pusherClient.subscribe('auction-123');
    return () => channel.unsubscribe();
  }, []);
}
```

### Issue: Stale data after reconnection

```typescript
// Use the catch-up mechanism
pusherClient.connection.bind('connected', async () => {
  const lastBidTime = localStorage.getItem('lastBidTime');
  const response = await fetch(`/api/auctions/${id}/bids-since?since=${lastBidTime}`);
  const missedBids = await response.json();
  // Apply missed bids
});
```

---

## Pusher Dashboard

Quick links:
- **Debug Console**: See events in real-time
- **Metrics**: Monitor usage and performance
- **Settings**: Manage app credentials
- **Webhooks**: Set up event notifications

URL: https://dashboard.pusher.com

---

## Production Checklist

- [ ] Pusher credentials set in production environment
- [ ] `NEXT_PUBLIC_*` variables configured
- [ ] Rate limiting enabled
- [ ] Error tracking configured
- [ ] Pusher plan upgraded (if needed)
- [ ] Webhooks configured for monitoring
- [ ] Load testing completed
- [ ] Fallback polling tested
- [ ] Security audit completed

---

## Resources

- **Architecture**: `docs/REALTIME_BIDDING_ARCHITECTURE.md`
- **Setup Guide**: `docs/REALTIME_BIDDING_SETUP.md`
- **Pusher Docs**: https://pusher.com/docs/channels
- **React Hook**: `hooks/useRealtimeAuction.ts`
- **Bid Service**: `lib/services/bids-enhanced.ts`
- **Test Script**: `scripts/test-realtime-bidding.ts`

---

## Support

Need help? Check:
1. This quick reference
2. Architecture documentation
3. Pusher documentation
4. Browser DevTools console
5. Pusher Debug Console

---

**Happy bidding! 🎉**
