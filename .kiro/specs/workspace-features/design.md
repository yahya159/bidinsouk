# Workspace Features Design Document

## Overview

The Workspace Features design extends the existing workspace architecture to include Reviews Management, Analytics Dashboard, Settings Management, Store Management, Inventory Management, and Customer Support. This design maintains consistency with the established workspace patterns while adding comprehensive business management capabilities for both vendors and administrators.

**Key Design Decisions:**
- **Role-based Access Control**: Vendors access only their own data while admins have platform-wide access
- **Responsive Design**: All interfaces are optimized for desktop, tablet, and mobile devices
- **Progressive Enhancement**: Core functionality works without JavaScript, enhanced features require it
- **Accessibility First**: Full keyboard navigation and screen reader support throughout
- **Performance Optimization**: Caching strategies and lazy loading for large datasets

## Architecture

### Component Structure

The workspace features follow the established workspace pattern with role-based component variations:

```
components/workspace/
├── reviews/
│   ├── ReviewsContent.tsx           # Main reviews management interface
│   ├── ReviewCard.tsx               # Individual review display with moderation
│   ├── ReviewFilters.tsx            # Advanced filtering (status, rating, date, product)
│   ├── ReviewActions.tsx            # Approve/reject/flag actions
│   ├── ReviewResponseModal.tsx      # Vendor response interface
│   ├── SpamDetection.tsx           # Spam score indicators and alerts
│   └── ReviewBulkActions.tsx       # Bulk moderation operations
├── analytics/
│   ├── AnalyticsContent.tsx         # Main analytics dashboard
│   ├── KPICards.tsx                # Revenue, orders, conversion rate, AOV
│   ├── SalesChart.tsx              # Time-based sales performance
│   ├── TrafficChart.tsx            # Customer behavior and traffic
│   ├── ProductPerformance.tsx      # Product rankings and insights
│   ├── DateRangeFilter.tsx         # Date and category filtering
│   ├── ReportExport.tsx            # CSV/PDF export functionality
│   └── AnalyticsCache.tsx          # Performance optimization component
├── settings/
│   ├── SettingsContent.tsx          # Main settings router
│   ├── StoreSettings.tsx           # Store profile and branding
│   ├── BusinessSettings.tsx        # Hours, policies, status management
│   ├── AccountSettings.tsx         # Personal information and contacts
│   ├── SecuritySettings.tsx        # Password, 2FA, login history
│   ├── NotificationSettings.tsx    # Email and push preferences
│   ├── PaymentSettings.tsx         # Payout methods and tax info
│   └── AdminSettings.tsx           # Platform-wide admin controls
├── inventory/
│   ├── InventoryContent.tsx         # Main inventory dashboard
│   ├── StockTable.tsx              # Product stock levels display
│   ├── BulkStockUpdate.tsx         # Bulk inventory operations
│   ├── VariantManager.tsx          # Size, color, variant management
│   ├── StockAlerts.tsx             # Low stock notifications
│   ├── InventoryHistory.tsx        # Stock movement tracking
│   └── ReorderSuggestions.tsx      # Automated reorder point alerts
└── support/
    ├── SupportContent.tsx           # Customer support dashboard
    ├── TicketList.tsx              # Support ticket management
    ├── TicketDetail.tsx            # Individual ticket conversation
    ├── MessageTemplates.tsx        # Canned response library
    ├── SupportMetrics.tsx          # Response times and satisfaction
    ├── TicketPriority.tsx          # Priority level management
    └── OrderProductLink.tsx        # Context linking to orders/products
```

### Page Integration

```
app/(workspace)/
├── reviews/
│   └── page.tsx                     # Reviews management with filtering
├── analytics/
│   └── page.tsx                     # Analytics dashboard with date ranges
├── settings/
│   ├── page.tsx                     # Settings navigation hub
│   ├── store/
│   │   └── page.tsx                # Store profile and branding
│   ├── business/
│   │   └── page.tsx                # Business hours and policies
│   ├── account/
│   │   └── page.tsx                # Personal account settings
│   ├── security/
│   │   └── page.tsx                # Security and login history
│   ├── notifications/
│   │   └── page.tsx                # Notification preferences
│   ├── payments/
│   │   └── page.tsx                # Payout and tax settings
│   └── admin/
│       └── page.tsx                # Platform admin settings (admin only)
├── inventory/
│   ├── page.tsx                     # Inventory overview with alerts
│   └── history/
│       └── page.tsx                # Stock movement history
└── support/
    ├── page.tsx                     # Support tickets dashboard
    ├── [ticketId]/
    │   └── page.tsx                # Individual ticket conversation
    └── templates/
        └── page.tsx                # Message template management
```

### API Endpoints

```
app/api/vendors/
├── reviews/
│   ├── route.ts                     # GET: List with filters, POST: Respond
│   ├── [id]/
│   │   ├── route.ts                # GET: Details, PUT: Moderate (approve/reject/flag)
│   │   └── response/
│   │       └── route.ts            # POST: Add vendor response
│   ├── bulk/
│   │   └── route.ts                # POST: Bulk moderation actions
│   └── spam/
│       └── route.ts                # GET: Spam detection scores
├── analytics/
│   ├── route.ts                     # GET: KPIs and overview
│   ├── sales/
│   │   └── route.ts                # GET: Time-based sales data
│   ├── traffic/
│   │   └── route.ts                # GET: Customer behavior analytics
│   ├── products/
│   │   └── route.ts                # GET: Product performance rankings
│   ├── export/
│   │   └── route.ts                # POST: Export CSV/PDF reports
│   └── cache/
│       └── route.ts                # GET: Cached analytics data
├── settings/
│   ├── store/
│   │   └── route.ts                # GET/PUT: Store profile and branding
│   ├── business/
│   │   └── route.ts                # GET/PUT: Hours, policies, status
│   ├── account/
│   │   └── route.ts                # GET/PUT: Personal information
│   ├── security/
│   │   ├── route.ts                # GET/PUT: Security settings
│   │   ├── password/
│   │   │   └── route.ts            # PUT: Change password
│   │   ├── 2fa/
│   │   │   └── route.ts            # POST/DELETE: Enable/disable 2FA
│   │   └── history/
│   │       └── route.ts            # GET: Login history
│   ├── notifications/
│   │   └── route.ts                # GET/PUT: Email and push preferences
│   └── payments/
│       └── route.ts                # GET/PUT: Payout methods and tax info
├── inventory/
│   ├── route.ts                     # GET: Inventory overview with alerts
│   ├── stock/
│   │   ├── route.ts                # PUT: Update stock levels
│   │   └── bulk/
│   │       └── route.ts            # PUT: Bulk stock updates
│   ├── variants/
│   │   └── route.ts                # GET/POST/PUT: Product variants
│   ├── alerts/
│   │   └── route.ts                # GET: Low stock alerts
│   ├── history/
│   │   └── route.ts                # GET: Stock movement history
│   └── reorder/
│       └── route.ts                # GET: Reorder suggestions
└── support/
    ├── route.ts                     # GET: Support tickets with filters
    ├── [ticketId]/
    │   ├── route.ts                # GET/PUT: Ticket details and status
    │   └── messages/
    │       └── route.ts            # POST: Add message to ticket
    ├── templates/
    │   └── route.ts                # GET/POST/PUT: Message templates
    ├── metrics/
    │   └── route.ts                # GET: Response times and satisfaction
    └── priority/
        └── route.ts                # PUT: Update ticket priority

app/api/admin/
├── settings/
│   ├── platform/
│   │   └── route.ts                # GET/PUT: Site-wide policies
│   ├── users/
│   │   └── route.ts                # GET/PUT: User roles and permissions
│   ├── system/
│   │   └── route.ts                # GET/PUT: Payment gateways, integrations
│   ├── content/
│   │   └── route.ts                # GET/PUT: Content moderation settings
│   └── health/
│       └── route.ts                # GET: System performance and logs
└── moderation/
    ├── reviews/
    │   └── route.ts                # GET/PUT: Platform-wide review moderation
    ├── auctions/
    │   └── route.ts                # GET/PUT: Auction content moderation
    └── users/
        └── route.ts                # GET/PUT: User-generated content moderation
```

## Components and Interfaces

### Core Data Models

```typescript
interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  verified: boolean;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  product: {
    id: string;
    title: string;
    image: string;
  };
  createdAt: string;
  updatedAt: string;
  vendorResponse?: {
    message: string;
    createdAt: string;
  };
  spamScore?: number;
  moderationHistory?: {
    action: string;
    moderator: string;
    timestamp: string;
    reason?: string;
  }[];
}

interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    conversionRate: number;
    averageOrderValue: number;
  };
  salesChart: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  trafficChart: {
    date: string;
    visitors: number;
    pageViews: number;
  }[];
  topProducts: {
    id: string;
    name: string;
    revenue: number;
    orders: number;
    views: number;
  }[];
}

interface StoreSettings {
  id: string;
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  businessHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  shippingPolicy: string;
  returnPolicy: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TEMPORARILY_CLOSED';
  autoApproveReviews: boolean;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

interface AccountSettings {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  contactInfo: {
    businessEmail?: string;
    businessPhone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  preferences: {
    language: string;
    timezone: string;
    currency: string;
  };
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginHistory: {
    timestamp: string;
    ipAddress: string;
    userAgent: string;
    location?: string;
    success: boolean;
  }[];
  activeSessions: {
    id: string;
    device: string;
    location?: string;
    lastActive: string;
    current: boolean;
  }[];
}

interface NotificationSettings {
  email: {
    newOrders: boolean;
    lowStock: boolean;
    newReviews: boolean;
    supportTickets: boolean;
    systemUpdates: boolean;
  };
  push: {
    newOrders: boolean;
    urgentSupport: boolean;
    systemAlerts: boolean;
  };
  frequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY';
}

interface PaymentSettings {
  payoutMethods: {
    id: string;
    type: 'BANK_ACCOUNT' | 'PAYPAL' | 'STRIPE';
    details: Record<string, any>;
    isDefault: boolean;
  }[];
  taxInfo: {
    taxId?: string;
    vatNumber?: string;
    businessType: string;
    taxExempt: boolean;
  };
  payoutSchedule: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
}

interface AdminSettings {
  platformPolicies: {
    reviewModeration: 'AUTO' | 'MANUAL' | 'HYBRID';
    auctionApproval: boolean;
    userVerification: boolean;
    contentFiltering: boolean;
  };
  systemSettings: {
    paymentGateways: string[];
    emailTemplates: Record<string, any>;
    integrations: Record<string, any>;
  };
  userRoles: {
    id: string;
    name: string;
    permissions: string[];
  }[];
}

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  variants?: {
    id: string;
    name: string;
    stock: number;
  }[];
  lastUpdated: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  customer: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  vendor: {
    id: string;
    name: string;
    storeName: string;
  };
  messages: {
    id: string;
    content: string;
    sender: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
    senderName: string;
    timestamp: string;
    attachments?: string[];
  }[];
  relatedOrder?: {
    id: string;
    orderNumber: string;
  };
  relatedProduct?: {
    id: string;
    name: string;
    image: string;
  };
  metrics: {
    firstResponseTime?: number;
    resolutionTime?: number;
    customerSatisfaction?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: 'GREETING' | 'RESOLUTION' | 'ESCALATION' | 'CLOSING';
  variables: string[];
  usage: number;
  createdAt: string;
}
```

### Main Interface Components

```typescript
interface ReviewsContentProps {
  user: User;
  initialReviews?: Review[];
  filters?: {
    status?: string;
    rating?: number;
    dateRange?: { start: Date; end: Date };
    product?: string;
  };
}

interface AnalyticsContentProps {
  user: User;
  initialData?: AnalyticsData;
  dateRange?: {
    start: Date;
    end: Date;
  };
  categoryFilter?: string;
}

interface SettingsContentProps {
  user: User;
  section?: 'store' | 'business' | 'account' | 'security' | 'notifications' | 'payments' | 'admin';
  initialData?: StoreSettings | AccountSettings | SecuritySettings | NotificationSettings | PaymentSettings | AdminSettings;
}

interface InventoryContentProps {
  user: User;
  initialInventory?: InventoryItem[];
  alerts?: {
    lowStock: InventoryItem[];
    outOfStock: InventoryItem[];
  };
}

interface SupportContentProps {
  user: User;
  initialTickets?: SupportTicket[];
  templates?: MessageTemplate[];
  metrics?: {
    averageResponseTime: number;
    resolutionRate: number;
    customerSatisfaction: number;
  };
}

// Accessibility and responsive design props
interface AccessibilityProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
  tabIndex?: number;
}

interface ResponsiveProps {
  breakpoint?: 'mobile' | 'tablet' | 'desktop';
  touchOptimized?: boolean;
}
```

## Data Models

### Database Schema Extensions

```sql
-- Reviews table (extends existing schema)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS spam_score DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS vendor_response TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS vendor_response_at TIMESTAMP;

-- Store settings table
CREATE TABLE IF NOT EXISTS store_settings (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  business_hours JSONB DEFAULT '{}',
  shipping_policy TEXT,
  return_policy TEXT,
  auto_approve_reviews BOOLEAN DEFAULT false,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_id)
);

-- Inventory tracking table
CREATE TABLE IF NOT EXISTS inventory (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL DEFAULT 0,
  reserved_stock INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER DEFAULT 10,
  last_restocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, variant_id)
);

-- Stock movements log
CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  inventory_id BIGINT REFERENCES inventory(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED'
  quantity INTEGER NOT NULL,
  reason VARCHAR(100),
  reference_id BIGINT, -- Order ID, return ID, etc.
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'OPEN',
  priority VARCHAR(10) DEFAULT 'MEDIUM',
  customer_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  vendor_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  related_order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  related_product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support ticket messages
CREATE TABLE IF NOT EXISTS support_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  sender_type VARCHAR(10) NOT NULL, -- 'CUSTOMER', 'VENDOR', 'ADMIN'
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics cache table
CREATE TABLE IF NOT EXISTS analytics_cache (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,
  date_range VARCHAR(20) NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, metric_type, date_range)
);
```

### Prisma Model Updates

```typescript
model Review {
  // ... existing fields
  spamScore       Decimal?  @map("spam_score") @db.Decimal(3,2)
  verified        Boolean   @default(false)
  vendorResponse  String?   @map("vendor_response")
  vendorResponseAt DateTime? @map("vendor_response_at")
}

model StoreSettings {
  id                  BigInt   @id @default(autoincrement())
  storeId             BigInt   @unique @map("store_id")
  businessHours       Json     @default("{}") @map("business_hours")
  shippingPolicy      String?  @map("shipping_policy")
  returnPolicy        String?  @map("return_policy")
  autoApproveReviews  Boolean  @default(false) @map("auto_approve_reviews")
  lowStockThreshold   Int      @default(10) @map("low_stock_threshold")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  
  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  @@map("store_settings")
}

model Inventory {
  id              BigInt    @id @default(autoincrement())
  productId       BigInt    @map("product_id")
  variantId       BigInt?   @map("variant_id")
  currentStock    Int       @default(0) @map("current_stock")
  reservedStock   Int       @default(0) @map("reserved_stock")
  reorderPoint    Int       @default(10) @map("reorder_point")
  lastRestockedAt DateTime? @map("last_restocked_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  product       Product           @relation(fields: [productId], references: [id], onDelete: Cascade)
  variant       ProductVariant?   @relation(fields: [variantId], references: [id], onDelete: Cascade)
  stockMovements StockMovement[]
  
  @@unique([productId, variantId])
  @@map("inventory")
}

model StockMovement {
  id           BigInt    @id @default(autoincrement())
  inventoryId  BigInt    @map("inventory_id")
  movementType String    @map("movement_type")
  quantity     Int
  reason       String?
  referenceId  BigInt?   @map("reference_id")
  createdBy    BigInt?   @map("created_by")
  createdAt    DateTime  @default(now()) @map("created_at")
  
  inventory Inventory @relation(fields: [inventoryId], references: [id], onDelete: Cascade)
  creator   User?     @relation(fields: [createdBy], references: [id], onDelete: SetNull)
  
  @@map("stock_movements")
}

model SupportTicket {
  id               BigInt   @id @default(autoincrement())
  ticketNumber     String   @unique @map("ticket_number")
  subject          String
  status           String   @default("OPEN")
  priority         String   @default("MEDIUM")
  customerId       BigInt   @map("customer_id")
  vendorId         BigInt   @map("vendor_id")
  relatedOrderId   BigInt?  @map("related_order_id")
  relatedProductId BigInt?  @map("related_product_id")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  
  customer       User              @relation("CustomerTickets", fields: [customerId], references: [id], onDelete: Cascade)
  vendor         User              @relation("VendorTickets", fields: [vendorId], references: [id], onDelete: Cascade)
  relatedOrder   Order?            @relation(fields: [relatedOrderId], references: [id], onDelete: SetNull)
  relatedProduct Product?          @relation(fields: [relatedProductId], references: [id], onDelete: SetNull)
  messages       SupportMessage[]
  
  @@map("support_tickets")
}

model SupportMessage {
  id          BigInt   @id @default(autoincrement())
  ticketId    BigInt   @map("ticket_id")
  senderId    BigInt?  @map("sender_id")
  senderType  String   @map("sender_type")
  content     String
  attachments Json     @default("[]")
  createdAt   DateTime @default(now()) @map("created_at")
  
  ticket SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  sender User?         @relation(fields: [senderId], references: [id], onDelete: SetNull)
  
  @@map("support_messages")
}
```

## Error Handling

### Client-Side Error Management

```typescript
interface WorkspaceError {
  type: 'NETWORK' | 'VALIDATION' | 'PERMISSION' | 'BUSINESS_RULE' | 'FILE_UPLOAD';
  message: string;
  field?: string;
  code?: string;
}

const handleWorkspaceError = (error: WorkspaceError, context: string) => {
  switch (error.type) {
    case 'NETWORK':
      notifications.show({
        title: 'Erreur de connexion',
        message: 'Vérifiez votre connexion internet',
        color: 'red',
      });
      break;
    case 'FILE_UPLOAD':
      notifications.show({
        title: 'Erreur de téléchargement',
        message: error.message,
        color: 'red',
      });
      break;
    case 'BUSINESS_RULE':
      notifications.show({
        title: 'Action non autorisée',
        message: error.message,
        color: 'orange',
      });
      break;
  }
};
```

## Testing Strategy

### Unit Testing

```typescript
describe('ReviewsContent', () => {
  it('should display reviews with proper filtering', () => {
    // Test review display and filtering
  });
  
  it('should handle review moderation actions', () => {
    // Test approve/reject/flag actions
  });
});

describe('AnalyticsContent', () => {
  it('should display KPIs correctly', () => {
    // Test analytics data display
  });
  
  it('should handle date range filtering', () => {
    // Test date filtering
  });
});
```

### Integration Testing

```typescript
describe('Workspace Features Integration', () => {
  it('should navigate between workspace sections', () => {
    // Test navigation flow
  });
  
  it('should maintain consistent user experience', () => {
    // Test UX consistency
  });
});
```

## Performance Optimizations

### Caching Strategy

```typescript
// Analytics data caching
const cacheAnalyticsData = async (vendorId: string, data: AnalyticsData, range: string) => {
  await redis.setex(
    `analytics:${vendorId}:${range}`,
    3600, // 1 hour
    JSON.stringify(data)
  );
};

// Inventory data optimization
const optimizeInventoryQueries = () => {
  // Use database indexes for frequent queries
  // Implement pagination for large inventories
  // Cache frequently accessed inventory data
};
```

## Security Considerations

### Access Control

```typescript
const checkWorkspaceAccess = (user: User, resource: string, operation: string) => {
  // Vendors can only access their own data
  if (user.role === 'VENDOR') {
    return resource.includes(user.vendorStoreId);
  }
  
  // Admins have full access
  if (user.role === 'ADMIN') {
    return true;
  }
  
  return false;
};
```

### Data Privacy

```typescript
const sanitizeCustomerData = (data: any, requestingUser: User) => {
  if (requestingUser.role !== 'ADMIN') {
    // Remove sensitive customer information
    return {
      ...data,
      email: data.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      phone: data.phone?.replace(/(.{3}).*(.{2})/, '$1***$2'),
    };
  }
  return data;
};
```

## Accessibility Features

**Design Rationale**: Full accessibility compliance ensures the platform is usable by all vendors and administrators, including those with disabilities. This expands market reach and meets legal requirements.

### Keyboard Navigation

```typescript
const useWorkspaceKeyboardShortcuts = () => {
  useHotkeys([
    ['ctrl+shift+r', () => router.push('/workspace/reviews')],
    ['ctrl+shift+a', () => router.push('/workspace/analytics')],
    ['ctrl+shift+s', () => router.push('/workspace/settings')],
    ['ctrl+shift+i', () => router.push('/workspace/inventory')],
    ['ctrl+shift+t', () => router.push('/workspace/support')],
    ['escape', () => closeModals()],
    ['tab', () => focusNextElement()],
    ['shift+tab', () => focusPreviousElement()],
  ]);
};

// Focus management for modals and complex interactions
const useFocusManagement = () => {
  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    firstElement?.focus();
    
    return (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
  };
};
```

### Screen Reader Support

```typescript
const WorkspaceSection = ({ 
  title, 
  children, 
  description 
}: { 
  title: string; 
  children: React.ReactNode;
  description?: string;
}) => (
  <section
    role="main"
    aria-labelledby={`${title.toLowerCase()}-heading`}
    aria-describedby={description ? `${title.toLowerCase()}-description` : undefined}
  >
    <h1 id={`${title.toLowerCase()}-heading`} className="sr-only">
      {title}
    </h1>
    {description && (
      <p id={`${title.toLowerCase()}-description`} className="sr-only">
        {description}
      </p>
    )}
    {children}
  </section>
);

// Live region for dynamic updates
const LiveRegion = ({ message, priority = 'polite' }: { 
  message: string; 
  priority?: 'polite' | 'assertive' 
}) => (
  <div
    aria-live={priority}
    aria-atomic="true"
    className="sr-only"
  >
    {message}
  </div>
);
```

### Touch and Mobile Accessibility

```typescript
const TouchOptimizedButton = ({ 
  children, 
  onClick, 
  disabled,
  ariaLabel 
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className="min-h-[44px] min-w-[44px] touch-manipulation"
    style={{ touchAction: 'manipulation' }}
  >
    {children}
  </button>
);
```

## Responsive Design and Mobile Optimization

**Design Rationale**: Mobile-first approach ensures vendors can manage their business from any device, increasing engagement and enabling real-time business management.

### Breakpoint Strategy

```typescript
const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px'
};

const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop' | 'wide'>('desktop');
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) setBreakpoint('mobile');
      else if (width < 1024) setBreakpoint('tablet');
      else if (width < 1440) setBreakpoint('desktop');
      else setBreakpoint('wide');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return breakpoint;
};
```

### Mobile-Optimized Components

```typescript
// Responsive data tables
const ResponsiveTable = ({ data, columns }: { data: any[]; columns: any[] }) => {
  const breakpoint = useResponsive();
  
  if (breakpoint === 'mobile') {
    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <Card key={index} className="p-4">
            {columns.map(column => (
              <div key={column.key} className="flex justify-between py-1">
                <span className="font-medium">{column.label}:</span>
                <span>{item[column.key]}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    );
  }
  
  return <Table data={data} columns={columns} />;
};

// Touch-optimized navigation
const MobileNavigation = ({ items }: { items: NavItem[] }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
    <div className="flex justify-around py-2">
      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col items-center p-2 min-h-[60px] min-w-[60px]"
        >
          <Icon name={item.icon} size={24} />
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </div>
  </nav>
);
```

### Progressive Enhancement

```typescript
// Offline capability for critical features
const useOfflineCapability = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sync pending actions when back online
      pendingActions.forEach(action => {
        // Execute queued actions
      });
      setPendingActions([]);
    };
    
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingActions]);
  
  return { isOnline, queueAction: (action: any) => setPendingActions(prev => [...prev, action]) };
};
```

## Admin-Specific Features

**Design Rationale**: Administrators need platform-wide visibility and control while maintaining clear separation from vendor-specific data and operations.

### Admin Dashboard Components

```typescript
interface AdminDashboardProps {
  user: User;
  platformMetrics: {
    totalVendors: number;
    totalCustomers: number;
    totalRevenue: number;
    activeAuctions: number;
    pendingReviews: number;
    openTickets: number;
  };
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    activeUsers: number;
  };
}

// Platform-wide content moderation
interface ModerationQueueProps {
  reviews: Review[];
  auctions: Auction[];
  userContent: UserContent[];
  filters: {
    type: 'all' | 'reviews' | 'auctions' | 'users';
    priority: 'all' | 'high' | 'medium' | 'low';
    status: 'all' | 'pending' | 'flagged' | 'escalated';
  };
}
```

### Role-Based Access Control

```typescript
const useRoleBasedAccess = (user: User) => {
  const canAccess = (resource: string, action: string) => {
    if (user.role === 'ADMIN') return true;
    if (user.role === 'VENDOR') {
      // Vendors can only access their own resources
      return resource.includes(user.vendorStoreId || '');
    }
    return false;
  };
  
  const canModerate = (contentType: string) => {
    return user.role === 'ADMIN' || 
           (user.role === 'VENDOR' && contentType === 'own_reviews');
  };
  
  return { canAccess, canModerate };
};
```

This design document provides a comprehensive foundation for implementing all missing workspace features while maintaining consistency with the existing architecture, ensuring full accessibility compliance, mobile optimization, and proper role-based access control for both vendors and administrators.