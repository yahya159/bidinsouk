# Vendor Approval System - Security Implementation

## 1. SECURITY ENFORCEMENT STRATEGY

### Multi-Layer Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Frontend Guards                               │
│  - Route protection                                     │
│  - Component-level access control                       │
│  - UI state management                                  │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  Layer 2: Middleware                                    │
│  - Session validation                                   │
│  - Role verification                                    │
│  - Vendor status checks                                 │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  Layer 3: API Route Guards                              │
│  - Authentication required                              │
│  - Vendor role validation                               │
│  - Store status verification                            │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  Layer 4: Database Constraints                          │
│  - Foreign key constraints                              │
│  - Unique constraints                                   │
│  - Check constraints                                    │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  Layer 5: Audit Logging                                 │
│  - All actions logged                                   │
│  - Immutable audit trail                                │
│  - Compliance reporting                                 │
└─────────────────────────────────────────────────────────┘
```


## 2. MIDDLEWARE PROTECTION

### Complete Middleware Implementation

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rateLimit } from '@/lib/rate-limit';

// Rate limiter for vendor applications
const applicationLimiter = rateLimit({
  interval: 24 * 60 * 60 * 1000, // 24 hours
  uniqueTokenPerInterval: 500
});

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;
  
  // Public routes
  if (path === '/become-vendor' && request.method === 'GET') {
    return NextResponse.next();
  }
  
  // Vendor application submission
  if (path === '/api/vendor/apply' && request.method === 'POST') {
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Rate limiting
    try {
      await applicationLimiter.check(request, 3, token.sub); // 3 attempts per day
    } catch {
      return NextResponse.json(
        { error: 'Too many application attempts. Please try again tomorrow.' },
        { status: 429 }
      );
    }
    
    return NextResponse.next();
  }
  
  // Protected vendor routes
  if (path.startsWith('/vendor')) {
    // Authentication check
    if (!token) {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
    
    // Role check
    if (!token.roles?.includes('VENDOR')) {
      return NextResponse.redirect(new URL('/become-vendor', request.url));
    }
    
    // Vendor status check (cached in token)
    const vendorStatus = token.vendorStatus as string;
    
    if (vendorStatus === 'PENDING' && !path.startsWith('/vendor/pending')) {
      return NextResponse.redirect(new URL('/vendor/pending', request.url));
    }
    
    if (vendorStatus === 'REJECTED' && !path.startsWith('/vendor/rejected')) {
      return NextResponse.redirect(new URL('/vendor/rejected', request.url));
    }
    
    if (vendorStatus === 'SUSPENDED') {
      const allowedPaths = [
        '/vendor/suspended',
        '/vendor/orders',
        '/vendor/appeal'
      ];
      
      if (!allowedPaths.some(p => path.startsWith(p))) {
        return NextResponse.redirect(new URL('/vendor/suspended', request.url));
      }
    }
    
    // Store requirement check for product routes
    if (path.startsWith('/vendor/products')) {
      if (!token.hasActiveStore) {
        return NextResponse.redirect(new URL('/vendor/create-store', request.url));
      }
    }
  }
  
  // Admin routes
  if (path.startsWith('/admin/vendors')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    
    if (!token.roles?.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/vendor/:path*',
    '/api/vendor/:path*',
    '/admin/vendors/:path*'
  ]
};
```


## 3. API VALIDATION

### Comprehensive API Guards

```typescript
// lib/auth/api-guards.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Vendor guard with full validation
export async function requireApprovedVendor() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
  }
  
  if (!session.user.roles?.includes('VENDOR')) {
    throw new ApiError('Vendor role required', 403, 'FORBIDDEN');
  }
  
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    include: {
      store: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          roles: true
        }
      }
    }
  });
  
  if (!vendor) {
    throw new ApiError('Vendor profile not found', 404, 'VENDOR_NOT_FOUND');
  }
  
  if (vendor.status === 'PENDING') {
    throw new ApiError(
      'Your vendor application is pending review',
      403,
      'VENDOR_PENDING'
    );
  }
  
  if (vendor.status === 'REJECTED') {
    const canReapply = vendor.rejectedAt && 
      Date.now() - vendor.rejectedAt.getTime() > 30 * 24 * 60 * 60 * 1000;
    
    throw new ApiError(
      canReapply 
        ? 'Your application was rejected. You can reapply now.'
        : 'Your application was rejected. Please wait before reapplying.',
      403,
      'VENDOR_REJECTED'
    );
  }
  
  if (vendor.status === 'SUSPENDED') {
    throw new ApiError(
      `Your vendor account is suspended: ${vendor.suspensionReason}`,
      403,
      'VENDOR_SUSPENDED'
    );
  }
  
  if (vendor.status !== 'APPROVED') {
    throw new ApiError(
      `Invalid vendor status: ${vendor.status}`,
      403,
      'INVALID_VENDOR_STATUS'
    );
  }
  
  return { session, vendor };
}

// Store guard
export async function requireActiveStore() {
  const { session, vendor } = await requireApprovedVendor();
  
  if (!vendor.store) {
    throw new ApiError(
      'Store not found. Please create a store first.',
      404,
      'STORE_NOT_FOUND'
    );
  }
  
  if (vendor.store.status === 'PENDING') {
    throw new ApiError(
      'Your store is pending approval',
      403,
      'STORE_PENDING'
    );
  }
  
  if (vendor.store.status === 'SUSPENDED') {
    throw new ApiError(
      'Your store is suspended',
      403,
      'STORE_SUSPENDED'
    );
  }
  
  if (vendor.store.status !== 'ACTIVE') {
    throw new ApiError(
      `Invalid store status: ${vendor.store.status}`,
      403,
      'INVALID_STORE_STATUS'
    );
  }
  
  return { session, vendor, store: vendor.store };
}

// Product creation validation
export async function validateProductCreation(data: any) {
  const { vendor, store } = await requireActiveStore();
  
  // Check product limit
  const productCount = await prisma.product.count({
    where: { vendorId: vendor.id }
  });
  
  const maxProducts = vendor.tier === 'PREMIUM' ? 1000 : 100;
  
  if (productCount >= maxProducts) {
    throw new ApiError(
      `Product limit reached (${maxProducts}). Upgrade your plan.`,
      403,
      'PRODUCT_LIMIT_REACHED'
    );
  }
  
  // Validate product data
  const productSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(20).max(5000),
    price: z.number().positive(),
    category: z.string(),
    images: z.array(z.string().url()).min(1).max(10)
  });
  
  const validated = productSchema.parse(data);
  
  return { vendor, store, productData: validated };
}
```


## 4. AUDIT LOGGING

### Comprehensive Audit System

```typescript
// lib/audit/audit-logger.ts
import { prisma } from '@/lib/prisma';

export enum AuditAction {
  // Vendor Actions
  VENDOR_APPLICATION_SUBMITTED = 'VENDOR_APPLICATION_SUBMITTED',
  VENDOR_APPROVED = 'VENDOR_APPROVED',
  VENDOR_REJECTED = 'VENDOR_REJECTED',
  VENDOR_SUSPENDED = 'VENDOR_SUSPENDED',
  VENDOR_REINSTATED = 'VENDOR_REINSTATED',
  VENDOR_REAPPLIED = 'VENDOR_REAPPLIED',
  
  // Store Actions
  STORE_CREATED = 'STORE_CREATED',
  STORE_APPROVED = 'STORE_APPROVED',
  STORE_REJECTED = 'STORE_REJECTED',
  STORE_SUSPENDED = 'STORE_SUSPENDED',
  
  // Product Actions
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_HIDDEN = 'PRODUCT_HIDDEN',
  PRODUCT_RESTORED = 'PRODUCT_RESTORED',
  
  // Bulk Actions
  VENDOR_BULK_APPROVE = 'VENDOR_BULK_APPROVE',
  VENDOR_BULK_REJECT = 'VENDOR_BULK_REJECT'
}

interface AuditLogData {
  action: AuditAction;
  performedBy: string;
  targetId?: string;
  targetType?: 'VENDOR' | 'STORE' | 'PRODUCT' | 'USER';
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData) {
  return await prisma.auditLog.create({
    data: {
      action: data.action,
      performedBy: data.performedBy,
      targetId: data.targetId,
      targetType: data.targetType,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: new Date()
    }
  });
}

// Query audit logs
export async function getAuditLogs(filters: {
  action?: AuditAction;
  performedBy?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  return await prisma.auditLog.findMany({
    where: {
      action: filters.action,
      performedBy: filters.performedBy,
      targetId: filters.targetId,
      timestamp: {
        gte: filters.startDate,
        lte: filters.endDate
      }
    },
    include: {
      performer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { timestamp: 'desc' },
    take: filters.limit || 100
  });
}
```


## 5. RATE LIMITING

### Application Rate Limiting

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000
  });

  return {
    check: (req: Request, limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        if (isRateLimited) {
          reject(new Error('Rate limit exceeded'));
        } else {
          resolve();
        }
      })
  };
}

// Usage in API routes
// app/api/vendor/apply/route.ts
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 24 * 60 * 60 * 1000, // 24 hours
  uniqueTokenPerInterval: 500
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Allow 3 application attempts per day
    await limiter.check(request, 3, session.user.id);
  } catch {
    return NextResponse.json(
      { error: 'Too many application attempts. Please try again tomorrow.' },
      { status: 429 }
    );
  }
  
  // Process application...
}
```

### Document Upload Rate Limiting

```typescript
// app/api/vendor/documents/upload/route.ts
const uploadLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Allow 10 uploads per hour
    await uploadLimiter.check(request, 10, session.user.id);
  } catch {
    return NextResponse.json(
      { error: 'Upload limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }
  
  // Process upload...
}
```


## 6. DATA ENCRYPTION

### Sensitive Data Protection

```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // Must be 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Usage for sensitive vendor data
export async function saveVendorBankDetails(
  vendorId: string,
  bankDetails: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
  }
) {
  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      bankAccountNumber: encrypt(bankDetails.accountNumber),
      bankRoutingNumber: encrypt(bankDetails.routingNumber),
      bankAccountHolderName: bankDetails.accountHolderName
    }
  });
}

export async function getVendorBankDetails(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      bankAccountNumber: true,
      bankRoutingNumber: true,
      bankAccountHolderName: true
    }
  });
  
  if (!vendor) return null;
  
  return {
    accountNumber: decrypt(vendor.bankAccountNumber),
    routingNumber: decrypt(vendor.bankRoutingNumber),
    accountHolderName: vendor.bankAccountHolderName
  };
}
```


## 7. SECURITY CHECKLIST

### Pre-Deployment Security Audit

- [ ] **Authentication**
  - [ ] All vendor routes require authentication
  - [ ] Session tokens are secure and httpOnly
  - [ ] JWT tokens have appropriate expiration
  - [ ] Refresh token rotation implemented

- [ ] **Authorization**
  - [ ] Role-based access control enforced
  - [ ] Vendor status checked on every request
  - [ ] Store status validated for product operations
  - [ ] Admin actions require ADMIN role

- [ ] **Input Validation**
  - [ ] All form inputs validated with Zod schemas
  - [ ] File uploads restricted by type and size
  - [ ] SQL injection prevention (Prisma parameterized queries)
  - [ ] XSS prevention (React auto-escaping + DOMPurify)

- [ ] **Rate Limiting**
  - [ ] Application submissions: 3 per day
  - [ ] Document uploads: 10 per hour
  - [ ] API requests: 100 per minute
  - [ ] Admin actions: 1000 per hour

- [ ] **Data Protection**
  - [ ] Sensitive data encrypted at rest
  - [ ] HTTPS enforced in production
  - [ ] Database credentials in environment variables
  - [ ] API keys rotated regularly

- [ ] **Audit Logging**
  - [ ] All vendor approvals logged
  - [ ] All rejections logged with reasons
  - [ ] All suspensions logged
  - [ ] Bulk actions logged

- [ ] **Error Handling**
  - [ ] No sensitive data in error messages
  - [ ] Generic error messages to users
  - [ ] Detailed errors logged server-side
  - [ ] Error monitoring configured (Sentry)

- [ ] **File Upload Security**
  - [ ] File type validation (magic bytes)
  - [ ] Virus scanning enabled
  - [ ] Files stored outside web root
  - [ ] Signed URLs for document access

- [ ] **Database Security**
  - [ ] Row-level security policies
  - [ ] Foreign key constraints
  - [ ] Unique constraints on business names
  - [ ] Soft deletes for audit trail

- [ ] **Monitoring**
  - [ ] Failed login attempts tracked
  - [ ] Suspicious activity alerts
  - [ ] Performance monitoring
  - [ ] Uptime monitoring

