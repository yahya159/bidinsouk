# Auction Management Design Document

## Overview

The Auction Management feature provides a comprehensive interface for vendors and admins to manage auctions within the Bidinsouk platform. This feature integrates with the existing workspace architecture, following established patterns from the dashboard and products management systems. The design emphasizes real-time functionality, intuitive user experience, and robust auction lifecycle management.

## Architecture

### Component Structure

The auction management follows the established workspace pattern:

```
components/workspace/auctions/
├── AuctionsContent.tsx          # Main auction management interface
├── AuctionTable.tsx             # Auction listing table component
├── AuctionFilters.tsx           # Search and filter controls
├── AuctionBulkActions.tsx       # Bulk operation controls
├── AuctionStatusBadge.tsx       # Status display component
├── AuctionDetailModal.tsx       # Detailed auction view
├── BidHistoryPanel.tsx          # Bid history display
├── AuctionActions.tsx           # Individual auction actions
└── RealTimeUpdates.tsx          # WebSocket integration component
```

### Page Integration

```
app/(workspace)/auctions/
├── page.tsx                     # Main auctions page
├── [id]/
│   ├── page.tsx                # Auction detail page
│   └── edit/
│       └── page.tsx            # Auction edit page
└── new/
    └── page.tsx                # Create new auction page
```

### API Endpoints

```
app/api/vendors/auctions/
├── route.ts                     # GET: List auctions, POST: Create auction
├── [id]/
│   ├── route.ts                # GET: Auction details, PUT: Update, DELETE: Delete
│   ├── bids/
│   │   └── route.ts            # GET: Bid history
│   ├── extend/
│   │   └── route.ts            # POST: Extend auction duration
│   └── cancel/
│       └── route.ts            # POST: Cancel auction
├── bulk/
│   └── route.ts                # POST: Bulk operations
└── stats/
    └── route.ts                # GET: Auction statistics
```

## Components and Interfaces

### Core Data Models

```typescript
interface Auction {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  startingPrice: number;
  reservePrice?: number;
  currentBid: number;
  bidCount: number;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDING_SOON' | 'ENDED' | 'CANCELLED';
  startTime: Date;
  endTime: Date;
  duration: number; // in hours
  views: number;
  watchers: number;
  winnerId?: string;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string; // Anonymized for privacy
  amount: number;
  timestamp: Date;
  isWinning: boolean;
  isAutomatic: boolean;
}

interface AuctionFilters {
  search: string;
  status: string[];
  category: string;
  dateRange: {
    start?: Date;
    end?: Date;
  };
  priceRange: {
    min?: number;
    max?: number;
  };
}

interface AuctionStats {
  totalAuctions: number;
  activeAuctions: number;
  endingSoon: number;
  totalRevenue: number;
  averageBidsPerAuction: number;
  conversionRate: number;
}
```

### Main Interface Component

```typescript
interface AuctionsContentProps {
  user: User;
  initialAuctions?: Auction[];
  initialStats?: AuctionStats;
}

export function AuctionsContent({ user, initialAuctions, initialStats }: AuctionsContentProps) {
  // State management for auctions, filters, selection, real-time updates
  // Integration with WebSocket for real-time bid updates
  // Bulk operations handling
  // Pagination and sorting logic
}
```

### Real-Time Integration

```typescript
interface RealTimeAuctionUpdate {
  type: 'BID_PLACED' | 'AUCTION_ENDING' | 'AUCTION_ENDED' | 'STATUS_CHANGED';
  auctionId: string;
  data: {
    currentBid?: number;
    bidCount?: number;
    timeRemaining?: number;
    status?: AuctionStatus;
    winnerId?: string;
  };
}

// WebSocket channel: `auction-updates-${vendorId}`
// Pusher integration for real-time updates
```

## Data Models

### Database Schema Extensions

```sql
-- Auction table (extends existing schema)
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS watchers INTEGER DEFAULT 0;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS reserve_price DECIMAL(10,2);
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS auto_extend BOOLEAN DEFAULT false;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS extend_minutes INTEGER DEFAULT 5;

-- Auction views tracking
CREATE TABLE IF NOT EXISTS auction_views (
  id BIGSERIAL PRIMARY KEY,
  auction_id BIGINT REFERENCES auctions(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(auction_id, user_id, DATE(viewed_at))
);

-- Auction watchers (users following auctions)
CREATE TABLE IF NOT EXISTS auction_watchers (
  id BIGSERIAL PRIMARY KEY,
  auction_id BIGINT REFERENCES auctions(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(auction_id, user_id)
);

-- Auction activity log
CREATE TABLE IF NOT EXISTS auction_activity (
  id BIGSERIAL PRIMARY KEY,
  auction_id BIGINT REFERENCES auctions(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Prisma Model Updates

```typescript
model Auction {
  // ... existing fields
  views         Int                @default(0)
  watchers      Int                @default(0)
  reservePrice  Decimal?           @map("reserve_price") @db.Decimal(10,2)
  autoExtend    Boolean            @default(false) @map("auto_extend")
  extendMinutes Int                @default(5) @map("extend_minutes")
  
  // Relations
  auctionViews     AuctionView[]
  auctionWatchers  AuctionWatcher[]
  auctionActivity  AuctionActivity[]
}

model AuctionView {
  id        BigInt   @id @default(autoincrement())
  auctionId BigInt   @map("auction_id")
  userId    BigInt?  @map("user_id")
  ipAddress String?  @map("ip_address")
  userAgent String?  @map("user_agent")
  viewedAt  DateTime @default(now()) @map("viewed_at")
  
  auction Auction @relation(fields: [auctionId], references: [id], onDelete: Cascade)
  user    User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@unique([auctionId, userId, viewedAt(sort: Desc)])
  @@map("auction_views")
}

model AuctionWatcher {
  id        BigInt   @id @default(autoincrement())
  auctionId BigInt   @map("auction_id")
  userId    BigInt   @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")
  
  auction Auction @relation(fields: [auctionId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([auctionId, userId])
  @@map("auction_watchers")
}

model AuctionActivity {
  id        BigInt   @id @default(autoincrement())
  auctionId BigInt   @map("auction_id")
  userId    BigInt?  @map("user_id")
  action    String
  details   Json?
  createdAt DateTime @default(now()) @map("created_at")
  
  auction Auction @relation(fields: [auctionId], references: [id], onDelete: Cascade)
  user    User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@map("auction_activity")
}
```

## Error Handling

### Client-Side Error Management

```typescript
interface AuctionError {
  type: 'NETWORK' | 'VALIDATION' | 'PERMISSION' | 'BUSINESS_RULE';
  message: string;
  field?: string;
  code?: string;
}

// Error handling patterns
const handleAuctionError = (error: AuctionError) => {
  switch (error.type) {
    case 'NETWORK':
      notifications.show({
        title: 'Erreur de connexion',
        message: 'Vérifiez votre connexion internet',
        color: 'red',
      });
      break;
    case 'VALIDATION':
      // Show field-specific validation errors
      break;
    case 'PERMISSION':
      notifications.show({
        title: 'Accès refusé',
        message: 'Vous n\'avez pas les permissions nécessaires',
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

### Server-Side Error Handling

```typescript
// API error responses
export class AuctionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuctionError';
  }
}

// Common auction business rules
const validateAuctionOperation = (auction: Auction, operation: string) => {
  switch (operation) {
    case 'EXTEND':
      if (auction.status !== 'ACTIVE' && auction.status !== 'ENDING_SOON') {
        throw new AuctionError(
          'Seules les enchères actives peuvent être prolongées',
          'INVALID_STATUS_FOR_EXTEND',
          400
        );
      }
      break;
    case 'CANCEL':
      if (auction.bidCount > 0) {
        throw new AuctionError(
          'Impossible d\'annuler une enchère avec des mises',
          'CANNOT_CANCEL_WITH_BIDS',
          400
        );
      }
      break;
  }
};
```

## Testing Strategy

### Unit Testing

```typescript
// Component testing with React Testing Library
describe('AuctionsContent', () => {
  it('should display auctions list correctly', () => {
    // Test auction rendering
  });
  
  it('should handle real-time bid updates', () => {
    // Test WebSocket integration
  });
  
  it('should perform bulk operations', () => {
    // Test bulk actions
  });
});

// API testing
describe('Auctions API', () => {
  it('should return paginated auctions', () => {
    // Test API endpoints
  });
  
  it('should validate auction business rules', () => {
    // Test business logic
  });
});
```

### Integration Testing

```typescript
// End-to-end auction workflow testing
describe('Auction Management Workflow', () => {
  it('should create, manage, and complete auction lifecycle', () => {
    // Test complete auction flow
  });
  
  it('should handle real-time bidding scenarios', () => {
    // Test real-time functionality
  });
});
```

### Performance Testing

```typescript
// Load testing for real-time updates
describe('Real-time Performance', () => {
  it('should handle multiple concurrent bid updates', () => {
    // Test WebSocket performance
  });
  
  it('should efficiently paginate large auction lists', () => {
    // Test pagination performance
  });
});
```

## Real-Time Features

### WebSocket Integration

```typescript
// Pusher channel configuration
const auctionChannel = pusher.subscribe(`auction-updates-${vendorId}`);

auctionChannel.bind('bid-placed', (data: RealTimeAuctionUpdate) => {
  updateAuctionInList(data.auctionId, {
    currentBid: data.data.currentBid,
    bidCount: data.data.bidCount,
  });
  
  showBidNotification(data);
});

auctionChannel.bind('auction-ending', (data: RealTimeAuctionUpdate) => {
  updateAuctionStatus(data.auctionId, 'ENDING_SOON');
  showUrgentNotification(data);
});
```

### Notification System

```typescript
interface AuctionNotification {
  type: 'BID_PLACED' | 'AUCTION_ENDING' | 'AUCTION_WON' | 'AUCTION_LOST';
  auctionId: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  timestamp: Date;
}

// Notification display logic
const showAuctionNotification = (notification: AuctionNotification) => {
  const config = {
    title: notification.title,
    message: notification.message,
    color: getNotificationColor(notification.type),
    autoClose: notification.priority === 'URGENT' ? false : 5000,
  };
  
  notifications.show(config);
};
```

## Security Considerations

### Access Control

```typescript
// Role-based auction access
const checkAuctionAccess = (user: User, auction: Auction, operation: string) => {
  // Vendors can only manage their own auctions
  if (user.role === 'VENDOR' && auction.storeId !== user.vendorStoreId) {
    throw new Error('Access denied');
  }
  
  // Admins can manage all auctions
  if (user.role === 'ADMIN') {
    return true;
  }
  
  // Operation-specific checks
  switch (operation) {
    case 'VIEW_BIDDERS':
      return auction.storeId === user.vendorStoreId || user.role === 'ADMIN';
    case 'CANCEL':
      return auction.status === 'DRAFT' || auction.bidCount === 0;
  }
};
```

### Data Privacy

```typescript
// Bidder information anonymization
const anonymizeBidder = (bid: Bid, requestingUser: User) => {
  if (requestingUser.role !== 'ADMIN' && bid.bidderId !== requestingUser.id) {
    return {
      ...bid,
      bidderName: `Utilisateur ${bid.bidderId.toString().slice(-4)}`,
      bidderId: 'anonymous',
    };
  }
  return bid;
};
```

## Performance Optimizations

### Caching Strategy

```typescript
// Redis caching for auction data
const cacheAuctionList = async (vendorId: string, auctions: Auction[]) => {
  await redis.setex(
    `auctions:vendor:${vendorId}`,
    300, // 5 minutes
    JSON.stringify(auctions)
  );
};

// Optimistic updates for real-time changes
const optimisticBidUpdate = (auctionId: string, newBid: number) => {
  setAuctions(prev => prev.map(auction => 
    auction.id === auctionId 
      ? { ...auction, currentBid: newBid, bidCount: auction.bidCount + 1 }
      : auction
  ));
};
```

### Database Optimization

```sql
-- Indexes for auction queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auctions_vendor_status 
ON auctions(store_id, status) WHERE status IN ('ACTIVE', 'ENDING_SOON');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auctions_end_time 
ON auctions(end_time) WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_auction_timestamp 
ON bids(auction_id, created_at DESC);
```

## Accessibility Features

### Keyboard Navigation

```typescript
// Keyboard shortcuts for auction management
const useAuctionKeyboardShortcuts = () => {
  useHotkeys([
    ['ctrl+n', () => router.push('/workspace/auctions/new')],
    ['ctrl+f', () => searchInputRef.current?.focus()],
    ['escape', () => clearSelection()],
  ]);
};
```

### Screen Reader Support

```typescript
// ARIA labels and descriptions
const AuctionTableRow = ({ auction }: { auction: Auction }) => (
  <Table.Tr
    role="row"
    aria-label={`Enchère ${auction.title}, mise actuelle ${auction.currentBid} MAD, se termine le ${auction.endTime.toLocaleDateString()}`}
  >
    {/* Table cells with appropriate ARIA attributes */}
  </Table.Tr>
);
```

## Mobile Responsiveness

### Responsive Design Patterns

```typescript
// Mobile-optimized auction cards
const MobileAuctionCard = ({ auction }: { auction: Auction }) => (
  <Card
    shadow="sm"
    padding="md"
    radius="md"
    withBorder
    style={{ marginBottom: 16 }}
  >
    <Stack gap="sm">
      <Group justify="space-between">
        <Text fw={600} size="sm" lineClamp={2}>
          {auction.title}
        </Text>
        <AuctionStatusBadge status={auction.status} />
      </Group>
      
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed">Mise actuelle</Text>
          <Text fw={700} color="blue">
            {auction.currentBid.toLocaleString()} MAD
          </Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">Se termine</Text>
          <Text size="sm">
            {formatTimeRemaining(auction.endTime)}
          </Text>
        </div>
      </Group>
      
      <Group gap="xs">
        <Button size="xs" variant="light" fullWidth>
          Voir détails
        </Button>
        <Menu>
          <Menu.Target>
            <ActionIcon size="sm" variant="light">
              <MoreHorizontal size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {/* Mobile action menu */}
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Stack>
  </Card>
);
```

This design document provides a comprehensive foundation for implementing the auction management feature while maintaining consistency with the existing workspace architecture and following established patterns from the dashboard and products management systems.