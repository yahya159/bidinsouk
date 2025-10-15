# Vendor Approval System - Complete Architecture

## 1. VENDOR LIFECYCLE STATE MACHINE

### State Diagram
```
┌─────────────┐
│   CLIENT    │ (Default user role)
└──────┬──────┘
       │ Submits Application
       ▼
┌─────────────────┐
│ VENDOR_PENDING  │ (Application submitted, awaiting review)
└────┬────────┬───┘
     │        │
     │        │ Admin Rejects
     │        ▼
     │   ┌──────────────────┐
     │   │ VENDOR_REJECTED  │ (Can reapply after 30 days)
     │   └────────┬─────────┘
     │            │ 30 days pass
     │            └──────────┐
     │                       │
     │ Admin Approves        │ Reapplies
     ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ VENDOR_APPROVED │◄───│ VENDOR_PENDING  │
└────┬────────┬───┘    └─────────────────┘
     │        │
     │        │ Admin Suspends
     │        ▼
     │   ┌──────────────────┐
     │   │ VENDOR_SUSPENDED │ (All products hidden)
     │   └────────┬─────────┘
     │            │ Admin Reinstates
     │            └──────────┘
     │
     │ Creates Store
     ▼
┌─────────────────┐
│ STORE_PENDING   │ (Store awaiting approval)
└────┬────────┬───┘
     │        │
     │        │ Admin Rejects Store
     │        │ Admin Rejects Store
     │        ▼
     │   ┌──────────────────┐
     │   │ STORE_REJECTED   │ (Can resubmit)
     │   └──────────────────┘
     │
     │ Admin Approves Store
     ▼
┌─────────────────┐
│  STORE_ACTIVE   │ (Can list products)
└────┬────────────┘
     │
     │ Creates Products
     ▼
┌─────────────────┐
│ PRODUCT_ACTIVE  │ (Visible to buyers)
└─────────────────┘
```

### State Transitions Table

| Current State | Action | Next State | Side Effects |
|--------------|--------|------------|--------------|
| CLIENT | Submit Application | VENDOR_PENDING | Create Vendor record, Send notification to admins |
| VENDOR_PENDING | Admin Approve | VENDOR_APPROVED | Add 'VENDOR' to User.roles, Send approval email |
| VENDOR_PENDING | Admin Reject | VENDOR_REJECTED | Set rejectedAt timestamp, Send rejection email with reason |
| VENDOR_REJECTED | 30 Days Pass + Reapply | VENDOR_PENDING | Clear rejection reason, Update application |
| VENDOR_APPROVED | Admin Suspend | VENDOR_SUSPENDED | Hide all products, Disable store access, Send notification |
| VENDOR_SUSPENDED | Admin Reinstate | VENDOR_APPROVED | Restore products, Enable store access |
| VENDOR_APPROVED | Create Store | STORE_PENDING | Create Store record, Notify admins |
| STORE_PENDING | Admin Approve | STORE_ACTIVE | Enable product listing, Send confirmation |
| STORE_PENDING | Admin Reject | STORE_REJECTED | Send rejection reason |
| STORE_ACTIVE | Admin Suspend | STORE_SUSPENDED | Hide all products |


## 2. APPLICATION FORM DESIGN

### Required Fields & Validation

```typescript
interface VendorApplicationForm {
  // Business Information
  businessName: string;           // 3-100 chars, unique
  businessDescription: string;    // 50-1000 chars
  businessType: 'INDIVIDUAL' | 'COMPANY' | 'PARTNERSHIP';
  
  // Contact Information
  phoneNumber: string;            // E.164 format validation
  businessEmail: string;          // Valid email, different from user email
  businessAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
  // Legal Information
  taxId: string;                  // Format varies by country
  businessRegistrationNumber?: string;
  
  // Documents (Required)
  documents: {
    businessLicense: File;        // PDF/JPG, max 5MB
    taxCertificate: File;         // PDF/JPG, max 5MB
    identityProof: File;          // PDF/JPG, max 5MB
    addressProof?: File;          // Optional, PDF/JPG, max 5MB
  };
  
  // Banking Information (for payouts)
  bankAccount: {
    accountHolderName: string;
    accountNumber: string;        // Encrypted
    routingNumber: string;        // Encrypted
    bankName: string;
  };
  
  // Additional Information
  yearsInBusiness: number;        // 0-100
  estimatedMonthlyVolume: string; // Range selection
  productCategories: string[];    // Multi-select, max 5
  
  // Agreements
  termsAccepted: boolean;         // Must be true
  privacyPolicyAccepted: boolean; // Must be true
}
```


### Validation Rules

```typescript
const vendorApplicationValidation = {
  businessName: {
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s&'-]+$/,
    unique: true,
    errorMessages: {
      minLength: 'Business name must be at least 3 characters',
      maxLength: 'Business name cannot exceed 100 characters',
      pattern: 'Business name contains invalid characters',
      unique: 'This business name is already registered'
    }
  },
  
  businessDescription: {
    minLength: 50,
    maxLength: 1000,
    errorMessages: {
      minLength: 'Please provide at least 50 characters describing your business',
      maxLength: 'Description cannot exceed 1000 characters'
    }
  },
  
  phoneNumber: {
    pattern: /^\+[1-9]\d{1,14}$/,
    errorMessages: {
      pattern: 'Please enter a valid international phone number (e.g., +1234567890)'
    }
  },
  
  taxId: {
    required: true,
    pattern: /^[A-Z0-9-]+$/,
    minLength: 5,
    maxLength: 20,
    errorMessages: {
      required: 'Tax ID is required for vendor registration',
      pattern: 'Invalid tax ID format'
    }
  },
  
  documents: {
    businessLicense: {
      required: true,
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      errorMessages: {
        required: 'Business license is required',
        maxSize: 'File size must not exceed 5MB',
        allowedTypes: 'Only PDF, JPG, and PNG files are allowed'
      }
    }
  }
};
```


## 3. EDGE CASES & HANDLING

### Edge Case 1: User Applies Twice

**Scenario**: User submits application while one is already pending

**Solution**:
```typescript
// Before creating new application
const existingApplication = await prisma.vendor.findFirst({
  where: {
    userId: user.id,
    status: { in: ['PENDING', 'APPROVED'] }
  }
});

if (existingApplication) {
  if (existingApplication.status === 'PENDING') {
    throw new Error('You already have a pending application. Please wait for review.');
  }
  if (existingApplication.status === 'APPROVED') {
    throw new Error('You are already an approved vendor.');
  }
}
```

### Edge Case 2: Vendor Deleted Their Store

**Scenario**: Approved vendor deletes their only store

**Solution**:
```typescript
// On store deletion
await prisma.$transaction(async (tx) => {
  // Soft delete store
  await tx.store.update({
    where: { id: storeId },
    data: { 
      status: 'DELETED',
      deletedAt: new Date()
    }
  });
  
  // Archive all products
  await tx.product.updateMany({
    where: { storeId },
    data: { status: 'ARCHIVED' }
  });
  
  // Allow vendor to create new store
  // Vendor status remains APPROVED
  // They can create ONE new store
});
```


### Edge Case 3: Admin Approval Expires

**Scenario**: Vendor approved but never creates store for 90 days

**Solution**:
```typescript
// Scheduled job runs daily
async function checkInactiveVendors() {
  const inactiveVendors = await prisma.vendor.findMany({
    where: {
      status: 'APPROVED',
      approvedAt: {
        lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      },
      store: null // No store created
    }
  });
  
  for (const vendor of inactiveVendors) {
    // Send reminder email
    await sendEmail({
      to: vendor.user.email,
      subject: 'Complete Your Vendor Setup',
      template: 'vendor-inactive-reminder',
      data: { vendor }
    });
    
    // After 120 days, mark as expired
    if (vendor.approvedAt < new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)) {
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: { 
          status: 'EXPIRED',
          expirationReason: 'No store created within 120 days of approval'
        }
      });
      
      // Remove VENDOR role
      await prisma.user.update({
        where: { id: vendor.userId },
        data: {
          roles: {
            set: vendor.user.roles.filter(r => r !== 'VENDOR')
          }
        }
      });
    }
  }
}
```


### Edge Case 4: Rejected Vendor Reapplies Too Soon

**Scenario**: Vendor tries to reapply before 30-day waiting period

**Solution**:
```typescript
const lastRejection = await prisma.vendor.findFirst({
  where: {
    userId: user.id,
    status: 'REJECTED'
  },
  orderBy: { rejectedAt: 'desc' }
});

if (lastRejection) {
  const daysSinceRejection = Math.floor(
    (Date.now() - lastRejection.rejectedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceRejection < 30) {
    const daysRemaining = 30 - daysSinceRejection;
    throw new Error(
      `You can reapply in ${daysRemaining} days. Previous rejection reason: ${lastRejection.rejectionReason}`
    );
  }
}
```

### Edge Case 5: Vendor Has Active Orders When Suspended

**Scenario**: Admin suspends vendor with pending orders

**Solution**:
```typescript
async function suspendVendor(vendorId: string, reason: string) {
  await prisma.$transaction(async (tx) => {
    // Check for active orders
    const activeOrders = await tx.order.findMany({
      where: {
        vendorId,
        status: { in: ['PENDING', 'PROCESSING', 'SHIPPED'] }
      }
    });
    
    if (activeOrders.length > 0) {
      // Create warning but allow suspension
      await tx.vendorSuspension.create({
        data: {
          vendorId,
          reason,
          activeOrdersCount: activeOrders.length,
          suspendedAt: new Date()
        }
      });
      
      // Notify vendor to fulfill existing orders
      await sendEmail({
        template: 'vendor-suspended-with-orders',
        data: { activeOrdersCount: activeOrders.length }
      });
    }
    
    // Suspend vendor
    await tx.vendor.update({
      where: { id: vendorId },
      data: { status: 'SUSPENDED', suspendedAt: new Date(), suspensionReason: reason }
    });
    
    // Hide all products
    await tx.product.updateMany({
      where: { vendorId },
      data: { visibility: 'HIDDEN', hiddenReason: 'VENDOR_SUSPENDED' }
    });
  });
}
```


## 4. ADMIN APPROVAL INTERFACE

### Admin Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Vendor Applications Dashboard                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Overview Stats                                          │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ Pending  │ Approved │ Rejected │ Avg Time │            │
│  │    12    │   145    │    23    │  2.3 days│            │
│  └──────────┴──────────┴──────────┴──────────┘            │
│                                                              │
│  🔍 Filters: [All] [Pending] [Approved] [Rejected]         │
│  📅 Date Range: [Last 30 Days ▼]                           │
│  🔎 Search: [Business name, email, tax ID...]              │
│                                                              │
│  ☑️ Bulk Actions: [Select All] [Approve Selected] [Reject] │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Pending Applications (12)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ☑️ TechGear Solutions                              │   │
│  │ 📧 john@techgear.com | 📞 +1234567890             │   │
│  │ 📅 Applied: 2 days ago | ⏱️ Priority: High        │   │
│  │                                                     │   │
│  │ Business Type: COMPANY                             │   │
│  │ Categories: Electronics, Gadgets                   │   │
│  │ Est. Monthly Volume: $10,000 - $50,000            │   │
│  │                                                     │   │
│  │ 📎 Documents:                                      │   │
│  │   ✅ Business License [View]                       │   │
│  │   ✅ Tax Certificate [View]                        │   │
│  │   ✅ Identity Proof [View]                         │   │
│  │                                                     │   │
│  │ [✅ Quick Approve] [❌ Reject] [👁️ Full Review]   │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```


### Quick Actions Implementation

```typescript
// Quick Approve
async function quickApproveVendor(vendorId: string, adminId: string) {
  await prisma.$transaction(async (tx) => {
    // Update vendor status
    const vendor = await tx.vendor.update({
      where: { id: vendorId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: adminId
      },
      include: { user: true }
    });
    
    // Add VENDOR role to user
    await tx.user.update({
      where: { id: vendor.userId },
      data: {
        roles: {
          push: 'VENDOR'
        }
      }
    });
    
    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'VENDOR_APPROVED',
        performedBy: adminId,
        targetId: vendorId,
        targetType: 'VENDOR',
        metadata: {
          businessName: vendor.businessName,
          approvalMethod: 'QUICK_APPROVE'
        }
      }
    });
    
    // Send approval email
    await sendEmail({
      to: vendor.user.email,
      subject: 'Your Vendor Application Has Been Approved!',
      template: 'vendor-approved',
      data: { vendor }
    });
  });
}

// Reject with Reason
async function rejectVendor(
  vendorId: string, 
  adminId: string, 
  reason: string,
  category: 'INCOMPLETE_DOCS' | 'INVALID_INFO' | 'POLICY_VIOLATION' | 'OTHER'
) {
  await prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.update({
      where: { id: vendorId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: adminId,
        rejectionReason: reason,
        rejectionCategory: category
      },
      include: { user: true }
    });
    
    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'VENDOR_REJECTED',
        performedBy: adminId,
        targetId: vendorId,
        targetType: 'VENDOR',
        metadata: { reason, category }
      }
    });
    
    // Send rejection email
    await sendEmail({
      to: vendor.user.email,
      subject: 'Vendor Application Update',
      template: 'vendor-rejected',
      data: { 
        vendor, 
        reason,
        canReapplyDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
  });
}
```


### Bulk Approval System

```typescript
async function bulkApproveVendors(
  vendorIds: string[], 
  adminId: string
) {
  const results = {
    successful: [] as string[],
    failed: [] as { id: string; error: string }[]
  };
  
  for (const vendorId of vendorIds) {
    try {
      await quickApproveVendor(vendorId, adminId);
      results.successful.push(vendorId);
    } catch (error) {
      results.failed.push({
        id: vendorId,
        error: error.message
      });
    }
  }
  
  // Create bulk action audit log
  await prisma.auditLog.create({
    data: {
      action: 'VENDOR_BULK_APPROVE',
      performedBy: adminId,
      metadata: {
        totalAttempted: vendorIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        failedIds: results.failed
      }
    }
  });
  
  return results;
}
```

### Review Queue Prioritization

```typescript
async function getVendorReviewQueue(adminId: string) {
  const applications = await prisma.vendor.findMany({
    where: { status: 'PENDING' },
    include: {
      user: {
        select: {
          email: true,
          createdAt: true
        }
      }
    },
    orderBy: [
      // Priority scoring
      { createdAt: 'asc' } // Oldest first
    ]
  });
  
  // Calculate priority scores
  const prioritized = applications.map(app => {
    let priorityScore = 0;
    
    // Age factor (older = higher priority)
    const daysWaiting = Math.floor(
      (Date.now() - app.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    priorityScore += daysWaiting * 10;
    
    // Complete documentation bonus
    if (app.documentsComplete) priorityScore += 50;
    
    // High volume potential
    if (app.estimatedMonthlyVolume === 'HIGH') priorityScore += 30;
    
    return {
      ...app,
      priorityScore,
      priorityLevel: priorityScore > 100 ? 'HIGH' : priorityScore > 50 ? 'MEDIUM' : 'LOW'
    };
  });
  
  return prioritized.sort((a, b) => b.priorityScore - a.priorityScore);
}
```


## 5. AUTOMATIC PRODUCT HIDING

### Suspension Cascade Logic

```typescript
async function cascadeSuspension(vendorId: string) {
  await prisma.$transaction(async (tx) => {
    // 1. Hide all products
    const hiddenProducts = await tx.product.updateMany({
      where: { 
        vendorId,
        status: { not: 'ARCHIVED' }
      },
      data: {
        previousStatus: { // Store original status
          // Use raw SQL to store current status
        },
        status: 'HIDDEN',
        hiddenAt: new Date(),
        hiddenReason: 'VENDOR_SUSPENDED'
      }
    });
    
    // 2. Suspend store
    await tx.store.updateMany({
      where: { vendorId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date()
      }
    });
    
    // 3. Cancel pending auctions
    await tx.auction.updateMany({
      where: {
        vendorId,
        status: { in: ['ACTIVE', 'SCHEDULED'] }
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Vendor account suspended'
      }
    });
    
    // 4. Notify affected buyers with active bids
    const affectedBidders = await tx.bid.findMany({
      where: {
        auction: { vendorId },
        auction: { status: 'CANCELLED' }
      },
      include: {
        user: true,
        auction: true
      },
      distinct: ['userId']
    });
    
    for (const bid of affectedBidders) {
      await sendEmail({
        to: bid.user.email,
        subject: 'Auction Cancelled - Vendor Suspended',
        template: 'auction-cancelled-vendor-suspended',
        data: { auction: bid.auction }
      });
    }
    
    return {
      productsHidden: hiddenProducts.count,
      affectedBidders: affectedBidders.length
    };
  });
}
```


### Reinstatement Logic

```typescript
async function reinstateVendor(vendorId: string, adminId: string) {
  await prisma.$transaction(async (tx) => {
    // 1. Update vendor status
    await tx.vendor.update({
      where: { id: vendorId },
      data: {
        status: 'APPROVED',
        suspendedAt: null,
        suspensionReason: null,
        reinstatedAt: new Date(),
        reinstatedBy: adminId
      }
    });
    
    // 2. Reactivate store
    await tx.store.updateMany({
      where: { vendorId },
      data: {
        status: 'ACTIVE',
        suspendedAt: null
      }
    });
    
    // 3. Restore products to previous status
    const hiddenProducts = await tx.product.findMany({
      where: {
        vendorId,
        status: 'HIDDEN',
        hiddenReason: 'VENDOR_SUSPENDED'
      }
    });
    
    for (const product of hiddenProducts) {
      await tx.product.update({
        where: { id: product.id },
        data: {
          status: product.previousStatus || 'ACTIVE',
          hiddenAt: null,
          hiddenReason: null
        }
      });
    }
    
    // 4. Audit log
    await tx.auditLog.create({
      data: {
        action: 'VENDOR_REINSTATED',
        performedBy: adminId,
        targetId: vendorId,
        targetType: 'VENDOR',
        metadata: {
          productsRestored: hiddenProducts.length
        }
      }
    });
    
    // 5. Notify vendor
    const vendor = await tx.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true }
    });
    
    await sendEmail({
      to: vendor.user.email,
      subject: 'Your Vendor Account Has Been Reinstated',
      template: 'vendor-reinstated',
      data: { vendor }
    });
  });
}
```


## 6. NOTIFICATION SYSTEM

### Notification Trigger Points

```typescript
const notificationTriggers = {
  // Application Submitted
  'vendor.application.submitted': {
    recipients: ['admin'],
    template: 'admin-new-vendor-application',
    priority: 'MEDIUM',
    channels: ['email', 'dashboard']
  },
  
  // Application Approved
  'vendor.application.approved': {
    recipients: ['vendor'],
    template: 'vendor-approved',
    priority: 'HIGH',
    channels: ['email', 'sms', 'dashboard'],
    data: {
      nextSteps: [
        'Create your store',
        'Set up payment information',
        'List your first product'
      ]
    }
  },
  
  // Application Rejected
  'vendor.application.rejected': {
    recipients: ['vendor'],
    template: 'vendor-rejected',
    priority: 'HIGH',
    channels: ['email', 'dashboard'],
    data: {
      reason: 'string',
      canReapplyDate: 'Date',
      improvementSuggestions: 'string[]'
    }
  },
  
  // Reapplication Available
  'vendor.reapplication.available': {
    recipients: ['vendor'],
    template: 'vendor-can-reapply',
    priority: 'LOW',
    channels: ['email'],
    trigger: 'scheduled', // 30 days after rejection
    data: {
      previousRejectionReason: 'string',
      improvementChecklist: 'string[]'
    }
  },
  
  // Vendor Suspended
  'vendor.suspended': {
    recipients: ['vendor'],
    template: 'vendor-suspended',
    priority: 'CRITICAL',
    channels: ['email', 'sms', 'dashboard'],
    data: {
      reason: 'string',
      activeOrdersCount: 'number',
      appealProcess: 'string'
    }
  },
  
  // Store Approved
  'store.approved': {
    recipients: ['vendor'],
    template: 'store-approved',
    priority: 'HIGH',
    channels: ['email', 'dashboard']
  },
  
  // Inactivity Warning
  'vendor.inactivity.warning': {
    recipients: ['vendor'],
    template: 'vendor-inactive-warning',
    priority: 'MEDIUM',
    channels: ['email'],
    trigger: 'scheduled', // 90 days after approval, no store
    data: {
      daysUntilExpiration: 'number'
    }
  }
};
```


### Email Templates

```typescript
// Approval Email
const vendorApprovedEmail = {
  subject: '🎉 Welcome to Our Marketplace - Your Vendor Application is Approved!',
  body: `
    Hi {{vendorName}},

    Great news! Your vendor application has been approved.

    You can now:
    ✅ Create your store
    ✅ List products
    ✅ Start selling

    Next Steps:
    1. Complete your store setup: {{storeSetupUrl}}
    2. Add your first product: {{addProductUrl}}
    3. Review our seller guidelines: {{guidelinesUrl}}

    Need help? Our vendor support team is here: {{supportEmail}}

    Happy selling!
    The Marketplace Team
  `
};

// Rejection Email
const vendorRejectedEmail = {
  subject: 'Vendor Application Update',
  body: `
    Hi {{vendorName}},

    Thank you for your interest in becoming a vendor on our marketplace.

    After careful review, we're unable to approve your application at this time.

    Reason: {{rejectionReason}}

    What's Next?
    - You can reapply after {{reapplyDate}}
    - Please address the following before reapplying:
      {{improvementSuggestions}}

    If you have questions, contact us at {{supportEmail}}

    Best regards,
    The Marketplace Team
  `
};

// Suspension Email
const vendorSuspendedEmail = {
  subject: '⚠️ Important: Your Vendor Account Has Been Suspended',
  body: `
    Hi {{vendorName}},

    Your vendor account has been suspended.

    Reason: {{suspensionReason}}

    Impact:
    - All products are now hidden from buyers
    - You cannot list new products
    - Active orders ({{activeOrdersCount}}): Please fulfill these immediately

    Appeal Process:
    If you believe this is an error, you can appeal by:
    1. Reviewing our vendor policies: {{policiesUrl}}
    2. Submitting an appeal: {{appealUrl}}
    3. Providing supporting documentation

    Contact: {{supportEmail}}

    The Marketplace Team
  `
};
```


## 7. ROLE-BASED ACCESS CONTROL

### Middleware Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;
  
  // Vendor routes protection
  if (path.startsWith('/vendor')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    
    // Check if user has VENDOR role
    if (!token.roles?.includes('VENDOR')) {
      return NextResponse.redirect(new URL('/become-vendor', request.url));
    }
    
    // Check vendor status
    const vendor = await prisma.vendor.findUnique({
      where: { userId: token.sub }
    });
    
    if (!vendor) {
      return NextResponse.redirect(new URL('/become-vendor', request.url));
    }
    
    if (vendor.status === 'PENDING') {
      return NextResponse.redirect(new URL('/vendor/pending', request.url));
    }
    
    if (vendor.status === 'REJECTED') {
      return NextResponse.redirect(new URL('/vendor/rejected', request.url));
    }
    
    if (vendor.status === 'SUSPENDED') {
      // Allow access to limited pages
      const allowedSuspendedPaths = [
        '/vendor/suspended',
        '/vendor/orders', // Can still fulfill orders
        '/vendor/appeal'
      ];
      
      if (!allowedSuspendedPaths.some(p => path.startsWith(p))) {
        return NextResponse.redirect(new URL('/vendor/suspended', request.url));
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/vendor/:path*']
};
```


### API Route Protection

```typescript
// lib/auth/vendor-guard.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function requireVendor() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  if (!session.user.roles?.includes('VENDOR')) {
    throw new Error('Vendor role required');
  }
  
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    include: { store: true }
  });
  
  if (!vendor) {
    throw new Error('Vendor profile not found');
  }
  
  if (vendor.status !== 'APPROVED') {
    throw new Error(`Vendor status is ${vendor.status}`);
  }
  
  return { session, vendor };
}

export async function requireActiveStore() {
  const { vendor } = await requireVendor();
  
  if (!vendor.store) {
    throw new Error('Store not found. Please create a store first.');
  }
  
  if (vendor.store.status !== 'ACTIVE') {
    throw new Error(`Store status is ${vendor.store.status}`);
  }
  
  return { vendor, store: vendor.store };
}

// Usage in API routes
// app/api/vendor/products/route.ts
export async function POST(request: Request) {
  try {
    const { vendor, store } = await requireActiveStore();
    
    const body = await request.json();
    
    // Create product
    const product = await prisma.product.create({
      data: {
        ...body,
        vendorId: vendor.id,
        storeId: store.id
      }
    });
    
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    );
  }
}
```


### Frontend Route Guards

```typescript
// components/vendor/VendorGuard.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader } from '@mantine/core';

interface VendorGuardProps {
  children: React.ReactNode;
  requireStore?: boolean;
}

export function VendorGuard({ children, requireStore = false }: VendorGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkVendorStatus() {
      if (status === 'loading') return;
      
      if (!session) {
        router.push('/auth/signin');
        return;
      }
      
      if (!session.user.roles?.includes('VENDOR')) {
        router.push('/become-vendor');
        return;
      }
      
      // Fetch vendor status
      const res = await fetch('/api/vendor/status');
      const data = await res.json();
      
      if (!data.vendor) {
        router.push('/become-vendor');
        return;
      }
      
      setVendor(data.vendor);
      
      // Handle different statuses
      if (data.vendor.status === 'PENDING') {
        router.push('/vendor/pending');
        return;
      }
      
      if (data.vendor.status === 'REJECTED') {
        router.push('/vendor/rejected');
        return;
      }
      
      if (data.vendor.status === 'SUSPENDED') {
        router.push('/vendor/suspended');
        return;
      }
      
      if (requireStore && !data.vendor.store) {
        router.push('/vendor/create-store');
        return;
      }
      
      if (requireStore && data.vendor.store.status !== 'ACTIVE') {
        router.push('/vendor/store-pending');
        return;
      }
      
      setLoading(false);
    }
    
    checkVendorStatus();
  }, [session, status, router, requireStore]);
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Loader size="lg" />
      </div>
    );
  }
  
  return <>{children}</>;
}
```


## 8. VENDOR ANALYTICS

### Tracking Metrics

```typescript
interface VendorAnalytics {
  // Approval Metrics
  approvalRate: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    rate: number; // approved / (approved + rejected)
  };
  
  // Time Metrics
  averageApprovalTime: {
    mean: number;        // Average days
    median: number;      // Median days
    p95: number;         // 95th percentile
    fastest: number;     // Fastest approval
    slowest: number;     // Slowest approval
  };
  
  // Rejection Analysis
  rejectionReasons: {
    category: string;
    count: number;
    percentage: number;
  }[];
  
  // Reapplication Metrics
  reapplicationRate: {
    totalRejected: number;
    reapplied: number;
    approvedOnSecondAttempt: number;
    rate: number;
  };
  
  // Admin Performance
  adminPerformance: {
    adminId: string;
    adminName: string;
    reviewsCompleted: number;
    averageReviewTime: number;
    approvalRate: number;
  }[];
  
  // Vendor Success Metrics
  vendorSuccess: {
    totalApproved: number;
    withActiveStore: number;
    withProducts: number;
    withSales: number;
    conversionFunnel: {
      approved: number;
      createdStore: number;
      listedProducts: number;
      madeSale: number;
    };
  };
}
```


### Analytics Implementation

```typescript
// lib/analytics/vendor-analytics.ts
export async function getVendorAnalytics(dateRange?: { from: Date; to: Date }) {
  const where = dateRange ? {
    createdAt: {
      gte: dateRange.from,
      lte: dateRange.to
    }
  } : {};
  
  // Approval Rate
  const [total, approved, rejected, pending] = await Promise.all([
    prisma.vendor.count({ where }),
    prisma.vendor.count({ where: { ...where, status: 'APPROVED' } }),
    prisma.vendor.count({ where: { ...where, status: 'REJECTED' } }),
    prisma.vendor.count({ where: { ...where, status: 'PENDING' } })
  ]);
  
  const approvalRate = {
    total,
    approved,
    rejected,
    pending,
    rate: approved / (approved + rejected) || 0
  };
  
  // Average Approval Time
  const approvedVendors = await prisma.vendor.findMany({
    where: { ...where, status: 'APPROVED', approvedAt: { not: null } },
    select: {
      createdAt: true,
      approvedAt: true
    }
  });
  
  const approvalTimes = approvedVendors.map(v => 
    Math.floor((v.approvedAt.getTime() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  ).sort((a, b) => a - b);
  
  const averageApprovalTime = {
    mean: approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length || 0,
    median: approvalTimes[Math.floor(approvalTimes.length / 2)] || 0,
    p95: approvalTimes[Math.floor(approvalTimes.length * 0.95)] || 0,
    fastest: approvalTimes[0] || 0,
    slowest: approvalTimes[approvalTimes.length - 1] || 0
  };
  
  // Rejection Reasons
  const rejections = await prisma.vendor.groupBy({
    by: ['rejectionCategory'],
    where: { ...where, status: 'REJECTED' },
    _count: true
  });
  
  const rejectionReasons = rejections.map(r => ({
    category: r.rejectionCategory,
    count: r._count,
    percentage: (r._count / rejected) * 100
  }));
  
  // Admin Performance
  const adminStats = await prisma.vendor.groupBy({
    by: ['approvedBy'],
    where: { ...where, status: 'APPROVED', approvedBy: { not: null } },
    _count: true
  });
  
  const adminPerformance = await Promise.all(
    adminStats.map(async (stat) => {
      const admin = await prisma.user.findUnique({
        where: { id: stat.approvedBy },
        select: { name: true }
      });
      
      const adminVendors = await prisma.vendor.findMany({
        where: {
          approvedBy: stat.approvedBy,
          approvedAt: { not: null }
        },
        select: {
          createdAt: true,
          approvedAt: true
        }
      });
      
      const avgTime = adminVendors.reduce((sum, v) => 
        sum + (v.approvedAt.getTime() - v.createdAt.getTime()), 0
      ) / adminVendors.length / (1000 * 60 * 60 * 24);
      
      return {
        adminId: stat.approvedBy,
        adminName: admin?.name || 'Unknown',
        reviewsCompleted: stat._count,
        averageReviewTime: avgTime,
        approvalRate: 1.0 // Could calculate rejections too
      };
    })
  );
  
  return {
    approvalRate,
    averageApprovalTime,
    rejectionReasons,
    adminPerformance
  };
}
```


### Analytics Dashboard Component

```typescript
// components/admin/VendorAnalyticsDashboard.tsx
'use client';

import { Card, Grid, Text, Progress, Table } from '@mantine/core';
import { useEffect, useState } from 'react';

export function VendorAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  
  useEffect(() => {
    fetch('/api/admin/analytics/vendors')
      .then(res => res.json())
      .then(setAnalytics);
  }, []);
  
  if (!analytics) return <div>Loading...</div>;
  
  return (
    <div>
      <Grid>
        <Grid.Col span={3}>
          <Card>
            <Text size="sm" c="dimmed">Approval Rate</Text>
            <Text size="xl" fw={700}>
              {(analytics.approvalRate.rate * 100).toFixed(1)}%
            </Text>
            <Progress 
              value={analytics.approvalRate.rate * 100} 
              color="green" 
              mt="sm"
            />
          </Card>
        </Grid.Col>
        
        <Grid.Col span={3}>
          <Card>
            <Text size="sm" c="dimmed">Avg Approval Time</Text>
            <Text size="xl" fw={700}>
              {analytics.averageApprovalTime.mean.toFixed(1)} days
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              Median: {analytics.averageApprovalTime.median} days
            </Text>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={3}>
          <Card>
            <Text size="sm" c="dimmed">Pending Reviews</Text>
            <Text size="xl" fw={700}>
              {analytics.approvalRate.pending}
            </Text>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={3}>
          <Card>
            <Text size="sm" c="dimmed">Total Vendors</Text>
            <Text size="xl" fw={700}>
              {analytics.approvalRate.total}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>
      
      <Card mt="xl">
        <Text size="lg" fw={600} mb="md">Rejection Reasons</Text>
        <Table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {analytics.rejectionReasons.map(reason => (
              <tr key={reason.category}>
                <td>{reason.category}</td>
                <td>{reason.count}</td>
                <td>{reason.percentage.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      
      <Card mt="xl">
        <Text size="lg" fw={600} mb="md">Admin Performance</Text>
        <Table>
          <thead>
            <tr>
              <th>Admin</th>
              <th>Reviews</th>
              <th>Avg Time</th>
              <th>Approval Rate</th>
            </tr>
          </thead>
          <tbody>
            {analytics.adminPerformance.map(admin => (
              <tr key={admin.adminId}>
                <td>{admin.adminName}</td>
                <td>{admin.reviewsCompleted}</td>
                <td>{admin.averageReviewTime.toFixed(1)} days</td>
                <td>{(admin.approvalRate * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
```

