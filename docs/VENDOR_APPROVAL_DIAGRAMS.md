# Vendor Approval System - Visual Diagrams

## 1. COMPLETE WORKFLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                     VENDOR APPROVAL WORKFLOW                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────┐
│  CLIENT  │ (New User)
└────┬─────┘
     │
     │ 1. Navigate to /become-vendor
     ▼
┌─────────────────────┐
│ Application Form    │
│ - Business Info     │
│ - Contact Details   │
│ - Documents Upload  │
│ - Banking Info      │
└────┬────────────────┘
     │
     │ 2. Submit Application
     ▼
┌─────────────────────┐
│ Validation Layer    │
│ - Check duplicates  │
│ - Validate fields   │
│ - Check cooldown    │
└────┬────────────────┘
     │
     │ 3. Create Vendor Record
     ▼
┌─────────────────────┐
│ VENDOR_PENDING      │
│ Status: PENDING     │
│ Awaiting Review     │
└────┬────────────────┘
     │
     │ 4. Notify Admins
     ▼
┌─────────────────────┐
│ Admin Dashboard     │
│ - Review Queue      │
│ - View Documents    │
│ - Check Details     │
└────┬────────────────┘
     │
     ├─────────────────┬─────────────────┐
     │                 │                 │
     │ APPROVE         │ REJECT          │ REQUEST INFO
     ▼                 ▼                 ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│APPROVED  │    │REJECTED  │    │PENDING   │
│          │    │          │    │(Updated) │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     │               │               └──────┐
     │               │                      │
     │               │ 30 Days Wait         │
     │               │                      │
     │               └──────────────────────┘
     │                      │
     │                      │ Reapply
     │                      ▼
     │               ┌──────────┐
     │               │PENDING   │
     │               │(New App) │
     │               └──────────┘
     │
     │ 5. Add VENDOR Role
     ▼
┌─────────────────────┐
│ User.roles          │
│ ['CLIENT','VENDOR'] │
└────┬────────────────┘
     │
     │ 6. Create Store
     ▼
┌─────────────────────┐
│ STORE_PENDING       │
│ Awaiting Approval   │
└────┬────────────────┘
     │
     │ 7. Admin Approves Store
     ▼
┌─────────────────────┐
│ STORE_ACTIVE        │
│ Can List Products   │
└────┬────────────────┘
     │
     │ 8. Create Products
     ▼
┌─────────────────────┐
│ PRODUCT_ACTIVE      │
│ Visible to Buyers   │
└─────────────────────┘
```


## 2. SUSPENSION CASCADE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│              VENDOR SUSPENSION CASCADE EFFECT                    │
└─────────────────────────────────────────────────────────────────┘

Admin Suspends Vendor
        │
        ▼
┌───────────────────┐
│ Vendor.status =   │
│ SUSPENDED         │
└────┬──────────────┘
     │
     ├──────────────────────────────────────┐
     │                                      │
     │ Cascade 1: Hide Products             │ Cascade 2: Suspend Store
     ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────┐
│ Product.updateMany  │              │ Store.status =      │
│ WHERE vendorId      │              │ SUSPENDED           │
│ SET status=HIDDEN   │              └─────────────────────┘
│ SET hiddenReason=   │
│ VENDOR_SUSPENDED    │
└────┬────────────────┘
     │
     │ Cascade 3: Cancel Active Auctions
     ▼
┌─────────────────────┐
│ Auction.updateMany  │
│ WHERE vendorId      │
│ AND status=ACTIVE   │
│ SET status=CANCELLED│
└────┬────────────────┘
     │
     │ Cascade 4: Notify Affected Users
     ▼
┌─────────────────────┐
│ Find all bidders    │
│ with active bids    │
│ Send cancellation   │
│ emails              │
└────┬────────────────┘
     │
     │ Cascade 5: Audit Log
     ▼
┌─────────────────────┐
│ Create audit entry  │
│ - Action: SUSPENDED │
│ - Reason: ...       │
│ - Products: count   │
│ - Auctions: count   │
└─────────────────────┘

REINSTATEMENT PROCESS
        │
        ▼
┌───────────────────┐
│ Admin Reinstates  │
└────┬──────────────┘
     │
     ├──────────────────────────────────────┐
     │                                      │
     │ Restore 1: Vendor Status             │ Restore 2: Store Status
     ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────┐
│ Vendor.status =     │              │ Store.status =      │
│ APPROVED            │              │ ACTIVE              │
└─────────────────────┘              └─────────────────────┘
     │
     │ Restore 3: Products
     ▼
┌─────────────────────┐
│ Product.updateMany  │
│ SET status=         │
│ previousStatus      │
│ (ACTIVE/DRAFT)      │
└─────────────────────┘
```


## 3. SECURITY LAYERS DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

User Request: POST /api/vendor/products
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ LAYER 1: Middleware (middleware.ts)                           │
│ ✓ Check authentication (NextAuth session)                     │
│ ✓ Verify VENDOR role exists                                   │
│ ✓ Check vendor status (not PENDING/REJECTED/SUSPENDED)        │
│ ✓ Rate limiting check                                         │
└────┬──────────────────────────────────────────────────────────┘
     │ ✓ PASS
     ▼
┌───────────────────────────────────────────────────────────────┐
│ LAYER 2: API Route Guard (requireActiveStore)                 │
│ ✓ Fetch vendor from database                                  │
│ ✓ Verify vendor.status === 'APPROVED'                         │
│ ✓ Verify store exists                                         │
│ ✓ Verify store.status === 'ACTIVE'                            │
└────┬──────────────────────────────────────────────────────────┘
     │ ✓ PASS
     ▼
┌───────────────────────────────────────────────────────────────┐
│ LAYER 3: Input Validation (Zod Schema)                        │
│ ✓ Validate product data structure                             │
│ ✓ Check required fields                                       │
│ ✓ Validate data types                                         │
│ ✓ Sanitize inputs                                             │
└────┬──────────────────────────────────────────────────────────┘
     │ ✓ PASS
     ▼
┌───────────────────────────────────────────────────────────────┐
│ LAYER 4: Business Logic Validation                            │
│ ✓ Check product limit for vendor tier                         │
│ ✓ Verify category is allowed                                  │
│ ✓ Check image count limits                                    │
│ ✓ Validate pricing rules                                      │
└────┬──────────────────────────────────────────────────────────┘
     │ ✓ PASS
     ▼
┌───────────────────────────────────────────────────────────────┐
│ LAYER 5: Database Transaction                                 │
│ ✓ Create product with vendorId                                │
│ ✓ Foreign key constraints enforced                            │
│ ✓ Unique constraints checked                                  │
└────┬──────────────────────────────────────────────────────────┘
     │ ✓ SUCCESS
     ▼
┌───────────────────────────────────────────────────────────────┐
│ LAYER 6: Audit Logging                                        │
│ ✓ Log product creation                                        │
│ ✓ Record vendor ID, product ID                                │
│ ✓ Store metadata (category, price, etc.)                      │
│ ✓ Immutable audit trail                                       │
└───────────────────────────────────────────────────────────────┘

FAILURE AT ANY LAYER → Reject Request + Log Attempt
```


## 4. ADMIN DASHBOARD FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                  ADMIN REVIEW DASHBOARD                          │
└─────────────────────────────────────────────────────────────────┘

Admin Logs In
     │
     ▼
┌─────────────────────┐
│ /admin/vendors      │
│ Dashboard Home      │
└────┬────────────────┘
     │
     ├──────────────────┬──────────────────┬──────────────────┐
     │                  │                  │                  │
     │ View Pending     │ View All         │ View Analytics   │
     ▼                  ▼                  ▼                  │
┌──────────┐    ┌──────────┐    ┌──────────┐              │
│ PENDING  │    │   ALL    │    │ANALYTICS │              │
│ Queue    │    │ Vendors  │    │Dashboard │              │
└────┬─────┘    └────┬─────┘    └──────────┘              │
     │               │                                      │
     │ Select Vendor │                                      │
     ▼               ▼                                      │
┌─────────────────────────────────────────────────────────┐│
│ Vendor Detail View                                      ││
│ ┌─────────────────────────────────────────────────────┐││
│ │ Business Information                                │││
│ │ - Name, Type, Description                           │││
│ │ - Contact: Email, Phone                             │││
│ │ - Address                                           │││
│ │ - Tax ID, Registration Number                       │││
│ └─────────────────────────────────────────────────────┘││
│                                                         ││
│ ┌─────────────────────────────────────────────────────┐││
│ │ Documents                                           │││
│ │ [View] Business License                             │││
│ │ [View] Tax Certificate                              │││
│ │ [View] Identity Proof                               │││
│ └─────────────────────────────────────────────────────┘││
│                                                         ││
│ ┌─────────────────────────────────────────────────────┐││
│ │ Additional Information                              │││
│ │ - Years in Business: 5                              │││
│ │ - Monthly Volume: $10k-$50k                         │││
│ │ - Categories: Electronics, Gadgets                  │││
│ │ - Applied: 2 days ago                               │││
│ └─────────────────────────────────────────────────────┘││
│                                                         ││
│ ┌─────────────────────────────────────────────────────┐││
│ │ Actions                                             │││
│ │ [✅ Quick Approve] [❌ Reject] [📧 Request Info]   │││
│ └─────────────────────────────────────────────────────┘││
└────┬────────────────────────────────────────────────────┘│
     │                                                      │
     ├──────────────────┬───────────────────────────────────┘
     │                  │
     │ APPROVE          │ REJECT
     ▼                  ▼
┌──────────┐    ┌────────────────────┐
│ Confirm  │    │ Rejection Modal    │
│ Dialog   │    │ - Select Category  │
└────┬─────┘    │ - Enter Reason     │
     │          │ - Suggestions      │
     │          └────┬───────────────┘
     │               │
     │ Confirm       │ Confirm
     ▼               ▼
┌──────────┐    ┌──────────┐
│ Execute  │    │ Execute  │
│ Approval │    │Rejection │
└────┬─────┘    └────┬─────┘
     │               │
     ├───────────────┴──────────────┐
     │                              │
     │ Update Database              │
     ▼                              │
┌─────────────────────┐            │
│ - Update status     │            │
│ - Add role to user  │            │
│ - Create audit log  │            │
│ - Send email        │            │
│ - Show notification │            │
└─────────────────────┘            │
                                   │
                                   │
     ┌─────────────────────────────┘
     │
     │ Refresh Dashboard
     ▼
┌─────────────────────┐
│ Updated Vendor List │
│ (Removed from queue)│
└─────────────────────┘
```


## 5. NOTIFICATION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION SYSTEM                           │
└─────────────────────────────────────────────────────────────────┘

Event Trigger
     │
     ├──────────────────┬──────────────────┬──────────────────┐
     │                  │                  │                  │
     │ Application      │ Approval         │ Rejection        │ Suspension
     │ Submitted        │                  │                  │
     ▼                  ▼                  ▼                  ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Notify   │    │ Notify   │    │ Notify   │    │ Notify   │
│ Admins   │    │ Vendor   │    │ Vendor   │    │ Vendor   │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │               │               │               │
     ├───────────────┴───────────────┴───────────────┤
     │                                               │
     ▼                                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Notification Service                                         │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│ │   Email     │     SMS     │  Dashboard  │   Webhook   │  │
│ │   Queue     │    Queue    │   Notif     │   Queue     │  │
│ └──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┘  │
└────────┼─────────────┼─────────────┼─────────────┼─────────┘
         │             │             │             │
         ▼             ▼             ▼             ▼
    ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
    │ SMTP   │   │Twilio  │   │ WebSocket│  │External│
    │ Server │   │  API   │   │ Broadcast│  │  API   │
    └────┬───┘   └────┬───┘   └────┬───┘   └────┬───┘
         │            │            │            │
         ▼            ▼            ▼            ▼
    ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
    │ Email  │   │  SMS   │   │ Real-  │   │ Slack/ │
    │ Inbox  │   │ Device │   │ time   │   │Discord │
    └────────┘   └────────┘   │ Update │   └────────┘
                              └────────┘

EMAIL TEMPLATE SELECTION
     │
     ├──────────────────┬──────────────────┬──────────────────┐
     │                  │                  │                  │
     │ vendor-approved  │ vendor-rejected  │ vendor-suspended │
     ▼                  ▼                  ▼                  ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Template │    │ Template │    │ Template │    │ Template │
│ + Data   │    │ + Data   │    │ + Data   │    │ + Data   │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     └───────────────┴───────────────┴───────────────┘
                     │
                     ▼
            ┌────────────────┐
            │ Render Template│
            │ with Variables │
            └────────┬───────┘
                     │
                     ▼
            ┌────────────────┐
            │ Send to User   │
            └────────────────┘

SCHEDULED NOTIFICATIONS
     │
     ├──────────────────┬──────────────────┐
     │                  │                  │
     │ 30 Days After    │ 90 Days After    │ 7 Days Before
     │ Rejection        │ Approval         │ Expiration
     ▼                  ▼                  ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Can      │    │ Inactive │    │ Store    │
│ Reapply  │    │ Warning  │    │ Expiring │
│ Reminder │    │          │    │          │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     └───────────────┴───────────────┘
                     │
                     ▼
            ┌────────────────┐
            │ Cron Job       │
            │ Checks Daily   │
            └────────────────┘
```


## 2. ADMIN REVIEW INTERFACE

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Dashboard - Vendor Management                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Pending] [Approved] [Rejected] [Suspended]                │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Pending Applications (12)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ TechGear Solutions                                 │   │
│  │ john@techgear.com | +1234567890                   │   │
│  │ Applied: 2 days ago                                │   │
│  │                                                     │   │
│  │ Type: COMPANY                                      │   │
│  │ Tax ID: 12-3456789                                │   │
│  │ Description: Electronics retailer...              │   │
│  │                                                     │   │
│  │ [✅ Approve] [❌ Reject] [👁️ Details]             │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Fashion Hub                                        │   │
│  │ sarah@fashionhub.com | +9876543210                │   │
│  │ Applied: 5 days ago                                │   │
│  │                                                     │   │
│  │ Type: PARTNERSHIP                                  │   │
│  │ Tax ID: 98-7654321                                │   │
│  │ Description: Fashion and accessories...           │   │
│  │                                                     │   │
│  │ [✅ Approve] [❌ Reject] [👁️ Details]             │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 3. REJECTION MODAL

```
┌─────────────────────────────────────────────────────────────┐
│  Reject Vendor Application                              [X] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Rejection Category *                                       │
│  ┌────────────────────────────────────────────────────┐   │
│  │ [Select a category ▼]                              │   │
│  │  - Incomplete Documentation                        │   │
│  │  - Invalid Information                             │   │
│  │  - Policy Violation                                │   │
│  │  - Other                                           │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  Rejection Reason *                                         │
│  ┌────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │ Provide a detailed reason for rejection...         │   │
│  │                                                     │   │
│  │                                                     │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  ⚠️ The vendor will be able to reapply after 30 days      │
│                                                              │
│                                    [Cancel] [Reject]        │
└─────────────────────────────────────────────────────────────┘
```

## 4. VENDOR STATUS PAGES

### Pending Status

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                         ⏰                                   │
│                                                              │
│              Application Under Review                       │
│                                                              │
│     Your vendor application is currently being              │
│           reviewed by our team.                             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ℹ️ What happens next?                              │   │
│  │                                                     │   │
│  │ • Review within 2-3 business days                  │   │
│  │ • Email notification on decision                   │   │
│  │ • If approved, create store & list products        │   │
│  │ • If info needed, we'll contact you                │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│              Thank you for your patience!                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Rejected Status

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                         ⚠️                                   │
│                                                              │
│            Application Not Approved                         │
│                                                              │
│     Unfortunately, your vendor application was              │
│           not approved at this time.                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ❌ Rejection Reason                                │   │
│  │                                                     │   │
│  │ Your business documentation is incomplete.         │   │
│  │ Please provide a valid business license and        │   │
│  │ tax certificate.                                   │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ℹ️ What you can do                                 │   │
│  │                                                     │   │
│  │ • You can reapply in 15 days                       │   │
│  │ • Address the issues mentioned above               │   │
│  │ • Prepare all required documentation               │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Suspended Status

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                         🚫                                   │
│                                                              │
│                Account Suspended                            │
│                                                              │
│        Your vendor account has been suspended.              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ❌ Suspension Reason                               │   │
│  │                                                     │   │
│  │ Multiple policy violations detected.               │   │
│  │ Selling prohibited items.                          │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ⚠️ Impact of Suspension                            │   │
│  │                                                     │   │
│  │ • All products hidden from buyers                  │   │
│  │ • Cannot list new products                         │   │
│  │ • Active auctions cancelled                        │   │
│  │ • Can still fulfill existing orders                │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ℹ️ Appeal Process                                  │   │
│  │                                                     │   │
│  │ 1. Review our vendor policies                      │   │
│  │ 2. Contact support with your appeal                │   │
│  │ 3. Provide supporting documentation                │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│              Contact: support@marketplace.com               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 5. SECURITY LAYERS

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Architecture                     │
└─────────────────────────────────────────────────────────────┘

Request → /vendor/products
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Middleware                                          │
│ - Check authentication                                       │
│ - Verify VENDOR role in session                             │
│ - Redirect if not authenticated                             │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Frontend Guard (VendorGuard)                       │
│ - Fetch vendor status from API                              │
│ - Check status (PENDING/REJECTED/SUSPENDED)                 │
│ - Redirect to appropriate status page                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: API Guard (requireActiveStore)                     │
│ - Validate session                                          │
│ - Check VENDOR role                                         │
│ - Verify vendor status = APPROVED                           │
│ - Verify store status = ACTIVE                              │
│ - Throw VendorError if any check fails                      │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Business Logic                                     │
│ - Validate product data                                     │
│ - Check product limits                                      │
│ - Create product                                            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Audit Log                                          │
│ - Log action (PRODUCT_CREATED)                              │
│ - Store metadata                                            │
│ - Track actor and timestamp                                 │
└─────────────────────────────────────────────────────────────┘
```

## 6. SUSPENSION CASCADE

```
Admin Suspends Vendor
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Transaction Start                                            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Update Vendor                                        │
│ - status = SUSPENDED                                         │
│ - suspendedAt = now()                                        │
│ - suspensionReason = "..."                                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Suspend All Stores                                   │
│ - WHERE sellerId = vendorId                                  │
│ - SET status = SUSPENDED                                     │
│ - SET suspendedAt = now()                                    │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Hide All Products                                    │
│ - WHERE store.sellerId = vendorId                            │
│ - SET status = ARCHIVED                                      │
│ - Count affected products                                    │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Cancel Active Auctions                               │
│ - WHERE store.sellerId = vendorId                            │
│ - AND status IN (ACTIVE, RUNNING, SCHEDULED)                │
│ - SET status = CANCELLED                                     │
│ - Count affected auctions                                    │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Transaction Commit                                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Post-Transaction                                             │
│ - Create audit log                                           │
│ - Send notification to vendor                                │
│ - Notify affected bidders                                    │
└─────────────────────────────────────────────────────────────┘
```

## 7. REAPPLICATION FLOW

```
Vendor Rejected (Day 0)
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Rejection Recorded                                           │
│ - status = REJECTED                                          │
│ - rejectedAt = 2024-01-01                                    │
│ - rejectionReason = "..."                                    │
└────────────────────────┬────────────────────────────────────┘
                         ↓
                    Days 1-29
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Vendor Tries to Reapply                                      │
│ - Calculate: daysSince = (now - rejectedAt) / 86400000      │
│ - Check: daysSince < 30                                      │
│ - Result: ERROR "You can reapply in X days"                  │
└────────────────────────┬────────────────────────────────────┘
                         ↓
                      Day 30+
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Vendor Reapplies                                             │
│ - Calculate: daysSince >= 30                                 │
│ - Check: PASSED                                              │
│ - Create new Vendor record                                   │
│ - status = PENDING                                           │
│ - Previous rejection visible in history                      │
└─────────────────────────────────────────────────────────────┘
```

## 8. DATA FLOW DIAGRAM

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/vendor/apply
     ▼
┌─────────────────────────────────────────────────────────────┐
│ API Route: /api/vendor/apply                                 │
│                                                              │
│ 1. Get session                                              │
│ 2. Check existing application                               │
│ 3. Check rejection cooldown                                 │
│ 4. Validate input (Zod)                                     │
│ 5. Check business name uniqueness                           │
│ 6. Create vendor record                                     │
│ 7. Create audit log                                         │
│ 8. Return vendor data                                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Database: Vendor Table                                       │
│                                                              │
│ INSERT INTO Vendor (                                         │
│   userId, businessName, status, ...                          │
│ ) VALUES (                                                   │
│   123, 'TechGear', 'PENDING', ...                           │
│ )                                                            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Database: AuditLog Table                                     │
│                                                              │
│ INSERT INTO AuditLog (                                       │
│   action, actorId, entity, entityId, ...                     │
│ ) VALUES (                                                   │
│   'VENDOR_APPLICATION_SUBMITTED', 123, 'Vendor', 456, ...   │
│ )                                                            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Response to Client                                           │
│                                                              │
│ {                                                            │
│   "vendor": {                                                │
│     "id": "456",                                             │
│     "businessName": "TechGear",                              │
│     "status": "PENDING"                                      │
│   }                                                          │
│ }                                                            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌──────────┐
│  Client  │ → Redirect to /vendor/pending
└──────────┘
```

## 9. APPROVAL ANALYTICS DASHBOARD

```
┌─────────────────────────────────────────────────────────────┐
│  Vendor Analytics Dashboard                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ Approval │ Avg Time │ Pending  │  Total   │            │
│  │  Rate    │          │  Review  │ Vendors  │            │
│  │          │          │          │          │            │
│  │  87.5%   │ 2.3 days │    12    │   145    │            │
│  │  ████░░  │          │          │          │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
│                                                              │
│  Rejection Reasons                                          │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Incomplete Docs    ████████████░░░░░░░░  45%      │   │
│  │ Invalid Info       ████████░░░░░░░░░░░░  30%      │   │
│  │ Policy Violation   ████░░░░░░░░░░░░░░░░  15%      │   │
│  │ Other              ██░░░░░░░░░░░░░░░░░░  10%      │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  Admin Performance                                          │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Admin Name    │ Reviews │ Avg Time │ Approval Rate │   │
│  ├───────────────┼─────────┼──────────┼───────────────┤   │
│  │ John Smith    │   45    │ 1.8 days │    92%        │   │
│  │ Sarah Johnson │   38    │ 2.1 days │    85%        │   │
│  │ Mike Brown    │   32    │ 2.7 days │    88%        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  Vendor Success Funnel                                      │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Applied        145 ████████████████████████████    │   │
│  │ Approved       127 ████████████████████████░░░░    │   │
│  │ Created Store  115 ██████████████████████░░░░░░    │   │
│  │ Listed Product  98 ████████████████████░░░░░░░░    │   │
│  │ Made Sale       76 ██████████████░░░░░░░░░░░░░░    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 QUICK REFERENCE

### Status Colors
- 🟡 PENDING - Yellow
- 🟢 APPROVED - Green
- 🔴 REJECTED - Red
- 🔴 SUSPENDED - Red
- ⚪ EXPIRED - Gray

### Key Timeframes
- Review Time: 2-3 business days
- Rejection Cooldown: 30 days
- Approval Expiry: 120 days (if no store created)

### Important Limits
- One application at a time
- One store per vendor
- Product limits: BASIC (100), PREMIUM (1000)
- Document size: 5MB max
- Business name: Must be unique

