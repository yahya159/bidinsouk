# Authentication Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Login Page   │    │ Register Page│    │ AuthStatus   │      │
│  │ /login       │    │ /register    │    │ Component    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                    │              │
│         └───────────────────┴────────────────────┘              │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │ SessionProvider │                          │
│                    │ (providers.tsx) │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   NextAuth.js     │
                    │   (JWT Strategy)  │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────┼────────────────────────────────────┐
│                         BACKEND                                   │
├─────────────────────────────┼────────────────────────────────────┤
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────┐         │
│  │         API Routes (app/api/...)                     │         │
│  ├──────────────────────────────────────────────────────┤         │
│  │                                                       │         │
│  │  /auth/[...nextauth]  ← NextAuth handlers           │         │
│  │  /auth/register       ← User registration            │         │
│  │  /notifications       ← Protected route              │         │
│  │  /watchlist           ← Protected route              │         │
│  │  /cart                ← Protected route              │         │
│  │                                                       │         │
│  └───────────────────────┬───────────────────────────────┘        │
│                          │                                        │
│  ┌───────────────────────▼───────────────────────────┐           │
│  │      Authentication Helpers                        │           │
│  ├────────────────────────────────────────────────────┤           │
│  │                                                     │           │
│  │  requireAuth()    ← Require authentication         │           │
│  │  requireRole()    ← Require specific role          │           │
│  │  getClientId()    ← Get client ID                  │           │
│  │  getVendorId()    ← Get vendor ID                  │           │
│  │                                                     │           │
│  └───────────────────────┬─────────────────────────────┘          │
│                          │                                        │
│  ┌───────────────────────▼─────────────────────────────┐         │
│  │              Middleware                              │         │
│  ├──────────────────────────────────────────────────────┤         │
│  │                                                       │         │
│  │  /admin/*  → Require ADMIN role                     │         │
│  │  /vendor/* → Require VENDOR or ADMIN role           │         │
│  │                                                       │         │
│  └───────────────────────┬─────────────────────────────┘         │
│                          │                                        │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                ┌──────────▼──────────┐
                │   Database (MySQL)  │
                ├─────────────────────┤
                │                     │
                │  User               │
                │  ├─ id              │
                │  ├─ email           │
                │  ├─ password (hash) │
                │  ├─ role            │
                │  ├─ Client          │
                │  └─ Vendor          │
                │                     │
                └─────────────────────┘
```

## Authentication Flow

### 1. Registration Flow

```
┌──────┐                ┌──────────┐              ┌──────────┐
│ User │                │ Frontend │              │ Backend  │
└──┬───┘                └────┬─────┘              └────┬─────┘
   │                         │                         │
   │ Fill registration form  │                         │
   ├────────────────────────>│                         │
   │                         │                         │
   │                         │ POST /api/auth/register │
   │                         ├────────────────────────>│
   │                         │                         │
   │                         │                         │ Hash password
   │                         │                         │ with bcrypt
   │                         │                         ├──────────┐
   │                         │                         │          │
   │                         │                         │<─────────┘
   │                         │                         │
   │                         │                         │ Create user
   │                         │                         │ in database
   │                         │                         ├──────────┐
   │                         │                         │          │
   │                         │                         │<─────────┘
   │                         │                         │
   │                         │    Success response     │
   │                         │<────────────────────────┤
   │                         │                         │
   │  Redirect to /login     │                         │
   │<────────────────────────┤                         │
   │                         │                         │
```

### 2. Login Flow

```
┌──────┐          ┌──────────┐          ┌──────────┐          ┌──────────┐
│ User │          │ Frontend │          │ NextAuth │          │ Database │
└──┬───┘          └────┬─────┘          └────┬─────┘          └────┬─────┘
   │                   │                     │                     │
   │ Enter credentials │                     │                     │
   ├──────────────────>│                     │                     │
   │                   │                     │                     │
   │                   │ signIn('credentials')                     │
   │                   ├────────────────────>│                     │
   │                   │                     │                     │
   │                   │                     │ Find user by email  │
   │                   │                     ├────────────────────>│
   │                   │                     │                     │
   │                   │                     │    User data        │
   │                   │                     │<────────────────────┤
   │                   │                     │                     │
   │                   │                     │ Compare password    │
   │                   │                     │ with bcrypt         │
   │                   │                     ├──────────┐          │
   │                   │                     │          │          │
   │                   │                     │<─────────┘          │
   │                   │                     │                     │
   │                   │                     │ Create JWT token    │
   │                   │                     ├──────────┐          │
   │                   │                     │          │          │
   │                   │                     │<─────────┘          │
   │                   │                     │                     │
   │                   │  Set cookie & session                     │
   │                   │<────────────────────┤                     │
   │                   │                     │                     │
   │  Redirect to home │                     │                     │
   │<──────────────────┤                     │                     │
   │                   │                     │                     │
```

### 3. Protected API Request Flow

```
┌──────┐          ┌──────────┐          ┌──────────┐          ┌──────────┐
│ User │          │ Frontend │          │ API Route│          │ Database │
└──┬───┘          └────┬─────┘          └────┬─────┘          └────┬─────┘
   │                   │                     │                     │
   │ Request data      │                     │                     │
   ├──────────────────>│                     │                     │
   │                   │                     │                     │
   │                   │ GET /api/notifications                    │
   │                   │ (with JWT cookie)   │                     │
   │                   ├────────────────────>│                     │
   │                   │                     │                     │
   │                   │                     │ requireAuth()       │
   │                   │                     │ Extract JWT         │
   │                   │                     ├──────────┐          │
   │                   │                     │          │          │
   │                   │                     │<─────────┘          │
   │                   │                     │                     │
   │                   │                     │ Validate token      │
   │                   │                     ├──────────┐          │
   │                   │                     │          │          │
   │                   │                     │<─────────┘          │
   │                   │                     │                     │
   │                   │                     │ Get user data       │
   │                   │                     ├────────────────────>│
   │                   │                     │                     │
   │                   │                     │    User data        │
   │                   │                     │<────────────────────┤
   │                   │                     │                     │
   │                   │                     │ Process request     │
   │                   │                     ├──────────┐          │
   │                   │                     │          │          │
   │                   │                     │<─────────┘          │
   │                   │                     │                     │
   │                   │    Response data    │                     │
   │                   │<────────────────────┤                     │
   │                   │                     │                     │
   │  Display data     │                     │                     │
   │<──────────────────┤                     │                     │
   │                   │                     │                     │
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Password Security                                  │
│  ├─ bcrypt hashing (10 rounds)                              │
│  ├─ Salt automatically generated                             │
│  └─ Never stored or transmitted in plain text                │
│                                                               │
│  Layer 2: Token Security                                     │
│  ├─ JWT tokens with secret key                              │
│  ├─ HTTP-only cookies (XSS protection)                       │
│  ├─ Secure flag in production (HTTPS only)                   │
│  └─ Token expiration                                         │
│                                                               │
│  Layer 3: Route Protection                                   │
│  ├─ Middleware for page routes                              │
│  ├─ requireAuth() for API routes                            │
│  └─ Role-based access control                               │
│                                                               │
│  Layer 4: Input Validation                                   │
│  ├─ Zod schemas                                              │
│  ├─ Email format validation                                  │
│  ├─ Password strength requirements                           │
│  └─ SQL injection protection (Prisma)                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Role-Based Access Control

```
┌──────────────────────────────────────────────────────────────┐
│                         User Roles                            │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  CLIENT                                                        │
│  ├─ Browse products                                           │
│  ├─ Place bids                                                │
│  ├─ Add to cart                                               │
│  ├─ Create orders                                             │
│  ├─ Submit reviews                                            │
│  └─ Manage watchlist                                          │
│                                                                │
│  VENDOR                                                        │
│  ├─ All CLIENT permissions                                    │
│  ├─ Create stores                                             │
│  ├─ List products                                             │
│  ├─ Create auctions                                           │
│  ├─ Manage orders                                             │
│  ├─ View dashboard                                            │
│  └─ Access /vendor/* routes                                   │
│                                                                │
│  ADMIN                                                         │
│  ├─ All VENDOR permissions                                    │
│  ├─ Approve vendors                                           │
│  ├─ Moderate content                                          │
│  ├─ Manage users                                              │
│  ├─ View platform stats                                       │
│  ├─ Access /admin/* routes                                    │
│  └─ Full system access                                        │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## File Structure

```
bidinsouk/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          ← Login page
│   │   └── register/
│   │       └── page.tsx          ← Registration page
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts      ← NextAuth handlers
│   │   │   └── register/
│   │   │       └── route.ts      ← Registration endpoint
│   │   ├── notifications/
│   │   │   └── route.ts          ← Protected API route
│   │   └── watchlist/
│   │       └── route.ts          ← Protected API route
│   ├── layout.tsx                ← Root layout with SessionProvider
│   └── providers.tsx             ← SessionProvider wrapper
│
├── components/
│   └── shared/
│       └── AuthStatus.tsx        ← Auth status component
│
├── lib/
│   └── auth/
│       ├── api-auth.ts           ← API authentication helpers
│       ├── config.ts             ← NextAuth configuration
│       ├── middleware.ts         ← Middleware protection logic
│       └── session.ts            ← Server component helpers
│
├── types/
│   └── next-auth.d.ts            ← TypeScript type definitions
│
├── middleware.ts                 ← Route protection middleware
│
└── .env                          ← Environment variables
    ├── NEXTAUTH_URL
    └── NEXTAUTH_SECRET
```

## Key Components

### NextAuth Configuration
- **Provider**: Credentials (email/password)
- **Strategy**: JWT (stateless)
- **Callbacks**: jwt, session
- **Pages**: Custom login page

### Authentication Helpers
- **requireAuth()**: Validates JWT and returns user
- **requireRole()**: Validates JWT and checks role
- **getClientId()**: Gets client ID for authenticated user
- **getVendorId()**: Gets vendor ID for authenticated user

### Middleware
- **Intercepts**: /admin/*, /vendor/*
- **Validates**: JWT token and role
- **Action**: Allow or redirect to /login

## Best Practices

✅ **Always use requireAuth()** in protected API routes
✅ **Never store passwords** in plain text
✅ **Use HTTPS** in production
✅ **Rotate NEXTAUTH_SECRET** regularly
✅ **Implement rate limiting** for login attempts
✅ **Log authentication events** for security auditing
✅ **Use strong password requirements**
✅ **Implement session timeout**
✅ **Add CSRF protection** (built into NextAuth)
✅ **Validate all user input**
