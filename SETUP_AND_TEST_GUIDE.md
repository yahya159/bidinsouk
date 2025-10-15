# 🚀 Bidinsouk - Complete Setup & Testing Guide

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js 18+** installed
- **XAMPP** with the **MySQL** module running
- **npm** or **yarn** package manager

---

## 🛠️ Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

> **Note**: The `--legacy-peer-deps` flag is needed because the project uses React 19, but some dependencies (like `recharts`) haven't officially updated their peer dependencies yet. This is safe and won't affect functionality.

### 2. Setup Database (XAMPP)

1. Start the **MySQL** service from the XAMPP Control Panel.
2. Open [http://localhost/phpmyadmin](http://localhost/phpmyadmin) and create the database:
```sql
CREATE DATABASE bidinsouk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Connection
DATABASE_URL="mysql://root:@127.0.0.1:3306/bidinsouk?connection_limit=10"

# Authentication (REQUIRED)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="bidinsouk-secret-key-change-in-production"

# Real-time Bidding (Get from https://pusher.com)
NEXT_PUBLIC_PUSHER_KEY="your_pusher_key_here"
PUSHER_SECRET="your_pusher_secret_here"
PUSHER_APP_ID="your_pusher_app_id_here"
PUSHER_CLUSTER="eu"

# Email/File integrations are currently disabled; no provider keys required
```

> **Note**: XAMPP ships with a `root` user and no password by default—update the `DATABASE_URL` if you changed the credentials. Pusher is needed for real-time bidding; you can skip it initially at the cost of real-time updates.

### 4. Generate Prisma Client & Run Migrations

```bash
# Generate TypeScript types for database
npx prisma generate

# Apply database migrations
npx prisma migrate deploy
```

### 5. Seed Test Data (Optional but Recommended)

```bash
# Basic seed
npx prisma db seed

# OR run the complete seed with products and auctions
npx tsx scripts/seed-products-auctions.ts
```

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000** 🎉

---

## 👥 Test Accounts

### Creating Test Accounts

Since the seed files don't include proper hashed passwords, you'll need to create accounts manually through the registration flow:

#### 1️⃣ **Register Users via UI**

Go to http://localhost:3000/register and create accounts:

**Admin Account:**
- Email: `admin@test.com`
- Name: `Admin User`
- Password: `Admin123!`
- Role: `CLIENT` (initially - we'll upgrade it)

**Vendor Account:**
- Email: `vendor@test.com`
- Name: `Vendor User`
- Password: `Vendor123!`
- Role: `VENDOR` (you'll apply to become vendor after registration)

**Client Account:**
- Email: `client@test.com`
- Name: `Client User`
- Password: `Client123!`
- Role: `CLIENT`

#### 2️⃣ **Upgrade Admin Account**

After registering the admin account, upgrade it using Prisma Studio:

```bash
npx prisma studio
```

1. Open **http://localhost:5555** in your browser
2. Navigate to **User** table
3. Find the user with email `admin@test.com`
4. Change the `role` field from `CLIENT` to `ADMIN`
5. Save the changes

#### 3️⃣ **Alternative: SQL Command to Create Admin**

If you prefer SQL, run this command after registering:

```sql
UPDATE User SET role = 'ADMIN' WHERE email = 'admin@test.com';
```

Connect to MySQL:
```bash
mysql -u root -p
USE bidinsouk;
UPDATE User SET role = 'ADMIN' WHERE email = 'admin@test.com';
```

---

## 🧪 Testing the Platform

### Test Flow 1: Complete Vendor Journey

#### Step 1: Apply as Vendor
1. Register a new account at `/register`
2. Login with your credentials
3. Navigate to `/become-vendor` or click "Become a Vendor" in the UI
4. Fill out the vendor application form:
   - Business Name: `My Test Store`
   - Business Type: `Individual` or `Company`
   - Tax ID: `123456789`
   - Description: `Test vendor for marketplace`
5. Submit the application
6. Status will be **PENDING**

#### Step 2: Approve Vendor (as Admin)
1. Login as admin account
2. Go to `/admin-dashboard/vendors` or `/admin-dashboard`
3. Navigate to "Vendors" → "Pending Applications"
4. Find your vendor application
5. Click "Approve" button
6. Vendor status changes to **APPROVED**

#### Step 3: Create Store (as Vendor)
1. Logout and login as the approved vendor
2. Navigate to `/workspace/dashboard` (Vendor Dashboard)
3. Click "Create Store" or go to store management
4. Fill out store form:
   - Store Name: `Tech Store`
   - Slug: `tech-store` (will be in URL)
   - Email: `store@test.com`
   - Phone: `+212600000000`
   - Address: `123 Main St, Casablanca`
   - Description: `Electronics and gadgets`
5. Submit the store
6. Store status will be **PENDING**

#### Step 4: Approve Store (as Admin)
1. Login as admin
2. Go to `/admin-dashboard/stores`
3. Find pending stores
4. Approve the store
5. Store status becomes **ACTIVE** ✅

#### Step 5: Create Products (as Vendor)
1. Login as vendor
2. Go to `/workspace/dashboard` or product management
3. Click "Add Product"
4. Fill out product details:
   - Title: `iPhone 15 Pro Max`
   - Category: `Electronics`
   - Price: `15999.00`
   - Condition: `NEW`
   - Description: `Brand new iPhone 15 Pro Max`
   - Status: `ACTIVE`
5. Save the product

#### Step 6: Create Auction (as Vendor)
1. From vendor dashboard, click "Create Auction"
2. Select the product you created
3. Fill auction details:
   - Title: `iPhone 15 Pro Max Auction`
   - Start Price: `12000.00`
   - Reserve Price: `14000.00`
   - Min Increment: `100.00`
   - Start Date: Now or future date
   - End Date: 7 days from now
4. Create the auction
5. Auction status: **RUNNING** or **SCHEDULED**

---

### Test Flow 2: Client Bidding Journey

#### Step 1: Browse Auctions
1. Login as client account
2. Go to `/auctions` or click "Auctions" in navigation
3. Browse available auctions
4. Click on an auction to view details

#### Step 2: Place Bids
1. On auction detail page, view current bid
2. Enter your bid amount (must be at least current bid + minimum increment)
3. Click "Place Bid"
4. Your bid is recorded
5. If real-time is enabled (Pusher configured), you'll see updates instantly

#### Step 3: Watch Auctions
1. Click "Add to Watchlist" on any auction
2. View your watchlist at `/watchlist`
3. Get notified when you're outbid (if notifications are enabled)

#### Step 4: Win Auction & Order
1. When auction ends and you have the highest bid
2. Auction status changes to **ENDED**
3. Winner can proceed to checkout
4. Navigate to `/orders` to see your orders

---

### Test Flow 3: Admin Dashboard

Login as admin and explore:

#### Key Admin Pages:
- **Dashboard**: `/admin-dashboard`
  - Overview statistics
  - Recent activities
  - Platform metrics

- **Users Management**: `/admin-dashboard/users`
  - View all users
  - Edit user roles
  - Suspend/activate users

- **Vendors**: `/admin-dashboard/vendors`
  - Pending applications
  - Active vendors
  - Approve/reject vendors

- **Stores**: `/admin-dashboard/stores`
  - Pending stores
  - Active stores
  - Approve/reject stores

- **Products**: `/admin-dashboard/products`
  - All products
  - Moderate content
  - Manage listings

- **Auctions**: `/admin-dashboard/auctions`
  - Active auctions
  - Ended auctions
  - Auction analytics

- **Orders**: `/admin-dashboard/orders`
  - All platform orders
  - Order status management

- **Reports**: `/admin-dashboard/abuse-reports`
  - Handle abuse reports
  - Content moderation

---

## 🌐 Important URLs

### Public Pages
- Homepage: `http://localhost:3000`
- Browse Products: `http://localhost:3000/products`
- Browse Auctions: `http://localhost:3000/auctions`
- Search: `http://localhost:3000/search`

### Authentication
- Register: `http://localhost:3000/register`
- Login: `http://localhost:3000/login`

### Client Pages (Authenticated)
- Profile: `http://localhost:3000/profile`
- Orders: `http://localhost:3000/orders`
- Watchlist: `http://localhost:3000/watchlist`
- Messages: `http://localhost:3000/messages`
- Cart: `http://localhost:3000/cart`

### Vendor Dashboard (Vendor Role)
- Dashboard: `http://localhost:3000/workspace/dashboard`
- Analytics: `http://localhost:3000/workspace/analytics`
- Products: `http://localhost:3000/workspace/products`
- Orders: `http://localhost:3000/workspace/orders`
- Clients: `http://localhost:3000/workspace/clients`
- Reviews: `http://localhost:3000/workspace/reviews`

### Admin Dashboard (Admin Role)
- Main Dashboard: `http://localhost:3000/admin-dashboard`
- Users: `http://localhost:3000/admin-dashboard/users`
- Vendors: `http://localhost:3000/admin-dashboard/vendors`
- Stores: `http://localhost:3000/admin-dashboard/stores`
- Products: `http://localhost:3000/admin-dashboard/products`
- Auctions: `http://localhost:3000/admin-dashboard/auctions`
- Orders: `http://localhost:3000/admin-dashboard/orders`
- Reports: `http://localhost:3000/admin-dashboard/abuse-reports`

---

## 🛠️ Useful Commands

```bash
# Development
npm run dev                  # Start development server
npm run build                # Build for production
npm start                    # Start production server

# Database Management
npx prisma studio            # Open database GUI (http://localhost:5555)
npx prisma generate          # Generate Prisma Client types
npx prisma migrate dev       # Create and apply migration
npx prisma migrate deploy    # Apply migrations (production)
npx prisma db seed           # Seed database with test data

# Testing & Health Checks
npm run health-check         # Check system health
npm run type-check           # Check TypeScript errors

# Seeding
npm run seed                 # Run seed scripts
npx tsx scripts/seed-products-auctions.ts  # Seed products & auctions
```

---

## 🔧 Troubleshooting

### Issue: Database Connection Error
**Error**: `Can't reach database server at localhost:3306`

**Solutions**:
1. Ensure MySQL is running:
   ```bash
   # Check if MySQL is running
   netstat -an | findstr "3306"
   ```
2. Restart the MySQL service from the XAMPP Control Panel if the port check fails.
3. Verify credentials in `.env.local`

### Issue: "NEXTAUTH_SECRET is not set"
**Solution**: Add to `.env.local`:
```env
NEXTAUTH_SECRET="any-random-secret-key-here"
```

Generate a secure secret:
```bash
# Windows PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))

# Linux/Mac
openssl rand -base64 32
```

### Issue: Real-time Bidding Not Working
**Cause**: Pusher credentials not configured

**Solution**:
1. Sign up at https://pusher.com (free tier available)
2. Create a new app
3. Copy credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_PUSHER_KEY="your_key"
   PUSHER_SECRET="your_secret"
   PUSHER_APP_ID="your_app_id"
   PUSHER_CLUSTER="eu"
   ```
4. Restart the dev server

### Issue: Prisma Client Not Generated
**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npx prisma generate
```

### Issue: Migrations Not Applied
**Error**: Database schema is out of sync

**Solution**:
```bash
# Apply all migrations
npx prisma migrate deploy

# Or reset database (CAUTION: Deletes all data)
npx prisma migrate reset
```

---

## 📚 Additional Resources

### Documentation
- **Architecture**: Check `/docs` folder for detailed architecture docs
- **API Reference**: See inline documentation in `/app/api` routes
- **Coding Standards**: Read `.cursorrules` file
- **Changelog**: See `CHANGELOG.md` for recent changes

### Quick References
- [Quick Start Guide](./QUICK_START_GUIDE.md)
- [Start Here](./START_HERE.md)
- [Auction System Architecture](./docs/AUCTION_SYSTEM_ARCHITECTURE.md)
- [Real-time Bidding Architecture](./docs/REALTIME_BIDDING_ARCHITECTURE.md)
- [Vendor Approval System](./docs/VENDOR_APPROVAL_SYSTEM.md)

---

## 🎯 Testing Checklist

Use this checklist to ensure everything works:

### Basic Setup
- [ ] Dependencies installed (`npm install`)
- [ ] Database running (MySQL via XAMPP)
- [ ] Environment variables configured (`.env.local`)
- [ ] Migrations applied (`npx prisma migrate deploy`)
- [ ] Prisma Client generated (`npx prisma generate`)
- [ ] Dev server running (`npm run dev`)

### User Management
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Can view profile
- [ ] Can upgrade user to admin (via Prisma Studio)

### Vendor Flow
- [ ] Can apply to become vendor
- [ ] Admin can see pending vendors
- [ ] Admin can approve vendor
- [ ] Vendor can create store
- [ ] Admin can approve store
- [ ] Vendor can create products
- [ ] Vendor can create auctions

### Client Flow
- [ ] Can browse products
- [ ] Can browse auctions
- [ ] Can place bids
- [ ] Can add to watchlist
- [ ] Can view orders

### Admin Dashboard
- [ ] Can access admin dashboard
- [ ] Can view platform statistics
- [ ] Can manage users
- [ ] Can approve vendors/stores
- [ ] Can view all orders

### Optional Features
- [ ] Real-time bidding works (requires Pusher)
- [ ] Email notifications work (requires Resend)
- [ ] File uploads work (requires UploadThing)

---

## 🎉 Success!

If you've completed the setup successfully, you should now have:
- ✅ A fully functional multi-vendor marketplace
- ✅ Test accounts for Admin, Vendor, and Client roles
- ✅ Sample products and auctions (if seeded)
- ✅ Real-time bidding capability (if Pusher configured)
- ✅ Complete admin dashboard with all features

**Now you can start testing and developing!** 🚀

---

## 🆘 Need More Help?

- Check the comprehensive documentation in `/docs` folder
- Review the audit reports: `FINAL_AUDIT_REPORT.md`, `FIXES_SUMMARY.md`
- Read the coding standards: `.cursorrules`
- Use Prisma Studio to inspect the database: `npx prisma studio`

**Happy Testing!** 🎊

