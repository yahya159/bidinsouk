# Admin Dashboard Integration Test Guide

This guide provides step-by-step instructions for testing all admin dashboard features end-to-end.

## Prerequisites

1. Start the development server: `npm run dev`
2. Ensure you have an admin user account
3. Have test data in the database (users, products, auctions, orders)

## Test Execution Order

### 1. Authentication & Session Management

#### Test 1.1: Admin Login
- [ ] Navigate to `/login`
- [ ] Login with admin credentials
- [ ] Verify redirect to `/admin-dashboard`
- [ ] Verify admin layout loads correctly

#### Test 1.2: Session Timeout
- [ ] Wait 55 minutes (or temporarily reduce timeout in code for testing)
- [ ] Verify warning modal appears
- [ ] Verify countdown timer works
- [ ] Click "Stay Logged In"
- [ ] Verify modal closes and session extends
- [ ] Wait for timeout again
- [ ] Let timer expire
- [ ] Verify auto-logout occurs
- [ ] Verify redirect to login page with session expired message

#### Test 1.3: Unauthorized Access
- [ ] Logout
- [ ] Try to access `/admin-dashboard` directly
- [ ] Verify redirect to login or unauthorized page
- [ ] Login as non-admin user (CLIENT or VENDOR)
- [ ] Try to access `/admin-dashboard`
- [ ] Verify redirect to unauthorized page

### 2. Navigation & UI

#### Test 2.1: Sidebar Navigation
- [ ] Click each menu item in sidebar
- [ ] Verify correct page loads for each section:
  - Dashboard
  - Users
  - Products
  - Auctions
  - Orders
  - Stores
  - Activity Logs
  - Analytics
  - Reports
  - Settings

#### Test 2.2: Responsive Design
- [ ] Resize browser to mobile width (< 768px)
- [ ] Verify burger menu appears
- [ ] Click burger menu
- [ ] Verify sidebar opens/closes
- [ ] Navigate to different sections
- [ ] Verify tables scroll horizontally
- [ ] Resize to tablet width (768px - 1024px)
- [ ] Verify layout adapts
- [ ] Resize to desktop width (> 1024px)
- [ ] Verify full layout with sidebar visible

#### Test 2.3: Keyboard Shortcuts
- [ ] Press `Cmd/Ctrl + /`
- [ ] Verify keyboard shortcuts help modal opens
- [ ] Review all listed shortcuts
- [ ] Close modal
- [ ] Press `Cmd/Ctrl + H`
- [ ] Verify navigation to dashboard
- [ ] Press `G` then `U`
- [ ] Verify navigation to users page
- [ ] Test other navigation shortcuts (G+P, G+A, G+O, G+S)

#### Test 2.4: Loading States
- [ ] Navigate between pages
- [ ] Verify loading skeletons appear during transitions
- [ ] Verify skeletons match the page layout
- [ ] Verify smooth transition from skeleton to content

### 3. Dashboard Overview

#### Test 3.1: Statistics Display
- [ ] Navigate to dashboard
- [ ] Verify all stat cards display:
  - Total users, new today, active this week
  - Total products, active, draft, archived
  - Total auctions, running, ending soon
  - Total orders, pending, today's revenue
- [ ] Verify numbers are accurate

#### Test 3.2: Recent Activity
- [ ] Verify recent activity widget shows latest actions
- [ ] Verify activity items have timestamps
- [ ] Verify activity items show user names

#### Test 3.3: Quick Actions
- [ ] Click "Create User" quick action
- [ ] Verify navigation to user creation page
- [ ] Go back to dashboard
- [ ] Test other quick actions

### 4. User Management

#### Test 4.1: User List
- [ ] Navigate to Users page
- [ ] Verify user table displays with columns:
  - Name, Email, Role, Status, Registration Date
- [ ] Verify pagination works
- [ ] Change page size
- [ ] Verify table updates

#### Test 4.2: User Search & Filter
- [ ] Enter search term in search box
- [ ] Verify table filters in real-time
- [ ] Clear search
- [ ] Use role filter
- [ ] Verify only users with selected role show
- [ ] Use status filter
- [ ] Verify filtering works
- [ ] Use date range filter
- [ ] Verify results match filter

#### Test 4.3: User Details
- [ ] Click on a user row
- [ ] Verify navigation to user detail page
- [ ] Verify all user information displays
- [ ] Verify user activity logs show
- [ ] Verify activity logs have IP addresses

#### Test 4.4: Create User
- [ ] Click "Create User" button
- [ ] Fill in all required fields:
  - Name, Email, Password, Role
- [ ] Submit form
- [ ] Verify success notification
- [ ] Verify redirect to user list or detail page
- [ ] Verify new user appears in list
- [ ] Navigate to activity logs
- [ ] Verify USER_CREATED action is logged with IP address

#### Test 4.5: Edit User
- [ ] Navigate to user detail page
- [ ] Click "Edit" button
- [ ] Modify user information
- [ ] Save changes
- [ ] Verify success notification
- [ ] Verify changes are reflected
- [ ] Navigate to activity logs
- [ ] Verify USER_UPDATED action is logged

#### Test 4.6: Delete User (with confirmation)
- [ ] Navigate to user detail page
- [ ] Click "Delete" button
- [ ] Verify confirmation dialog appears
- [ ] Verify dialog shows:
  - Warning message
  - User name
  - "This action cannot be undone" alert
- [ ] Click "Cancel"
- [ ] Verify dialog closes, user not deleted
- [ ] Click "Delete" again
- [ ] Click "Delete" in dialog
- [ ] Verify loading state
- [ ] Verify success notification
- [ ] Verify redirect to user list
- [ ] Verify user is removed from list
- [ ] Navigate to activity logs
- [ ] Verify USER_DELETED action is logged

#### Test 4.7: Bulk User Operations
- [ ] Navigate to users page
- [ ] Select multiple users (checkboxes)
- [ ] Click bulk action button (e.g., "Suspend")
- [ ] Verify bulk confirmation dialog appears
- [ ] Verify dialog shows:
  - Item count badge
  - Action description
  - Warning if applicable
- [ ] Click "Confirm"
- [ ] Verify bulk operation progress modal appears
- [ ] Verify progress bar updates
- [ ] Verify success/failure counts
- [ ] Verify completion message
- [ ] Verify all selected users updated
- [ ] Navigate to activity logs
- [ ] Verify all operations are logged

### 5. Product Management

#### Test 5.1: Product List
- [ ] Navigate to Products page
- [ ] Verify product table displays
- [ ] Verify columns: Title, Vendor, Price, Status, Date
- [ ] Test pagination
- [ ] Test sorting by clicking column headers

#### Test 5.2: Product Search & Filter
- [ ] Search by product title
- [ ] Filter by vendor
- [ ] Filter by category
- [ ] Filter by status
- [ ] Filter by price range
- [ ] Verify all filters work correctly

#### Test 5.3: Product Details
- [ ] Click on a product
- [ ] Verify product detail page loads
- [ ] Verify all product information displays
- [ ] Verify product images display
- [ ] Verify vendor information shows

#### Test 5.4: Create Product
- [ ] Click "Create Product"
- [ ] Fill in all fields
- [ ] Upload images
- [ ] Submit form
- [ ] Verify success
- [ ] Verify product appears in list
- [ ] Verify PRODUCT_CREATED is logged

#### Test 5.5: Edit Product
- [ ] Edit a product
- [ ] Change various fields
- [ ] Save changes
- [ ] Verify updates
- [ ] Verify PRODUCT_UPDATED is logged

#### Test 5.6: Delete Product (with confirmation)
- [ ] Click delete on a product
- [ ] Verify confirmation dialog
- [ ] Confirm deletion
- [ ] Verify product removed
- [ ] Verify PRODUCT_DELETED is logged

#### Test 5.7: Bulk Product Operations
- [ ] Select multiple products
- [ ] Change status in bulk
- [ ] Verify bulk confirmation
- [ ] Verify progress modal
- [ ] Verify all products updated
- [ ] Verify all operations logged

### 6. Auction Management

#### Test 6.1: Auction List
- [ ] Navigate to Auctions page
- [ ] Verify auction table displays
- [ ] Verify columns: Product, Current Bid, Status, End Time
- [ ] Test pagination and sorting

#### Test 6.2: Auction Search & Filter
- [ ] Search by product name
- [ ] Filter by vendor
- [ ] Filter by status
- [ ] Filter by date range
- [ ] Verify filters work

#### Test 6.3: Auction Details
- [ ] Click on an auction
- [ ] Verify auction detail page
- [ ] Verify bid history table displays
- [ ] Verify all bids show with bidder info
- [ ] Verify auction timeline displays

#### Test 6.4: Create Auction
- [ ] Click "Create Auction"
- [ ] Fill in all fields
- [ ] Set start and end dates
- [ ] Submit form
- [ ] Verify success
- [ ] Verify AUCTION_CREATED is logged

#### Test 6.5: Edit Auction
- [ ] Edit an auction
- [ ] Modify fields
- [ ] Save changes
- [ ] Verify updates
- [ ] Verify AUCTION_UPDATED is logged

#### Test 6.6: Extend Auction
- [ ] On auction detail page
- [ ] Click "Extend" button
- [ ] Verify confirmation dialog
- [ ] Confirm extension
- [ ] Verify end time updated
- [ ] Verify AUCTION_EXTENDED is logged

#### Test 6.7: End Auction Early
- [ ] Click "End Early" button
- [ ] Verify confirmation dialog
- [ ] Confirm action
- [ ] Verify auction status changed
- [ ] Verify AUCTION_ENDED_EARLY is logged

#### Test 6.8: Delete Auction (with confirmation)
- [ ] Delete an auction
- [ ] Verify confirmation
- [ ] Confirm deletion
- [ ] Verify removal
- [ ] Verify AUCTION_DELETED is logged

### 7. Order Management

#### Test 7.1: Order List
- [ ] Navigate to Orders page
- [ ] Verify order table displays
- [ ] Verify columns: Order #, Buyer, Seller, Amount, Status, Date
- [ ] Test pagination

#### Test 7.2: Order Search & Filter
- [ ] Search by order number
- [ ] Filter by buyer
- [ ] Filter by seller
- [ ] Filter by status
- [ ] Filter by date range
- [ ] Filter by amount range
- [ ] Verify all filters work

#### Test 7.3: Order Details
- [ ] Click on an order
- [ ] Verify order detail page
- [ ] Verify order items display
- [ ] Verify payment information shows
- [ ] Verify shipping details display
- [ ] Verify order timeline shows

#### Test 7.4: Update Order Status
- [ ] Click "Update Status"
- [ ] Select new status
- [ ] Add notes
- [ ] Verify confirmation dialog
- [ ] Confirm update
- [ ] Verify status changed
- [ ] Verify ORDER_STATUS_UPDATED is logged

#### Test 7.5: Process Refund
- [ ] Click "Refund" button
- [ ] Verify confirmation dialog
- [ ] Confirm refund
- [ ] Verify order updated
- [ ] Verify ORDER_REFUNDED is logged

### 8. Store Management

#### Test 8.1: Store List
- [ ] Navigate to Stores page
- [ ] Verify store table displays
- [ ] Test pagination and filters

#### Test 8.2: Store Details
- [ ] Click on a store
- [ ] Verify store detail page
- [ ] Verify associated products show
- [ ] Verify associated auctions show

#### Test 8.3: Create Store
- [ ] Create a new store
- [ ] Upload logo
- [ ] Submit form
- [ ] Verify success
- [ ] Verify STORE_CREATED is logged

#### Test 8.4: Approve/Reject Store
- [ ] Navigate to pending stores
- [ ] Click "Approve" on a store
- [ ] Verify confirmation
- [ ] Confirm approval
- [ ] Verify STORE_APPROVED is logged
- [ ] Try rejecting a store
- [ ] Verify STORE_REJECTED is logged

#### Test 8.5: Delete Store (with confirmation)
- [ ] Delete a store
- [ ] Verify confirmation
- [ ] Confirm deletion
- [ ] Verify STORE_DELETED is logged

### 9. Activity Logs

#### Test 9.1: Activity Log List
- [ ] Navigate to Activity Logs page
- [ ] Verify log table displays
- [ ] Verify columns: Actor, Action, Entity, IP Address, Timestamp
- [ ] Verify pagination works

#### Test 9.2: Activity Log Filters
- [ ] Filter by actor (user)
- [ ] Filter by action type
- [ ] Filter by entity type
- [ ] Filter by IP address
- [ ] Filter by date range
- [ ] Verify all filters work
- [ ] Verify results are accurate

#### Test 9.3: Activity Log Details
- [ ] Click on a log entry
- [ ] Verify log detail page
- [ ] Verify all information displays:
  - Actor details
  - Action type
  - Entity information
  - IP address
  - User agent
  - Metadata
  - Timestamp
- [ ] Verify metadata is formatted correctly

#### Test 9.4: Export Activity Logs
- [ ] Click "Export" button
- [ ] Select CSV format
- [ ] Verify file downloads
- [ ] Open CSV file
- [ ] Verify all log data is present
- [ ] Export as JSON
- [ ] Verify JSON file downloads
- [ ] Verify JSON structure is correct

#### Test 9.5: IP Address Verification
- [ ] Perform various actions (create, edit, delete)
- [ ] Navigate to activity logs
- [ ] Verify each action has IP address captured
- [ ] Verify IP addresses are correct
- [ ] Test from different networks if possible
- [ ] Verify different IPs are captured

### 10. Analytics

#### Test 10.1: Analytics Overview
- [ ] Navigate to Analytics page
- [ ] Verify all charts load
- [ ] Verify date range selector works
- [ ] Change date range
- [ ] Verify charts update

#### Test 10.2: User Analytics
- [ ] View user analytics tab
- [ ] Verify registration trends chart
- [ ] Verify active users chart
- [ ] Verify user engagement metrics
- [ ] Verify role distribution chart

#### Test 10.3: Revenue Analytics
- [ ] View revenue analytics tab
- [ ] Verify revenue trends chart
- [ ] Verify transaction volume chart
- [ ] Verify commission earnings display
- [ ] Verify period comparison

#### Test 10.4: Product Analytics
- [ ] View product analytics tab
- [ ] Verify popular categories chart
- [ ] Verify top-selling products table
- [ ] Verify inventory trends chart

#### Test 10.5: Export Analytics Report
- [ ] Click "Export Report"
- [ ] Verify report downloads
- [ ] Verify report contains all metrics

### 11. Reports (Abuse Reports)

#### Test 11.1: Reports List
- [ ] Navigate to Reports page
- [ ] Verify reports table displays
- [ ] Test filters (status, type)
- [ ] Test pagination

#### Test 11.2: Report Details
- [ ] Click on a report
- [ ] Verify report detail page
- [ ] Verify reported content displays
- [ ] Verify reporter information shows
- [ ] Verify reported user information shows

#### Test 11.3: Resolve Report
- [ ] Click "Resolve" button
- [ ] Verify confirmation
- [ ] Confirm resolution
- [ ] Verify report status updated

#### Test 11.4: Dismiss Report
- [ ] Click "Dismiss" button
- [ ] Verify confirmation
- [ ] Confirm dismissal
- [ ] Verify report status updated

### 12. Settings

#### Test 12.1: View Settings
- [ ] Navigate to Settings page
- [ ] Verify all setting categories display:
  - Auction Settings
  - User Settings
  - Payment Settings
  - General Settings

#### Test 12.2: Update Auction Settings
- [ ] Modify auction default duration
- [ ] Modify minimum bid increment
- [ ] Modify auto-extend settings
- [ ] Click "Save"
- [ ] Verify confirmation dialog
- [ ] Confirm save
- [ ] Verify success notification
- [ ] Verify SETTINGS_UPDATED is logged
- [ ] Refresh page
- [ ] Verify settings persisted

#### Test 12.3: Update User Settings
- [ ] Modify user registration settings
- [ ] Modify verification requirements
- [ ] Save changes
- [ ] Verify updates
- [ ] Verify logging

#### Test 12.4: Update Payment Settings
- [ ] Modify commission rates
- [ ] Modify payment methods
- [ ] Save changes
- [ ] Verify updates
- [ ] Verify logging

#### Test 12.5: Reset to Defaults
- [ ] Click "Reset to Defaults"
- [ ] Verify confirmation dialog
- [ ] Confirm reset
- [ ] Verify settings reset
- [ ] Verify logging

### 13. Error Handling

#### Test 13.1: Error Boundary
- [ ] Temporarily add code to throw error in a component
- [ ] Navigate to that page
- [ ] Verify error boundary catches error
- [ ] Verify error display shows:
  - User-friendly message
  - Error details (in development)
  - Recovery options
- [ ] Click "Try Again"
- [ ] Verify error state resets
- [ ] Click "Go to Dashboard"
- [ ] Verify navigation works
- [ ] Navigate to activity logs
- [ ] Verify error was logged

#### Test 13.2: API Error Handling
- [ ] Disconnect from network
- [ ] Try to perform an action
- [ ] Verify error notification displays
- [ ] Verify user-friendly error message
- [ ] Reconnect network
- [ ] Retry action
- [ ] Verify success

#### Test 13.3: Validation Errors
- [ ] Try to create user with invalid email
- [ ] Verify validation error displays
- [ ] Try to create product with missing required fields
- [ ] Verify validation errors display
- [ ] Fix errors and submit
- [ ] Verify success

### 14. Performance

#### Test 14.1: Page Load Times
- [ ] Navigate to each major section
- [ ] Verify pages load within 2 seconds
- [ ] Verify loading skeletons appear immediately
- [ ] Verify smooth transitions

#### Test 14.2: Large Dataset Handling
- [ ] Navigate to page with 1000+ records
- [ ] Verify pagination works smoothly
- [ ] Test search performance
- [ ] Test filter performance
- [ ] Verify no lag or freezing

#### Test 14.3: Bulk Operations Performance
- [ ] Select 100+ items
- [ ] Perform bulk operation
- [ ] Verify progress modal updates smoothly
- [ ] Verify operation completes successfully
- [ ] Verify UI remains responsive

### 15. Security

#### Test 15.1: CSRF Protection
- [ ] Verify all forms have CSRF tokens
- [ ] Try to submit form without token
- [ ] Verify request is rejected

#### Test 15.2: Input Sanitization
- [ ] Try to enter XSS payload in form fields
- [ ] Verify input is sanitized
- [ ] Verify no script execution

#### Test 15.3: SQL Injection Prevention
- [ ] Try SQL injection in search fields
- [ ] Verify queries are parameterized
- [ ] Verify no SQL errors

#### Test 15.4: Authorization Checks
- [ ] Verify all API endpoints check admin role
- [ ] Try to access API endpoints without auth
- [ ] Verify 401/403 responses

## Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: ___________

| Test Section | Status | Notes |
|--------------|--------|-------|
| 1. Authentication & Session | ☐ Pass ☐ Fail | |
| 2. Navigation & UI | ☐ Pass ☐ Fail | |
| 3. Dashboard Overview | ☐ Pass ☐ Fail | |
| 4. User Management | ☐ Pass ☐ Fail | |
| 5. Product Management | ☐ Pass ☐ Fail | |
| 6. Auction Management | ☐ Pass ☐ Fail | |
| 7. Order Management | ☐ Pass ☐ Fail | |
| 8. Store Management | ☐ Pass ☐ Fail | |
| 9. Activity Logs | ☐ Pass ☐ Fail | |
| 10. Analytics | ☐ Pass ☐ Fail | |
| 11. Reports | ☐ Pass ☐ Fail | |
| 12. Settings | ☐ Pass ☐ Fail | |
| 13. Error Handling | ☐ Pass ☐ Fail | |
| 14. Performance | ☐ Pass ☐ Fail | |
| 15. Security | ☐ Pass ☐ Fail | |

Overall Status: ☐ Pass ☐ Fail

Critical Issues Found:
1. 
2. 
3. 

Minor Issues Found:
1. 
2. 
3. 
```

## Automated Testing

For automated testing, consider:
1. Playwright or Cypress for E2E tests
2. Jest for unit tests
3. React Testing Library for component tests

## Continuous Testing

- Run tests after each major change
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on multiple devices (Desktop, Tablet, Mobile)
- Test with different user roles
- Test with different data volumes
