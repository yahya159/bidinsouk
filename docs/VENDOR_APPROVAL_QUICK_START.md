# Vendor Approval System - Quick Start Guide

## 🚀 IMPLEMENTATION CHECKLIST

### Phase 1: Database Setup (30 minutes)

- [ ] Update Prisma schema with Vendor, Store, AuditLog models
- [ ] Run `npx prisma migrate dev --name add-vendor-approval`
- [ ] Run `npx prisma generate`
- [ ] Verify database tables created

### Phase 2: Core API Routes (1 hour)

- [ ] Create `/api/vendor/apply` - Application submission
- [ ] Create `/api/vendor/status` - Check vendor status
- [ ] Create `/api/admin/vendors` - List vendors
- [ ] Create `/api/admin/vendors/[id]/approve` - Approve vendor
- [ ] Create `/api/admin/vendors/[id]/reject` - Reject vendor
- [ ] Create `/api/admin/vendors/[id]/suspend` - Suspend vendor

### Phase 3: Security Layer (45 minutes)

- [ ] Implement `requireVendor()` guard
- [ ] Implement `requireActiveStore()` guard
- [ ] Add middleware protection for `/vendor/*` routes
- [ ] Add rate limiting to application endpoint
- [ ] Set up audit logging

### Phase 4: Frontend Components (2 hours)

- [ ] Create vendor application form
- [ ] Create admin review dashboard
- [ ] Create vendor status pages (pending, rejected, suspended)
- [ ] Create VendorGuard component
- [ ] Add vendor navigation to sidebar

### Phase 5: Notifications (1 hour)

- [ ] Set up email templates
- [ ] Implement approval notification
- [ ] Implement rejection notification
- [ ] Implement suspension notification
- [ ] Add in-app notifications

### Phase 6: Testing (1 hour)

- [ ] Test application submission
- [ ] Test approval workflow
- [ ] Test rejection workflow
- [ ] Test suspension workflow
- [ ] Test reapplication after 30 days
- [ ] Test rate limiting
- [ ] Test security guards

---

## 📋 MINIMAL VIABLE IMPLEMENTATION

### 1. Database Migration

```bash
npx prisma migrate dev --name add-vendor-approval
```

### 2. Create Essential API Routes

**File: `app/api/vendor/apply/route.ts`**
- Handles vendor application submission
- Validates input data
- Checks for existing applications
- Creates vendor record with PENDING status

**File: `app/api/admin/vendors/[id]/approve/route.ts`**
- Approves vendor application
- Adds VENDOR role to user
- Sends approval email

**File: `app/api/admin/vendors/[id]/reject/route.ts`**
- Rejects vendor application
- Records rejection reason
- Sends rejection email

### 3. Create Frontend Pages

**File: `app/(main)/become-vendor/page.tsx`**
- Application form with all required fields
- Client-side validation
- File upload for documents

**File: `app/(admin)/admin/vendors/pending/page.tsx`**
- List of pending applications
- Quick approve/reject actions
- View application details

### 4. Add Security Guards

**File: `lib/auth/vendor-guard.ts`**
- `requireVendor()` - Checks vendor role and status
- `requireActiveStore()` - Checks store status
- Used in all vendor API routes

### 5. Update Middleware

**File: `middleware.ts`**
- Protect `/vendor/*` routes
- Check vendor status
- Redirect based on status

---

## 🎯 TESTING WORKFLOW

### Test Scenario 1: New Vendor Application

1. Register as new user (CLIENT role)
2. Navigate to `/become-vendor`
3. Fill application form
4. Submit application
5. Verify status is PENDING
6. Check admin dashboard shows application
7. Admin approves application
8. Verify user has VENDOR role
9. Verify vendor can access `/vendor` routes

### Test Scenario 2: Rejection & Reapplication

1. Admin rejects application with reason
2. Verify vendor sees rejection message
3. Try to reapply immediately (should fail)
4. Wait 30 days (or modify timestamp in DB)
5. Reapply successfully
6. Verify new application created

### Test Scenario 3: Vendor Suspension

1. Admin suspends approved vendor
2. Verify all products hidden
3. Verify vendor cannot create new products
4. Verify vendor can still view orders
5. Admin reinstates vendor
6. Verify products restored

---

## 🔧 CONFIGURATION

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email (for notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"

# Encryption (for sensitive data)
ENCRYPTION_KEY="32-byte-hex-string"

# File upload provider currently disabled in base install
# Reintroduce when configuring an upload service
```

---

## 📊 MONITORING & ANALYTICS

### Key Metrics to Track

1. **Approval Rate**: approved / (approved + rejected)
2. **Average Approval Time**: Time from submission to approval
3. **Rejection Reasons**: Most common rejection categories
4. **Reapplication Rate**: Rejected vendors who reapply
5. **Vendor Success Rate**: Approved vendors who create stores

### Dashboard Queries

```typescript
// Get approval rate
const approvalRate = await prisma.vendor.groupBy({
  by: ['status'],
  _count: true
});

// Get average approval time
const avgTime = await prisma.vendor.aggregate({
  where: { status: 'APPROVED' },
  _avg: {
    // Calculate days between createdAt and approvedAt
  }
});
```

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue: User applies twice

**Solution**: Check for existing PENDING/APPROVED application before creating new one

### Issue: Vendor suspended but products still visible

**Solution**: Implement cascade suspension in `suspendVendor()` function

### Issue: Rate limit not working

**Solution**: Ensure LRU cache is properly configured and token is unique per user

### Issue: Email notifications not sending

**Solution**: Verify SMTP credentials and test email service separately

---

## 📚 NEXT STEPS

After basic implementation:

1. Add document verification system
2. Implement vendor tiers (BASIC, PREMIUM)
3. Add vendor analytics dashboard
4. Create vendor onboarding wizard
5. Add automated compliance checks
6. Implement vendor performance scoring
7. Add bulk approval tools for admins
8. Create vendor appeal process

