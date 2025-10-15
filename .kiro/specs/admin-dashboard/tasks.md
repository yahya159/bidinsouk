# Implementation Plan

- [x] 1. Database schema updates and activity logging foundation





  - Add new fields to AuditLog model (ipAddress, userAgent, action, metadata) with proper indexes
  - Create PlatformSettings model for system configuration
  - Run Prisma migration to update database schema
  - _Requirements: 6.1, 6.2, 7.1_

- [x] 2. Activity logging system implementation




  - [x] 2.1 Create IP address extraction utility


    - Implement getClientIp function to extract IP from various headers (x-forwarded-for, x-real-ip, cf-connecting-ip)
    - Handle IPv4 and IPv6 formats
    - _Requirements: 6.1_

  - [x] 2.2 Implement ActivityLogger service


    - Create log method that captures userId, action, entity, entityId, IP, userAgent, and metadata
    - Implement getUserActivity method with filtering support
    - Implement getSystemActivity method for admin-wide logs
    - Implement exportLogs method for CSV and JSON export
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.8_

  - [x] 2.3 Create activity logging middleware


    - Wrap API routes to automatically log admin actions
    - Extract request metadata (IP, user agent) from Next.js request object
    - _Requirements: 6.1_

- [x] 3. Admin authentication and authorization middleware





  - [x] 3.1 Create admin auth guard middleware


    - Verify user has ADMIN role using NextAuth session
    - Redirect non-admin users to unauthorized page
    - Log unauthorized access attempts
    - _Requirements: 9.1, 9.2_

  - [x] 3.2 Implement permission checking utilities


    - Create isAdmin helper function
    - Create requireAdmin middleware for API routes
    - Add session timeout handling
    - _Requirements: 9.1, 9.4_

- [x] 4. Admin layout and navigation components




  - [x] 4.1 Create AdminSidebar component using Mantine NavLink


    - Implement navigation menu with icons for all admin sections
    - Add active state highlighting
    - Use Mantine Stack and NavLink components
    - _Requirements: 1.4_

  - [x] 4.2 Create AdminHeader component using Mantine Header and Menu


    - Display admin user info with avatar
    - Add user menu dropdown with logout option
    - Include breadcrumb navigation using Mantine Breadcrumbs
    - _Requirements: 9.4_

  - [x] 4.3 Update admin layout wrapper


    - Integrate AdminSidebar and AdminHeader
    - Add admin auth guard
    - Use Mantine AppShell for responsive layout
    - _Requirements: 9.1_

- [x] 5. Shared admin components





  - [x] 5.1 Create reusable DataTable component using Mantine Table


    - Implement pagination with Mantine Pagination
    - Add sorting functionality with column headers
    - Add row selection with Mantine Checkbox
    - Implement search with Mantine TextInput
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.2_

  - [x] 5.2 Create FilterPanel component using Mantine Drawer


    - Build dynamic filter form with Mantine inputs
    - Add date range picker using Mantine DatePickerInput
    - Add filter chips display using Mantine Badge
    - _Requirements: 2.2, 3.2, 4.2, 5.2, 6.3_

  - [x] 5.3 Create BulkActions component using Mantine ActionIcon and Menu


    - Implement bulk action toolbar
    - Add confirmation dialog using Mantine Modal
    - Display operation results with Mantine Notification
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 5.4 Create ConfirmDialog component using Mantine Modal


    - Build reusable confirmation modal
    - Add customizable title, message, and action buttons
    - _Requirements: 9.3, 10.2_

  - [x] 5.5 Create StatsCard component using Mantine Card and Group


    - Display metric value, label, and trend indicator
    - Add icon support
    - Use Mantine Text and ThemeIcon
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 6. Dashboard overview page






  - [x] 6.1 Create API route for dashboard statistics

    - Implement /api/admin/analytics/overview endpoint
    - Calculate user counts (total, new today, active, by role)
    - Calculate product counts (total, active, draft, archived)
    - Calculate auction counts (total, running, ending soon, ended today)
    - Calculate order counts and revenue (total, pending, today)
    - Log dashboard access
    - _Requirements: 1.1, 1.2, 1.3_


  - [x] 6.2 Build dashboard overview page using Mantine Grid

    - Display stats cards in responsive grid layout
    - Create RecentActivity widget using Mantine Timeline
    - Create QuickActions widget using Mantine Button and Group
    - Create AlertsWidget using Mantine Alert
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 7. User management implementation





  - [x] 7.1 Create user management API routes


    - Implement GET /api/admin/users with pagination, search, and filters
    - Implement POST /api/admin/users for user creation
    - Implement GET /api/admin/users/[id] for user details
    - Implement PUT /api/admin/users/[id] for user updates
    - Implement DELETE /api/admin/users/[id] for user deletion
    - Implement GET /api/admin/users/[id]/activity for user activity logs
    - Log all user management actions with IP addresses
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 6.6_


  - [x] 7.2 Create UsersTable component using Mantine Table

    - Display users with name, email, role, status, registration date
    - Add search by name/email using Mantine TextInput
    - Add role filter using Mantine Select
    - Add status filter (active/suspended) using Mantine SegmentedControl
    - Implement pagination
    - Add row click to navigate to user detail
    - _Requirements: 2.1, 2.2_


  - [x] 7.3 Create UserForm component using Mantine form inputs

    - Build form with TextInput for name, email, phone
    - Add Select for role selection
    - Add PasswordInput for password (create only)
    - Add Select for locale
    - Implement form validation using Mantine form hooks
    - _Requirements: 2.4, 2.5_

  - [x] 7.4 Create users list page


    - Integrate UsersTable component
    - Add "Create User" button using Mantine Button
    - Add bulk actions for status updates
    - _Requirements: 2.1, 2.2, 10.1, 10.2_


  - [x] 7.5 Create user detail page

    - Display user information using Mantine Card and Grid
    - Show user activity history using ActivityLogsTable
    - Add action buttons (Edit, Suspend/Activate, Delete) using Mantine Button Group
    - _Requirements: 2.3, 6.6_

  - [x] 7.6 Create user create/edit pages


    - Integrate UserForm component
    - Handle form submission with loading states using Mantine Loader
    - Show success/error notifications using Mantine notifications
    - _Requirements: 2.4, 2.5_

- [x] 8. Product management implementation





  - [x] 8.1 Create product management API routes


    - Implement GET /api/admin/products with pagination, search, and filters
    - Implement POST /api/admin/products for product creation
    - Implement GET /api/admin/products/[id] for product details
    - Implement PUT /api/admin/products/[id] for product updates
    - Implement DELETE /api/admin/products/[id] for product deletion
    - Log all product management actions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 8.2 Create ProductsTable component using Mantine Table


    - Display products with title, vendor, price, status, creation date
    - Add search by title using Mantine TextInput
    - Add filters for vendor, category, status using Mantine Select
    - Add price range filter using Mantine NumberInput
    - Implement pagination
    - _Requirements: 3.1, 3.2_

  - [x] 8.3 Create ProductForm component using Mantine form inputs


    - Build form with TextInput for title, brand
    - Add Textarea for description
    - Add Select for store, category, condition, status
    - Add NumberInput for price and compareAtPrice
    - Add FileInput for image uploads
    - Add TagsInput for product tags
    - _Requirements: 3.4, 3.5_

  - [x] 8.4 Create products list page


    - Integrate ProductsTable component
    - Add "Create Product" button
    - Add bulk actions for status updates and deletion
    - _Requirements: 3.1, 3.2, 10.1, 10.2_

  - [x] 8.5 Create product detail page


    - Display product information using Mantine Card
    - Show product images using Mantine Image carousel
    - Display vendor information
    - Add action buttons (Edit, Change Status, Delete)
    - _Requirements: 3.3_

  - [x] 8.6 Create product create/edit pages


    - Integrate ProductForm component
    - Handle image uploads
    - Show success/error notifications
    - _Requirements: 3.4, 3.5_

- [x] 9. Auction management implementation




  - [x] 9.1 Create auction management API routes


    - Implement GET /api/admin/auctions with pagination, search, and filters
    - Implement POST /api/admin/auctions for auction creation
    - Implement GET /api/admin/auctions/[id] for auction details with bid history
    - Implement PUT /api/admin/auctions/[id] for auction updates
    - Implement DELETE /api/admin/auctions/[id] for auction deletion
    - Implement POST /api/admin/auctions/[id]/extend for auction extension
    - Implement POST /api/admin/auctions/[id]/end for early auction ending
    - Log all auction management actions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 9.2 Create AuctionsTable component using Mantine Table


    - Display auctions with product, current bid, status, end time
    - Add search by product name using Mantine TextInput
    - Add filters for vendor, status, category using Mantine Select
    - Add date range filter using Mantine DatePickerInput
    - Implement pagination
    - Add status badges using Mantine Badge
    - _Requirements: 4.1, 4.2_

  - [x] 9.3 Create AuctionForm component using Mantine form inputs


    - Build form with TextInput for title
    - Add Textarea for description
    - Add Select for product, store, category
    - Add NumberInput for startPrice, reservePrice, minIncrement
    - Add DateTimePicker for startAt and endAt
    - Add Switch for autoExtend feature
    - _Requirements: 4.4, 4.5_

  - [x] 9.4 Create BidHistoryTable component using Mantine Table


    - Display bids with bidder, amount, timestamp
    - Show bidder information
    - Highlight winning bid using Mantine highlight color
    - _Requirements: 4.3_

  - [x] 9.5 Create auctions list page


    - Integrate AuctionsTable component
    - Add "Create Auction" button
    - Add bulk actions for status updates
    - _Requirements: 4.1, 4.2, 10.1_

  - [x] 9.6 Create auction detail page


    - Display auction information using Mantine Card
    - Show BidHistoryTable component
    - Display auction timeline using Mantine Timeline
    - Add action buttons (Edit, Extend, End Early, Delete)
    - _Requirements: 4.3_

  - [x] 9.7 Create auction create/edit pages


    - Integrate AuctionForm component
    - Validate date ranges
    - Show success/error notifications
    - _Requirements: 4.4, 4.5_

- [x] 10. Order management implementation





  - [x] 10.1 Create order management API routes


    - Implement GET /api/admin/orders with pagination, search, and filters
    - Implement GET /api/admin/orders/[id] for order details
    - Implement PUT /api/admin/orders/[id] for status updates
    - Implement POST /api/admin/orders/[id]/refund for refund processing
    - Log all order management actions
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 10.2 Create OrdersTable component using Mantine Table


    - Display orders with order number, buyer, seller, amount, status, date
    - Add search by order number using Mantine TextInput
    - Add filters for buyer, seller, status using Mantine Select
    - Add date range and amount range filters
    - Implement pagination
    - Add status badges using Mantine Badge
    - _Requirements: 5.1, 5.2_

  - [x] 10.3 Create OrderDetailCard component using Mantine Card


    - Display order information in organized sections
    - Show order items list
    - Display payment information
    - Show shipping details
    - Display order timeline using Mantine Timeline
    - _Requirements: 5.3_

  - [x] 10.4 Create OrderStatusUpdate component using Mantine Select and Modal


    - Build status update form
    - Validate status transitions
    - Add notes field using Mantine Textarea
    - _Requirements: 5.4_

  - [x] 10.5 Create orders list page


    - Integrate OrdersTable component
    - Add export functionality using Mantine Button
    - _Requirements: 5.1, 5.2_

  - [x] 10.6 Create order detail page


    - Integrate OrderDetailCard component
    - Add OrderStatusUpdate component
    - Add refund button with confirmation
    - Add dispute resolution section using Mantine Textarea
    - _Requirements: 5.3, 5.4, 5.5, 5.6_


- [x] 11. Store management enhancement




  - [x] 11.1 Create store management API routes


    - Implement GET /api/admin/stores with pagination and filters
    - Implement POST /api/admin/stores for store creation
    - Implement GET /api/admin/stores/[id] for store details
    - Implement PUT /api/admin/stores/[id] for store updates
    - Implement DELETE /api/admin/stores/[id] for store deletion
    - Enhance existing approve/reject endpoints with activity logging
    - _Requirements: 2.1, 2.4, 2.5, 2.6_

  - [x] 11.2 Create StoresTable component using Mantine Table


    - Display stores with name, seller, status, creation date
    - Add search and filters
    - Add status badges
    - Implement pagination
    - _Requirements: 2.1_

  - [x] 11.3 Create StoreForm component using Mantine form inputs


    - Build form with TextInput for name, description
    - Add Select for seller
    - Add FileInput for logo upload
    - Add Switch for status toggle
    - _Requirements: 2.4, 2.5_

  - [x] 11.4 Enhance stores list page


    - Integrate StoresTable component
    - Add "Create Store" button
    - Add bulk approval/rejection actions
    - _Requirements: 2.1, 10.1_

  - [x] 11.5 Create store detail page


    - Display store information using Mantine Card
    - Show associated products and auctions
    - Add action buttons (Edit, Approve/Reject, Delete)
    - _Requirements: 2.3_

  - [x] 11.6 Create store create/edit pages


    - Integrate StoreForm component
    - Handle logo uploads
    - Show success/error notifications
    - _Requirements: 2.4, 2.5_

- [x] 12. Activity logs interface






  - [x] 12.1 Create ActivityLogsTable component using Mantine Table

    - Display logs with actor, action, entity, IP address, timestamp
    - Add search by actor name or email using Mantine TextInput
    - Add filters for action type, entity type, IP address using Mantine Select
    - Add date range filter using Mantine DatePickerInput
    - Implement pagination
    - Add expandable rows to show metadata using Mantine Accordion
    - _Requirements: 6.2, 6.3, 6.4, 6.5_


  - [x] 12.2 Create LogDetailCard component using Mantine Card

    - Display complete log entry details
    - Show formatted metadata using Mantine Code
    - Display user agent information
    - Show before/after diff if available using Mantine JsonInput
    - _Requirements: 6.4_

  - [x] 12.3 Create LogFilters component using Mantine Drawer


    - Build advanced filter form
    - Add multi-select for action types using Mantine MultiSelect
    - Add IP address search with autocomplete
    - Add date range picker
    - _Requirements: 6.3, 6.5_

  - [x] 12.4 Create activity logs list page


    - Integrate ActivityLogsTable component
    - Add LogFilters component
    - Add export button for CSV/JSON using Mantine Button with Menu
    - Add real-time updates indicator using Mantine Indicator
    - _Requirements: 6.2, 6.3, 6.8_

  - [x] 12.5 Create activity log detail page


    - Integrate LogDetailCard component
    - Add navigation to related entity
    - Show actor profile link
    - _Requirements: 6.4_


  - [x] 12.6 Implement log export functionality

    - Create export API endpoint
    - Generate CSV format with all log fields
    - Generate JSON format with full metadata
    - Add download trigger
    - _Requirements: 6.8_

- [x] 13. Analytics and reporting




  - [x] 13.1 Create analytics API routes


    - Implement GET /api/admin/analytics/users for user metrics
    - Implement GET /api/admin/analytics/revenue for financial metrics
    - Implement GET /api/admin/analytics/products for product metrics
    - Support date range parameters
    - Calculate trends and comparisons
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 13.2 Create chart components using Recharts with Mantine styling


    - Create LineChart component for trends
    - Create BarChart component for comparisons
    - Create PieChart component for distributions
    - Create AreaChart component for cumulative metrics
    - Apply Mantine theme colors to charts
    - _Requirements: 8.1_

  - [x] 13.3 Create UserAnalytics component


    - Display registration trends chart
    - Show active users chart
    - Display user engagement metrics using Mantine Grid
    - Add role distribution pie chart
    - _Requirements: 8.3_

  - [x] 13.4 Create RevenueAnalytics component


    - Display revenue trends line chart
    - Show transaction volume bar chart
    - Display commission earnings
    - Add comparison with previous period using Mantine Text with color
    - _Requirements: 8.4_

  - [x] 13.5 Create ProductAnalytics component


    - Display popular categories chart
    - Show top-selling products table
    - Display inventory trends
    - Add category distribution pie chart
    - _Requirements: 8.5_

  - [x] 13.6 Create analytics page


    - Add date range selector using Mantine DatePickerInput
    - Integrate UserAnalytics component
    - Integrate RevenueAnalytics component
    - Integrate ProductAnalytics component
    - Add export report button using Mantine Button
    - Use Mantine Tabs to organize analytics sections
    - _Requirements: 8.1, 8.2, 8.6_

- [x] 14. Platform settings management





  - [x] 14.1 Create settings API routes


    - Implement GET /api/admin/settings to fetch all settings
    - Implement PUT /api/admin/settings to update settings
    - Organize settings by category (auction, user, payment, general)
    - Log all settings changes with before/after values
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 14.2 Create settings form components using Mantine inputs


    - Create AuctionSettings section with NumberInput for defaults
    - Create UserSettings section with Switch for policies
    - Create PaymentSettings section with NumberInput for rates
    - Create GeneralSettings section with various inputs
    - Use Mantine Accordion to organize settings by category
    - _Requirements: 7.3, 7.4_

  - [x] 14.3 Create settings page


    - Integrate settings form components
    - Add save button with confirmation using Mantine Modal
    - Show last updated info using Mantine Text
    - Display success/error notifications
    - Add reset to defaults button using Mantine Button
    - _Requirements: 7.1, 7.2, 7.5_

- [x] 15. Abuse reports management




  - [x] 15.1 Create abuse reports API routes


    - Implement GET /api/admin/reports with pagination and filters
    - Implement GET /api/admin/reports/[id] for report details
    - Implement PUT /api/admin/reports/[id] for status updates
    - Log all report management actions
    - _Requirements: 3.8, 4.8_

  - [x] 15.2 Create ReportsTable component using Mantine Table


    - Display reports with reporter, reported item, reason, status, date
    - Add filters for status and type using Mantine Select
    - Add priority badges using Mantine Badge
    - Implement pagination
    - _Requirements: 3.8, 4.8_

  - [x] 15.3 Create ReportDetailCard component using Mantine Card


    - Display report details
    - Show reported content
    - Display reporter and reported user info
    - Add action buttons (Resolve, Dismiss, Take Action)
    - _Requirements: 3.8, 4.8_

  - [x] 15.4 Create reports page


    - Integrate ReportsTable component
    - Add quick action buttons for common resolutions
    - _Requirements: 3.8, 4.8_
- [x] 16. Security enhancements and final integration




- [ ] 16. Security enhancements and final integration

  - [x] 16.1 Implement session timeout handling


    - Add session expiration check
    - Show warning before timeout using Mantine Modal
    - Auto-logout on timeout
    - Log session expiration events
    - _Requirements: 9.4_

  - [x] 16.2 Add confirmation dialogs for destructive actions


    - Implement confirmation for all delete operations
    - Add confirmation for bulk operations
    - Use Mantine Modal with danger styling
    - _Requirements: 9.3, 10.2_

  - [x] 16.3 Implement error boundaries


    - Create admin error boundary component
    - Add fallback UI using Mantine Alert
    - Log errors to activity log
    - _Requirements: 9.1_

  - [x] 16.4 Add loading states and skeletons


    - Implement Mantine Skeleton for loading states
    - Add Mantine Loader for async operations
    - Add progress indicators for bulk operations using Mantine Progress
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

  - [x] 16.5 Implement responsive design


    - Ensure all components work on tablet and mobile
    - Use Mantine responsive utilities
    - Test navigation on mobile using Mantine Burger menu
    - _Requirements: 1.1_


  - [x] 16.6 Add keyboard shortcuts

    - Implement common shortcuts (search, create, etc.)
    - Use Mantine Spotlight for command palette
    - Display shortcuts in help modal
    - _Requirements: 1.4_

  - [x] 16.7 Integrate all components and test end-to-end flows


    - Test complete user management flow
    - Test complete product management flow
    - Test complete auction management flow
    - Test activity logging across all operations
    - Verify all IP addresses are captured correctly
    - Test bulk operations
    - Test export functionality
    - Verify all Mantine components render correctly
    - _Requirements: All_
