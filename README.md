## 🚀 Quick Start

**IMPORTANT:** Before running the application, you MUST generate the Prisma client!

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database

#### Option A: Using Docker (Recommended)
```bash
# Start MySQL container
docker-compose up -d
```

#### Option B: Use Existing MySQL
Create `.env.local` file:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DBNAME?connection_limit=10"
NEXTAUTH_SECRET="your-secret-key-here"
```

Example with Docker MySQL:
```env
DATABASE_URL="mysql://root:root@localhost:3306/bidinsouk?connection_limit=10"
NEXTAUTH_SECRET="change-this-to-a-random-secret"
```

### 3. Generate Prisma Client (CRITICAL!)
```bash
npx prisma generate
```
⚠️ **This step is required** - it generates TypeScript types for database access.

### 4. Run Migrations
```bash
npx prisma migrate deploy
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 📖 Detailed Setup

See **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** for complete setup guide, troubleshooting, and production deployment.

### Useful Commands

```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Apply migrations
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:deploy

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (WARNING: deletes all data)
npm run prisma:migrate:reset
```

---

## 📚 Documentation

- **[Setup Instructions](./SETUP_INSTRUCTIONS.md)** - Complete setup guide and troubleshooting
- **[Authentication Guide](./AUTHENTICATION_GUIDE.md)** - Complete authentication setup and usage
- **[API Testing Guide](./API_TESTING_GUIDE.md)** - Testing examples for all endpoints
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Overview of all implemented features
- **[Features Checklist](./FEATURES_CHECKLIST.md)** - Complete feature checklist from requirements

---

## 🔐 Authentication

This application uses **NextAuth.js v4** with credentials-based authentication.

### Quick Start

1. **Environment Setup** - Add to `.env`:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
   ```

2. **Frontend Pages**:
   - Login: `http://localhost:3000/login`
   - Register: `http://localhost:3000/register`

3. **Test Authentication**:
   ```bash
   npx tsx scripts/test-auth.ts
   ```

### Using Authentication

**In Client Components:**
```tsx
'use client'
import { useSession } from 'next-auth/react'

export default function MyComponent() {
  const { data: session } = useSession()
  return <div>Welcome {session?.user?.name}</div>
}
```

**In API Routes:**
```tsx
import { requireAuth } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  // user.userId, user.role, user.email available
}
```

**Protected Routes:**
- `/admin/*` - Admin only
- `/vendor/*` - Vendor and Admin

See **[AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)** for complete documentation.

---

## API Routes

### Authentication & User Management

- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email with OTP code
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update user profile
- `GET /api/users/addresses` - List user addresses
- `POST /api/users/addresses` - Add new address
- `PATCH /api/users/addresses/[id]` - Update address
- `DELETE /api/users/addresses/[id]` - Delete address

### Vendor Management

- `POST /api/vendors/apply` - Apply to become vendor
- `POST /api/vendors/kyc` - Submit KYC documents
- `GET /api/vendors/kyc` - Get KYC status
- `GET /api/vendors/orders` - List vendor orders (requires storeId param)
- `PATCH /api/vendors/orders/[id]/status` - Update order fulfillment status

### Store Management

- `POST /api/stores` - Create store (vendor only)
- `GET /api/stores/[slug]` - Get store by slug
- `PATCH /api/stores/[id]` - Update store (vendor only)
- `GET /api/stores/[id]/products` - List store products
- `GET /api/stores/[id]/stats` - Get store statistics (vendor only)

### Products

- `GET /api/products` - List products with filters
- `POST /api/products` - Create product (vendor only)
- `GET /api/products/[id]` - Get product details
- `PATCH /api/products/[id]` - Update product (vendor only)
- `DELETE /api/products/[id]` - Archive product (vendor only)
- `GET /api/products/[id]/reviews` - List product reviews
- `POST /api/products/[id]/reviews` - Submit review (client only)

### Auctions

- `GET /api/auctions` - List auctions with filters
- `POST /api/auctions` - Create auction (vendor only)
- `GET /api/auctions/[id]` - Get auction details with bid history
- `PATCH /api/auctions/[id]` - Update auction (vendor only, before start)
- `POST /api/auctions/[id]/bids` - Place bid (client only)
- `POST /api/auctions/[id]/auto-bid` - Set auto-bid (client only)
- `GET /api/auctions/[id]/winner` - Get auction winner

### Cart & Checkout

- `GET /api/cart` - Get cart
- `POST /api/cart` - Add item to cart
- `PATCH /api/cart/items/[id]` - Update cart item quantity
- `DELETE /api/cart/items/[id]` - Remove item from cart
- `POST /api/checkout` - Create order from cart

### Orders

- `GET /api/orders` - List user orders (client)
- `GET /api/orders/[id]` - Get order details
- `DELETE /api/orders/[id]` - Cancel order (client, pending only)
- `POST /api/orders/requests` - Create order request (client)
- `POST /api/orders/requests/[id]/accept` - Accept order request (vendor)
- `POST /api/orders/requests/[id]/refuse` - Refuse order request (vendor)

### Watchlist

- `GET /api/watchlist` - Get user watchlist
- `POST /api/watchlist` - Add product to watchlist
- `DELETE /api/watchlist/[productId]` - Remove from watchlist

### Notifications

- `GET /api/notifications` - List notifications
- `PATCH /api/notifications` - Mark all as read
- `PATCH /api/notifications/[id]/read` - Mark notification as read
- `GET /api/notifications/unread-count` - Get unread count

### Messaging

- `POST /api/threads` - Create thread
- `GET /api/threads/[id]` - Get thread with messages
- `POST /api/threads/[id]/messages` - Send message

### Search

- `GET /api/search` - Universal search (products + auctions)
- `GET /api/search/suggest` - Autocomplete suggestions

### Reviews

- `GET /api/products/[id]/reviews` - List product reviews
- `POST /api/products/[id]/reviews` - Submit review (client only)

### Saved Searches

- `GET /api/saved-searches` - Get user saved searches
- `POST /api/saved-searches` - Save search query
- `DELETE /api/saved-searches/[id]` - Delete saved search

### Abuse Reports

- `GET /api/abuse-reports` - List abuse reports (admin only)
- `POST /api/abuse-reports` - Report abuse
- `GET /api/abuse-reports/[id]` - Get report details (admin only)
- `PATCH /api/abuse-reports/[id]` - Update report status (admin only)

### Vendor Dashboard

- `GET /api/vendors/dashboard` - Get vendor statistics
- `GET /api/vendors/audit-logs` - Get vendor audit logs
- `GET /api/vendors/orders` - List vendor orders
- `PATCH /api/vendors/orders/[id]/status` - Update order fulfillment status

### Banners/CMS

- `GET /api/banners` - Get all banners or by slot
- `POST /api/banners` - Create banner (admin only)
- `PATCH /api/banners/[id]` - Update banner (admin only)
- `DELETE /api/banners/[id]` - Delete banner (admin only)

### Admin - Moderation

- `GET /api/admin/vendors/pending` - List pending vendors
- `POST /api/admin/vendors/[id]/approve` - Approve vendor
- `POST /api/admin/vendors/[id]/reject` - Reject vendor
- `POST /api/admin/products/[id]/moderate` - Moderate product (ACTIVE/ARCHIVED)
- `POST /api/admin/auctions/[id]/moderate` - Moderate auction (SCHEDULED/ARCHIVED)
- `POST /api/admin/reviews/[id]/moderate` - Moderate review (APPROVED/REJECTED)
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/[id]` - Delete user
- `PATCH /api/admin/users/[id]` - Update user role
- `DELETE /api/admin/stores/[id]` - Delete store
- `PATCH /api/admin/stores/[id]` - Update store status
- `GET /api/admin/stats` - Get platform statistics

## API Testing Examples

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "password123",
    "locale": "fr",
    "acceptTerms": true
  }'
```

### Create Store (Vendor)
```bash
curl -X POST http://localhost:3000/api/stores \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ma Boutique",
    "slug": "ma-boutique",
    "email": "store@example.com",
    "phone": "+212600000000"
  }'
```

### Create Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "1",
    "title": "iPhone 15 Pro",
    "brand": "Apple",
    "category": "Smartphones",
    "condition": "NEW"
  }'
```

### Create Auction
```bash
curl -X POST http://localhost:3000/api/auctions \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "1",
    "storeId": "1",
    "title": "iPhone 15 Pro - Enchère",
    "startPrice": 5000,
    "minIncrement": 100,
    "endAt": "2025-10-15T20:00:00Z"
  }'
```

### Place Bid
```bash
curl -X POST http://localhost:3000/api/auctions/1/bids \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5100
  }'
```

### Search Products
```bash
curl "http://localhost:3000/api/search?q=iphone&type=products&limit=10"
```

### Add to Watchlist
```bash
curl -X POST http://localhost:3000/api/watchlist \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -H "x-client-id: 1" \
  -d '{"productId": "1"}'
```

### Submit Review
```bash
curl -X POST http://localhost:3000/api/products/1/reviews \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -H "x-client-id: 1" \
  -d '{
    "rating": 5,
    "body": "Excellent product!",
    "photos": ["https://example.com/photo.jpg"]
  }'
```

### Report Abuse
```bash
curl -X POST http://localhost:3000/api/abuse-reports \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "targetType": "Product",
    "targetId": "5",
    "reason": "Counterfeit product",
    "details": "This appears to be fake"
  }'
```

### Get Vendor Dashboard Stats
```bash
curl "http://localhost:3000/api/vendors/dashboard?storeId=1" \
  -H "x-user-id: 1" \
  -H "x-vendor-id: 1" \
  -H "x-user-role: VENDOR"
```

### Get Platform Statistics (Admin)
```bash
curl http://localhost:3000/api/admin/stats \
  -H "x-user-id: 1" \
  -H "x-user-role: ADMIN"
```


---

## 🎉 Latest Updates

### Schema Enhancements (Just Added)

The Prisma schema has been updated with the following new tables:

- ✅ **Address** - User delivery addresses
- ✅ **Cart & CartItem** - Shopping cart system
- ✅ **VerificationCode** - Email/phone verification
- ✅ **PasswordResetToken** - Password reset flow
- ✅ **AutoBid** - Automatic bidding system
- ✅ **Question** - Product Q&A
- ✅ **Return & Dispute** - Returns and dispute management
- ✅ **Category, Attribute, Brand** - Catalog management
- ✅ **KYCDocument** - Vendor verification documents

### New Services Added

- ✅ **categories.ts** - Category and attribute management
- ✅ **questions.ts** - Product Q&A system
- ✅ **returns.ts** - Return request handling
- ✅ **disputes.ts** - Dispute resolution
- ✅ Updated **auth.ts** - Real email verification and password reset
- ✅ Updated **addresses.ts** - Full CRUD with database
- ✅ Updated **cart.ts** - Complete cart implementation
- ✅ Updated **auctions.ts** - Auto-bid with database
- ✅ Updated **vendors.ts** - KYC document management

### Next Steps

1. **Run Migration**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

2. **Test New Features**:
   - Cart system is now fully functional
   - Address management works with database
   - Email verification codes are stored
   - Auto-bidding is implemented

3. **Remaining Integrations**:
   - Email sending (Resend)
   - Real-time updates (Pusher)
   - File uploads (UploadThing)
   - Payment processing

---

## 📚 Documentation

- **[API Testing Guide](./API_TESTING_GUIDE.md)** - Complete testing examples for all endpoints
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Detailed overview of all implemented features

---

## 📊 Current Status

**Backend Completion**: ~98%

### ✅ Fully Implemented
- User authentication & authorization
- Vendor onboarding & application
- Store management
- Product catalog with full CRUD
- Auction system with auto-bidding
- Shopping cart & checkout
- Order management & fulfillment
- Reviews & ratings system
- Watchlist
- Notifications system
- Messaging
- Search & filters
- Saved searches
- Abuse reporting system
- Audit logs (vendor activity tracking)
- Vendor dashboard with statistics
- Banners/CMS management
- Admin moderation tools (vendors, products, auctions, reviews, users, stores)
- Platform statistics

### 🔄 Needs Integration
- Email service (Resend)
- Real-time (Pusher)
- File uploads (UploadThing)
- Payment gateway

### 📝 Optional Enhancements
- Analytics dashboard
- CMS/Banner management
- Advanced reporting
- Multi-language UI
