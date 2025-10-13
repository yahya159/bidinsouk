# Vendor Apply Page Header & Footer Fix

## Problem
The vendor application page at `/vendors/apply` was missing the site header and footer, making it inconsistent with the rest of the site.

## Solution
Added the SiteHeader and Footer components to wrap all content states of the vendor application page.

## Changes Made

### 1. Added Imports
```typescript
import { SiteHeader } from '@/components/layout/SiteHeader'
import Footer from '@/components/shared/Footer'
```

### 2. Wrapped All Content States

#### Loading State
```typescript
if (status === 'loading') {
  return (
    <>
      <SiteHeader />
      <Container size="sm" py="xl">
        {/* Loading content */}
      </Container>
      <Footer />
    </>
  )
}
```

#### Success/Redirect State
```typescript
if (success || redirectToDashboard) {
  return (
    <>
      <SiteHeader />
      <Container size="sm" py="xl">
        {/* Success content */}
      </Container>
      <Footer />
    </>
  )
}
```

#### Main Form State
```typescript
return (
  <>
    <SiteHeader />
    <Container size="sm" py="xl">
      {/* Form content */}
    </Container>
    <Footer />
  </>
)
```

## Benefits

### ✅ **Consistent Navigation**
- Users can navigate back to other parts of the site
- Header includes logo, search, and user menu
- Maintains site branding throughout the application process

### ✅ **Complete User Experience**
- Footer provides additional links and information
- Professional appearance matching other pages
- No broken navigation flow

### ✅ **All States Covered**
- Loading state has header/footer
- Success state has header/footer  
- Main form state has header/footer
- Redirect state has header/footer

## File Modified
- `app/vendors/apply/page.tsx` - Added SiteHeader and Footer components

## Testing
1. Visit `/vendors/apply`
2. Verify header appears with navigation
3. Verify footer appears at bottom
4. Test form submission to ensure header/footer remain
5. Check loading and success states

## Expected Result
The vendor application page now has consistent site navigation and branding, matching the design of other pages on the site.