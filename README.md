# Bidinsouk - Multi-Vendor Marketplace Platform

A modern multi-vendor marketplace platform built with Next.js, featuring auctions, real-time bidding, messaging, and comprehensive vendor management.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```
> **Note**: Use `--legacy-peer-deps` due to React 19 compatibility with some chart dependencies.

### 2. Configure Database (XAMPP MySQL)

1. Launch **XAMPP Control Panel** and start the **MySQL** service.
2. Open [http://localhost/phpmyadmin](http://localhost/phpmyadmin) (or use `mysql` CLI) and create the database:
   ```sql
   CREATE DATABASE bidinsouk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Create `.env.local` file with your local credentials:
```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/bidinsouk?connection_limit=10"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL=http://localhost:3000
```
> **Tip**: XAMPP ships with user `root` and an empty password by default. Update the connection string if you secured MySQL differently.

### 3. Generate Prisma Client
```bash
npx prisma generate
```
⚠️ **This step is required** - it generates TypeScript types for database access.

### 4. Run Migrations
```bash
npx prisma migrate deploy
```

### 5. (Optional) Seed Database
```bash
npx prisma db seed
```

### 6. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 📖 Project Structure

```
bidinsouk/
├── app/              # Next.js 15 app directory
│   ├── api/         # API routes
│   ├── (auth)/      # Authentication pages
│   ├── (pages)/     # Public pages
│   ├── (vendor)/    # Vendor dashboard
│   └── (admin)/     # Admin dashboard
├── components/       # React components
├── lib/             # Core libraries and utilities
│   ├── auth/        # Authentication logic
│   ├── services/    # Business logic services
│   └── validations/ # Zod validation schemas
├── prisma/          # Database schema and migrations
├── docs/            # Documentation
├── scripts/         # Utility scripts
└── public/          # Static assets
```

---

## 🔐 Authentication

This application uses **NextAuth.js v4** with credentials-based authentication.

### Default Roles
- **CLIENT** - Can browse and purchase products
- **VENDOR** - Can sell products and manage stores
- **ADMIN** - Platform administration

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

---

## 🛠️ Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open database GUI
npm run prisma:seed      # Seed database

# Testing
npm test                 # Run tests
```

---

## 🌟 Core Features

### For Buyers (Clients)
- Browse products and auctions
- Real-time bidding with auto-bid support
- Shopping cart and checkout
- Order tracking and management
- Messaging with vendors
- Watchlist and saved searches
- Product reviews and ratings

### For Sellers (Vendors)
- Multi-store management
- Product listing and inventory
- Auction creation and management
- Order fulfillment tracking
- Analytics dashboard
- Customer messaging
- KYC verification

### For Administrators
- User and vendor approval
- Content moderation
- Platform analytics
- Abuse report management
- System configuration
- Audit logs

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

### Architecture & System Design
- [Auction System Architecture](./docs/AUCTION_SYSTEM_ARCHITECTURE.md)
- [Authentication Architecture](./docs/AUTHENTICATION_ARCHITECTURE.md)
- [Real-time Bidding Architecture](./docs/REALTIME_BIDDING_ARCHITECTURE.md)
- [Message-to-Order System](./docs/MESSAGE_TO_ORDER_COMPLETE_ARCHITECTURE.md)
- [Vendor Approval System](./docs/VENDOR_APPROVAL_SYSTEM.md)

### Quick References
- [Real-time Bidding Quick Reference](./docs/REALTIME_BIDDING_QUICK_REFERENCE.md)
- [Vendor Approval Quick Start](./docs/VENDOR_APPROVAL_QUICK_START.md)

### Implementation Details
- [Real-time Bidding Setup](./docs/REALTIME_BIDDING_SETUP.md)
- [Vendor Approval Implementation](./docs/VENDOR_APPROVAL_IMPLEMENTATION.md)
- [Business Logic Enforcement](./docs/BUSINESS_LOGIC_ENFORCEMENT.md)

---

## 🔌 API Overview

### Authentication & Users
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email with OTP
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update profile

### Products & Auctions
- `GET /api/products` - List products
- `POST /api/products` - Create product (vendor)
- `GET /api/auctions` - List auctions
- `POST /api/auctions` - Create auction (vendor)
- `POST /api/auctions/[id]/bids` - Place bid

### Commerce
- `GET /api/cart` - Get cart
- `POST /api/cart` - Add to cart
- `POST /api/checkout` - Create order
- `GET /api/orders` - List orders

### Vendor Management
- `POST /api/vendors/apply` - Apply to become vendor
- `GET /api/vendors/dashboard` - Get vendor stats
- `GET /api/vendors/orders` - List vendor orders

### Admin
- `GET /api/admin/vendors/pending` - List pending vendors
- `POST /api/admin/vendors/[id]/approve` - Approve vendor
- `GET /api/admin/stats` - Platform statistics

For complete API documentation, see the inline documentation in each route handler.

---

## 🏗️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Mantine UI, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** MySQL with Prisma ORM
- **Authentication:** NextAuth.js v4
- **Real-time:** Pusher (for bidding and messaging)
- **Validation:** Zod
- **Internationalization:** next-intl

---

## 🌐 Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="mysql://user:pass@host:port/dbname"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Real-time (Pusher)
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_APP_ID="your-app-id"
PUSHER_CLUSTER="your-cluster"

# Email/File integrations are currently disabled in this build
```

---

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Deploy

### Manual
```bash
npm run build
npm start
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

[Your License Here]

---

## 🆘 Support

For issues and questions:
- Check the documentation in `/docs`
- Review the API route handlers for inline documentation
- Check existing GitHub issues

---

**Built with ❤️ using Next.js**
