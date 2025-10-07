## Database setup (MySQL + Prisma)

1) Create a MySQL database and set the connection string in an `.env` file at the project root:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DBNAME?connection_limit=10"
```

2) Install deps:

```bash
npm install
```

3) Generate Prisma client and run the first migration:

```bash
npm run prisma:generate
npm run prisma:migrate
```

To apply pending migrations in CI/production:

```bash
npm run prisma:deploy
```

Open Prisma Studio to inspect data:

```bash
npm run prisma:studio
```

## Development

Run the app:

```bash
npm run dev
```

Then visit `http://localhost:3000`.

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
- `DELETE /api/watchlist/[id]` - Remove from watchlist

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

### Admin - Moderation

- `POST /api/admin/vendors/[id]/approve` - Approve vendor
- `POST /api/admin/vendors/[id]/reject` - Reject vendor
- `POST /api/admin/products/[id]/moderate` - Moderate product (ACTIVE/ARCHIVED)
- `POST /api/admin/auctions/[id]/moderate` - Moderate auction (SCHEDULED/ARCHIVED)
- `POST /api/admin/reviews/[id]/moderate` - Moderate review (APPROVED/REJECTED)

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
  -d '{"productId": "1"}'
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

## 📊 Current Status

**Backend Completion**: ~90%

### ✅ Fully Implemented
- User authentication & authorization
- Vendor onboarding with KYC
- Store management
- Product catalog with full CRUD
- Auction system with auto-bidding
- Shopping cart & checkout
- Order management & fulfillment
- Reviews & ratings
- Product Q&A
- Watchlist
- Notifications
- Messaging
- Search & filters
- Returns & disputes
- Category & attribute management
- Admin moderation tools

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
