# Real-Time Bidding Setup Guide

Complete guide to set up and test real-time bidding with Pusher.

---

## Prerequisites

- Node.js 18+ installed
- MySQL database running
- Pusher account (free tier available)

---

## Step 1: Create Pusher Account

1. Go to [https://pusher.com](https://pusher.com)
2. Sign up for a free account
3. Create a new Channels app:
   - Name: `bidinsouk-dev` (or your choice)
   - Cluster: Choose closest to your location (e.g., `eu`, `us2`)
   - Tech stack: Select "React" for frontend, "Node.js" for backend

4. Copy your credentials from the "App Keys" tab:
   ```
   app_id = "123456"
   key = "abcdef123456"
   secret = "xyz789secret"
   cluster = "eu"
   ```

---

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env` (if not already done):
   ```bash
   cp .env.example .env
   ```

2. Add Pusher credentials to `.env`:
   ```env
   # Server-side (keep secret!)
   PUSHER_APP_ID=123456
   PUSHER_KEY=abcdef123456
   PUSHER_SECRET=xyz789secret
   PUSHER_CLUSTER=eu

   # Client-side (exposed to browser)
   NEXT_PUBLIC_PUSHER_KEY=abcdef123456
   NEXT_PUBLIC_PUSHER_CLUSTER=eu
   ```

   ⚠️ **Important**: 
   - `PUSHER_SECRET` must NEVER be exposed to the client
   - Only `NEXT_PUBLIC_*` variables are accessible in the browser

---

## Step 3: Install Dependencies

Dependencies are already in `package.json`, but verify:

```bash
npm install
```

Key packages:
- `pusher` (server-side)
- `pusher-js` (client-side)

---

## Step 4: Test Pusher Connection

### A. Test Server-Side Pusher

Create a test script:

```bash
npx tsx -e "
import { pusher } from './lib/realtime/pusher';
pusher.trigger('test-channel', 'test-event', { message: 'Hello Pusher!' })
  .then(() => console.log('✅ Pusher server connection works!'))
  .catch(err => console.error('❌ Pusher error:', err));
"
```

### B. Test Client-Side Pusher

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser console at `http://localhost:3000`

3. Run in console:
   ```javascript
   import PusherClient from 'pusher-js';
   const client = new PusherClient('YOUR_KEY', { cluster: 'eu' });
   const channel = client.subscribe('test-channel');
   channel.bind('test-event', (data) => {
     console.log('✅ Received:', data);
   });
   ```

4. Trigger an event from server (Step 4A) and verify it appears in browser console

---

## Step 5: Create Test Auction

1. Ensure database is seeded:
   ```bash
   npm run seed:complete
   ```

2. Get auction IDs:
   ```bash
   npx tsx scripts/get-auction-ids.ts
   ```

   Output:
   ```
   Available Auctions:
   1. ID: 1 - Vintage Camera (Status: RUNNING)
   2. ID: 2 - Antique Watch (Status: SCHEDULED)
   ```

3. Pick an auction with status `RUNNING` or update one:
   ```sql
   UPDATE Auction SET status = 'RUNNING', endAt = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = 1;
   ```

---

## Step 6: Test Real-Time Bidding

### Automated Test

Run the test script:

```bash
npx tsx scripts/test-realtime-bidding.ts 1
```

Expected output:
```
🧪 Testing Real-Time Bidding System

Auction ID: 1

📋 Fetching auction details...
✅ Auction: Vintage Camera
   Status: RUNNING
   Current Bid: $100
   Total Bids: 0

👥 Finding test users...
✅ Found 3 test users

🔄 Testing sequential bids...

   User 1: John Doe
   Bidding: $110
   ✅ Bid placed successfully
   📡 Pusher event triggered: auction-1 -> bid:new
   💰 New current bid: $110

   User 2: Jane Smith
   Bidding: $120
   ✅ Bid placed successfully
   📡 Pusher event triggered: auction-1 -> bid:new
   💰 New current bid: $120

⚡ Testing race condition (simultaneous bids)...
   ✅ User 1 bid succeeded: $130
   ✅ User 2 bid succeeded: $140

✅ Real-time bidding test completed!
```

### Manual Test (Browser)

1. Open two browser windows side-by-side:
   - Window A: `http://localhost:3000/auctions/1`
   - Window B: `http://localhost:3000/auctions/1`

2. In Window A, place a bid

3. Verify Window B updates automatically (within 1-2 seconds)

4. Check for toast notification in Window B

---

## Step 7: Verify Pusher Events

### Pusher Debug Console

1. Go to [https://dashboard.pusher.com](https://dashboard.pusher.com)

2. Select your app

3. Click "Debug Console" in the left sidebar

4. Place a bid in your app

5. Verify you see events like:
   ```json
   {
     "channel": "auction-1",
     "event": "bid:new",
     "data": {
       "auctionId": 1,
       "currentBid": 150,
       "bidderName": "John Doe",
       "bidCount": 5,
       "timestamp": "2025-10-15T10:30:00Z"
     }
   }
   ```

### Browser DevTools

1. Open browser DevTools (F12)

2. Go to Network tab

3. Filter by "WS" (WebSocket)

4. Click on the Pusher WebSocket connection

5. Go to "Messages" tab

6. Place a bid and watch messages flow in real-time

---

## Step 8: Integration with Your App

### Add to Auction Detail Page

```typescript
// app/auctions/[id]/page.tsx
import { AuctionDetailRealtime } from '@/components/auctions/AuctionDetailRealtime';
import { getServerSession } from 'next-auth';

export default async function AuctionPage({ params }: { params: { id: string } }) {
  const session = await getServerSession();
  
  const auction = await prisma.auction.findUnique({
    where: { id: BigInt(params.id) },
  });

  return (
    <AuctionDetailRealtime 
      auction={auction} 
      userId={session?.user?.id}
    />
  );
}
```

### Custom Hook Usage

```typescript
import { useRealtimeAuction } from '@/hooks/useRealtimeAuction';

function MyAuctionComponent({ auctionId }: { auctionId: number }) {
  const { isConnected } = useRealtimeAuction({
    auctionId,
    onBidUpdate: (data) => {
      console.log('New bid:', data.currentBid);
      // Update your UI
    },
    onAuctionExtend: (newEndTime) => {
      console.log('Auction extended to:', newEndTime);
    },
    enableNotifications: true,
  });

  return (
    <div>
      {isConnected ? '🟢 Live' : '🔴 Offline'}
    </div>
  );
}
```

---

## Troubleshooting

### Issue: "Pusher connection failed"

**Solution:**
1. Verify credentials in `.env`
2. Check Pusher dashboard for app status
3. Ensure `NEXT_PUBLIC_PUSHER_KEY` is set (restart dev server after adding)

### Issue: "Events not received in browser"

**Solution:**
1. Check browser console for errors
2. Verify channel name matches: `auction-${auctionId}`
3. Check Pusher Debug Console to see if events are being sent
4. Ensure WebSocket is not blocked by firewall/proxy

### Issue: "Bid placed but no Pusher event"

**Solution:**
1. Check server logs for Pusher errors
2. Verify `PUSHER_SECRET` is correct
3. Check Pusher dashboard for rate limits
4. Ensure transaction completed successfully

### Issue: "Multiple events received for one bid"

**Solution:**
1. Check for duplicate subscriptions (missing cleanup in useEffect)
2. Verify `channel.unsubscribe()` is called on unmount
3. Use React StrictMode to detect double-mounting issues

### Issue: "Polling fallback not working"

**Solution:**
1. Verify `enablePollingFallback: true` in hook options
2. Check API endpoint `/api/auctions/[id]` is accessible
3. Look for CORS errors in browser console

---

## Performance Optimization

### For High-Traffic Auctions (100+ concurrent users)

1. **Enable batching** (see `docs/REALTIME_BIDDING_ARCHITECTURE.md` section 4B)

2. **Use presence channels** to track active users:
   ```typescript
   const channel = pusherClient.subscribe('presence-auction-123');
   channel.bind('pusher:subscription_succeeded', (members) => {
     console.log(`${members.count} users watching`);
   });
   ```

3. **Implement rate limiting** on bid API (already included in enhanced service)

4. **Monitor Pusher usage** in dashboard to avoid hitting limits

---

## Security Checklist

✅ `PUSHER_SECRET` is in `.env` and NOT in `.env.example`  
✅ `.env` is in `.gitignore`  
✅ Only server triggers events (clients cannot)  
✅ Bid validation happens server-side  
✅ Client validates received events (timestamp, amount)  
✅ Rate limiting enabled on bid API  
✅ CSRF protection enabled (Next.js default)  

---

## Production Deployment

### Environment Variables

Ensure these are set in your production environment:

```env
PUSHER_APP_ID=your-prod-app-id
PUSHER_KEY=your-prod-key
PUSHER_SECRET=your-prod-secret
PUSHER_CLUSTER=your-cluster

NEXT_PUBLIC_PUSHER_KEY=your-prod-key
NEXT_PUBLIC_PUSHER_CLUSTER=your-cluster
```

### Pusher Plan

Free tier limits:
- 100 concurrent connections
- 200,000 messages/day
- 100 channels

For production, consider:
- **Startup Plan** ($49/month): 500 connections, 1M messages/day
- **Professional Plan** ($299/month): 2,000 connections, 10M messages/day

### Monitoring

1. Set up Pusher webhooks for connection events
2. Monitor message volume in Pusher dashboard
3. Set up alerts for rate limit warnings
4. Log Pusher errors to your error tracking service

---

## Next Steps

1. ✅ Set up Pusher account
2. ✅ Configure environment variables
3. ✅ Test connection
4. ✅ Run automated tests
5. ✅ Test in browser
6. ✅ Integrate with your app
7. 📚 Read `docs/REALTIME_BIDDING_ARCHITECTURE.md` for advanced topics
8. 🚀 Deploy to production

---

## Support

- **Pusher Docs**: https://pusher.com/docs/channels
- **Pusher Support**: https://support.pusher.com
- **Project Issues**: [Your GitHub Issues URL]

---

**Congratulations! Your real-time bidding system is now live! 🎉**
