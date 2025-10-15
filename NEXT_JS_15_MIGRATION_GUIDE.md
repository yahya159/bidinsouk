# Next.js 15 Async Params Migration Guide

## The Problem

Next.js 15 changed route params from sync to async. All dynamic routes must now await params.

## The Pattern

### Before (Next.js 14)
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id; // Direct access
  // ...
}
```

### After (Next.js 15)
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Must await!
  // ...
}
```

## Files Requiring This Fix

### Admin Routes (13 files)
- [ ] `app/api/admin/reports/[id]/route.ts`
- [ ] `app/api/admin/auctions/[id]/route.ts`
- [ ] `app/api/admin/auctions/[id]/moderate/route.ts`  
- [ ] `app/api/admin/orders/[id]/route.ts`
- [ ] `app/api/admin/orders/[id]/refund/route.ts`
- [ ] `app/api/admin/products/[id]/route.ts`
- [ ] `app/api/admin/products/[id]/moderate/route.ts`
- [ ] `app/api/admin/users/[id]/route.ts`
- [ ] `app/api/admin/users/[id]/activity/route.ts`
- [ ] `app/api/admin/users/[id]/roles/route.ts`
- [ ] `app/api/admin/stores/[id]/route.ts`
- [ ] `app/api/admin/stores/[id]/approve/route.ts`
- [ ] `app/api/admin/stores/[id]/reject/route.ts`

### Vendor Routes (~5-7 files)
- [ ] `app/api/vendors/products/[id]/route.ts`
- [ ] `app/api/vendors/auctions/[id]/route.ts`
- [ ] `app/api/vendors/auctions/[id]/bids/route.ts`
- [ ] And more...

### Other Routes
- [ ] `app/api/auctions/[id]/route.ts`
- [ ] `app/api/auctions/[id]/bids/route.ts`
- [ ] `app/api/orders/[id]/cancel/route.ts`
- [ ] And more...

## Quick Fix Instructions

1. Find the handler signature
2. Change `params: { id: string }` → `params: Promise<{ id: string }>`
3. At the start of the function, add: `const { id } = await params`
4. Remove any `params.id` references (use the destructured `id`)
5. If multiple params, adjust accordingly: `const { id, slug } = await params`

## Automated Fix (PowerShell)

```powershell
# This needs manual review but can speed up the process
$files = Get-ChildItem -Path "app/api" -Recurse -Filter "route.ts" | 
  Where-Object { $_.FullName -match "\[id\]" }

foreach ($file in $files) {
  Write-Host "TODO: Fix $($file.FullName)"
  # Manual fix required - each file is slightly different
}
```

## Estimated Time
- Per file: 2-3 minutes
- Total (~25 files): 45-60 minutes

## Status
- Started: October 15, 2025
- Completed: 0/~25 files
- ETA: 1 hour

