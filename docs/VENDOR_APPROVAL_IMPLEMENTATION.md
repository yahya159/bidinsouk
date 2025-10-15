# Vendor Approval System - Implementation Guide

## QUICK START IMPLEMENTATION

### Step 1: Database Schema Updates

```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  roles     String[] @default(["CLIENT"])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  vendor    Vendor?
  auditLogs AuditLog[] @relation("PerformedBy")
}

model Vendor {
  id                    String    @id @default(cuid())
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Business Information
  businessName          String    @unique
  businessDescription   String    @db.Text
  businessType          String    // INDIVIDUAL, COMPANY, PARTNERSHIP
  
  // Contact Information
  phoneNumber           String
  businessEmail         String
  businessAddress       Json
  
  // Legal Information
  taxId                 String
  businessRegNumber     String?
  
  // Banking (Encrypted)
  bankAccountNumber     String?
  bankRoutingNumber     String?
  bankAccountHolderName String?
  
  // Status Management
  status                VendorStatus @default(PENDING)
  
  // Approval/Rejection
  approvedAt            DateTime?
  approvedBy            String?
  approver              User?      @relation("VendorApprover", fields: [approvedBy], references: [id])
  
  rejectedAt            DateTime?
  rejectedBy            String?
  rejectionReason       String?    @db.Text
  rejectionCategory     String?
  
  // Suspension
  suspendedAt           DateTime?
  suspensionReason      String?    @db.Text
  reinstatedAt          DateTime?
  reinstatedBy          String?
  
  // Documents
  documents             Json       // URLs to uploaded documents
  documentsComplete     Boolean    @default(false)
  
  // Additional Info
  yearsInBusiness       Int?
  estimatedMonthlyVolume String?
  productCategories     String[]
  
  // Metadata
  tier                  String     @default("BASIC") // BASIC, PREMIUM
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt
  
  // Relations
  store                 Store?
  products              Product[]
  orders                Order[]
  auctions              Auction[]
  
  @@index([status])
  @@index([userId])
  @@index([businessName])
}

enum VendorStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
  EXPIRED
}

model Store {
  id          String      @id @default(cuid())
  vendorId    String      @unique
  vendor      Vendor      @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  
  name        String
  description String?     @db.Text
  logo        String?
  banner      String?
  
  status      StoreStatus @default(PENDING)
  
  approvedAt  DateTime?
  approvedBy  String?
  rejectedAt  DateTime?
  rejectionReason String? @db.Text
  
  suspendedAt DateTime?
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  products    Product[]
  
  @@index([vendorId])
  @@index([status])
}

enum StoreStatus {
  PENDING
  ACTIVE
  SUSPENDED
  REJECTED
  DELETED
}

model AuditLog {
  id          String   @id @default(cuid())
  action      String
  performedBy String
  performer   User     @relation("PerformedBy", fields: [performedBy], references: [id])
  
  targetId    String?
  targetType  String?
  
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  
  timestamp   DateTime @default(now())
  
  @@index([performedBy])
  @@index([targetId])
  @@index([action])
  @@index([timestamp])
}
```


### Step 2: API Routes

```typescript
// app/api/vendor/apply/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, AuditAction } from '@/lib/audit/audit-logger';

const applicationSchema = z.object({
  businessName: z.string().min(3).max(100),
  businessDescription: z.string().min(50).max(1000),
  businessType: z.enum(['INDIVIDUAL', 'COMPANY', 'PARTNERSHIP']),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
  businessEmail: z.string().email(),
  businessAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string()
  }),
  taxId: z.string().min(5).max(20),
  documents: z.object({
    businessLicense: z.string().url(),
    taxCertificate: z.string().url(),
    identityProof: z.string().url()
  }),
  yearsInBusiness: z.number().min(0).max(100),
  estimatedMonthlyVolume: z.string(),
  productCategories: z.array(z.string()).max(5)
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check for existing application
    const existing = await prisma.vendor.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });
    
    if (existing) {
      if (existing.status === 'PENDING') {
        return NextResponse.json(
          { error: 'You already have a pending application' },
          { status: 400 }
        );
      }
      if (existing.status === 'APPROVED') {
        return NextResponse.json(
          { error: 'You are already an approved vendor' },
          { status: 400 }
        );
      }
    }
    
    // Check rejection cooldown
    const lastRejection = await prisma.vendor.findFirst({
      where: {
        userId: session.user.id,
        status: 'REJECTED'
      },
      orderBy: { rejectedAt: 'desc' }
    });
    
    if (lastRejection?.rejectedAt) {
      const daysSince = Math.floor(
        (Date.now() - lastRejection.rejectedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSince < 30) {
        return NextResponse.json(
          { 
            error: `You can reapply in ${30 - daysSince} days`,
            canReapplyAt: new Date(lastRejection.rejectedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
          },
          { status: 400 }
        );
      }
    }
    
    const body = await request.json();
    const validated = applicationSchema.parse(body);
    
    // Create vendor application
    const vendor = await prisma.vendor.create({
      data: {
        userId: session.user.id,
        ...validated,
        documents: validated.documents,
        documentsComplete: true,
        status: 'PENDING'
      }
    });
    
    // Create audit log
    await createAuditLog({
      action: AuditAction.VENDOR_APPLICATION_SUBMITTED,
      performedBy: session.user.id,
      targetId: vendor.id,
      targetType: 'VENDOR',
      metadata: {
        businessName: validated.businessName,
        businessType: validated.businessType
      }
    });
    
    // Notify admins (implement notification service)
    // await notifyAdmins('new-vendor-application', { vendor });
    
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Vendor application error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
```


```typescript
// app/api/admin/vendors/[id]/approve/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction } from '@/lib/audit/audit-logger';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const vendor = await prisma.$transaction(async (tx) => {
      // Update vendor status
      const updatedVendor = await tx.vendor.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: session.user.id
        },
        include: { user: true }
      });
      
      // Add VENDOR role to user
      await tx.user.update({
        where: { id: updatedVendor.userId },
        data: {
          roles: {
            push: 'VENDOR'
          }
        }
      });
      
      return updatedVendor;
    });
    
    // Audit log
    await createAuditLog({
      action: AuditAction.VENDOR_APPROVED,
      performedBy: session.user.id,
      targetId: vendor.id,
      targetType: 'VENDOR',
      metadata: {
        businessName: vendor.businessName
      }
    });
    
    // Send approval email
    // await sendEmail({
    //   to: vendor.user.email,
    //   template: 'vendor-approved',
    //   data: { vendor }
    // });
    
    return NextResponse.json({ vendor });
  } catch (error) {
    console.error('Vendor approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve vendor' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/admin/vendors/[id]/reject/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await request.json();
    const { reason, category } = body;
    
    if (!reason || !category) {
      return NextResponse.json(
        { error: 'Reason and category are required' },
        { status: 400 }
      );
    }
    
    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: session.user.id,
        rejectionReason: reason,
        rejectionCategory: category
      },
      include: { user: true }
    });
    
    // Audit log
    await createAuditLog({
      action: AuditAction.VENDOR_REJECTED,
      performedBy: session.user.id,
      targetId: vendor.id,
      targetType: 'VENDOR',
      metadata: { reason, category }
    });
    
    // Send rejection email
    // await sendEmail({
    //   to: vendor.user.email,
    //   template: 'vendor-rejected',
    //   data: { 
    //     vendor, 
    //     reason,
    //     canReapplyDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    //   }
    // });
    
    return NextResponse.json({ vendor });
  } catch (error) {
    console.error('Vendor rejection error:', error);
    return NextResponse.json(
      { error: 'Failed to reject vendor' },
      { status: 500 }
    );
  }
}
```


### Step 3: Frontend Components

```typescript
// app/(main)/become-vendor/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Container, 
  Title, 
  Text, 
  TextInput, 
  Textarea, 
  Select, 
  Button,
  Paper,
  Group,
  FileInput,
  NumberInput,
  MultiSelect,
  Stack
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

export default function BecomeVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const form = useForm({
    initialValues: {
      businessName: '',
      businessDescription: '',
      businessType: 'COMPANY',
      phoneNumber: '',
      businessEmail: '',
      businessAddress: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      },
      taxId: '',
      yearsInBusiness: 0,
      estimatedMonthlyVolume: '',
      productCategories: []
    },
    validate: {
      businessName: (value) => 
        value.length < 3 ? 'Business name must be at least 3 characters' : null,
      businessDescription: (value) =>
        value.length < 50 ? 'Description must be at least 50 characters' : null,
      phoneNumber: (value) =>
        !/^\+[1-9]\d{1,14}$/.test(value) ? 'Invalid phone number format' : null,
      businessEmail: (value) =>
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email' : null,
      taxId: (value) =>
        value.length < 5 ? 'Tax ID must be at least 5 characters' : null
    }
  });
  
  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/vendor/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }
      
      notifications.show({
        title: 'Application Submitted',
        message: 'Your vendor application has been submitted for review',
        color: 'green'
      });
      
      router.push('/vendor/pending');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container size="md" py="xl">
      <Title order={1} mb="md">Become a Vendor</Title>
      <Text c="dimmed" mb="xl">
        Join our marketplace and start selling your products
      </Text>
      
      <Paper p="xl" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Business Name"
              placeholder="Your business name"
              required
              {...form.getInputProps('businessName')}
            />
            
            <Textarea
              label="Business Description"
              placeholder="Describe your business (minimum 50 characters)"
              required
              minRows={4}
              {...form.getInputProps('businessDescription')}
            />
            
            <Select
              label="Business Type"
              required
              data={[
                { value: 'INDIVIDUAL', label: 'Individual' },
                { value: 'COMPANY', label: 'Company' },
                { value: 'PARTNERSHIP', label: 'Partnership' }
              ]}
              {...form.getInputProps('businessType')}
            />
            
            <TextInput
              label="Phone Number"
              placeholder="+1234567890"
              required
              {...form.getInputProps('phoneNumber')}
            />
            
            <TextInput
              label="Business Email"
              placeholder="business@example.com"
              required
              {...form.getInputProps('businessEmail')}
            />
            
            <Title order={4} mt="md">Business Address</Title>
            
            <TextInput
              label="Street"
              required
              {...form.getInputProps('businessAddress.street')}
            />
            
            <Group grow>
              <TextInput
                label="City"
                required
                {...form.getInputProps('businessAddress.city')}
              />
              <TextInput
                label="State"
                required
                {...form.getInputProps('businessAddress.state')}
              />
            </Group>
            
            <Group grow>
              <TextInput
                label="Postal Code"
                required
                {...form.getInputProps('businessAddress.postalCode')}
              />
              <TextInput
                label="Country"
                required
                {...form.getInputProps('businessAddress.country')}
              />
            </Group>
            
            <TextInput
              label="Tax ID"
              placeholder="Your tax identification number"
              required
              {...form.getInputProps('taxId')}
            />
            
            <NumberInput
              label="Years in Business"
              min={0}
              max={100}
              {...form.getInputProps('yearsInBusiness')}
            />
            
            <Select
              label="Estimated Monthly Volume"
              data={[
                { value: 'LOW', label: 'Under $5,000' },
                { value: 'MEDIUM', label: '$5,000 - $20,000' },
                { value: 'HIGH', label: 'Over $20,000' }
              ]}
              {...form.getInputProps('estimatedMonthlyVolume')}
            />
            
            <MultiSelect
              label="Product Categories"
              placeholder="Select up to 5 categories"
              data={[
                'Electronics',
                'Fashion',
                'Home & Garden',
                'Sports',
                'Books',
                'Toys',
                'Food & Beverage'
              ]}
              maxValues={5}
              {...form.getInputProps('productCategories')}
            />
            
            <Button type="submit" loading={loading} size="lg" mt="xl">
              Submit Application
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
```


```typescript
// components/admin/VendorReviewCard.tsx
'use client';

import { useState } from 'react';
import { 
  Card, 
  Text, 
  Badge, 
  Group, 
  Button, 
  Stack,
  Modal,
  Textarea,
  Select
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

interface VendorReviewCardProps {
  vendor: any;
  onUpdate: () => void;
}

export function VendorReviewCard({ vendor, onUpdate }: VendorReviewCardProps) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleApprove = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/vendors/${vendor.id}/approve`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve vendor');
      }
      
      notifications.show({
        title: 'Vendor Approved',
        message: `${vendor.businessName} has been approved`,
        color: 'green'
      });
      
      onUpdate();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleReject = async () => {
    if (!rejectionReason || !rejectionCategory) {
      notifications.show({
        title: 'Error',
        message: 'Please provide a reason and category',
        color: 'red'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/vendors/${vendor.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectionReason,
          category: rejectionCategory
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject vendor');
      }
      
      notifications.show({
        title: 'Vendor Rejected',
        message: `${vendor.businessName} has been rejected`,
        color: 'orange'
      });
      
      setRejectModalOpen(false);
      onUpdate();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Card withBorder p="lg">
        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text size="lg" fw={600}>{vendor.businessName}</Text>
              <Text size="sm" c="dimmed">{vendor.user.email}</Text>
            </div>
            <Badge color={vendor.status === 'PENDING' ? 'yellow' : 'gray'}>
              {vendor.status}
            </Badge>
          </Group>
          
          <Text size="sm">{vendor.businessDescription}</Text>
          
          <Group>
            <Text size="sm" c="dimmed">Type:</Text>
            <Text size="sm">{vendor.businessType}</Text>
          </Group>
          
          <Group>
            <Text size="sm" c="dimmed">Phone:</Text>
            <Text size="sm">{vendor.phoneNumber}</Text>
          </Group>
          
          <Group>
            <Text size="sm" c="dimmed">Tax ID:</Text>
            <Text size="sm">{vendor.taxId}</Text>
          </Group>
          
          <Group>
            <Text size="sm" c="dimmed">Applied:</Text>
            <Text size="sm">
              {new Date(vendor.createdAt).toLocaleDateString()}
            </Text>
          </Group>
          
          <Group mt="md">
            <Button 
              color="green" 
              onClick={handleApprove}
              loading={loading}
            >
              Approve
            </Button>
            <Button 
              color="red" 
              variant="outline"
              onClick={() => setRejectModalOpen(true)}
            >
              Reject
            </Button>
            <Button variant="subtle">View Details</Button>
          </Group>
        </Stack>
      </Card>
      
      <Modal
        opened={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Vendor Application"
      >
        <Stack gap="md">
          <Select
            label="Rejection Category"
            placeholder="Select a category"
            required
            data={[
              { value: 'INCOMPLETE_DOCS', label: 'Incomplete Documentation' },
              { value: 'INVALID_INFO', label: 'Invalid Information' },
              { value: 'POLICY_VIOLATION', label: 'Policy Violation' },
              { value: 'OTHER', label: 'Other' }
            ]}
            value={rejectionCategory}
            onChange={(value) => setRejectionCategory(value || '')}
          />
          
          <Textarea
            label="Rejection Reason"
            placeholder="Provide a detailed reason for rejection"
            required
            minRows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              color="red" 
              onClick={handleReject}
              loading={loading}
            >
              Reject Application
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
```


### Step 4: Admin Dashboard Page

```typescript
// app/(admin)/admin/vendors/pending/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Container, Title, Stack, Loader, Text } from '@mantine/core';
import { VendorReviewCard } from '@/components/admin/VendorReviewCard';

export default function PendingVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/admin/vendors?status=PENDING');
      const data = await response.json();
      setVendors(data.vendors);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchVendors();
  }, []);
  
  if (loading) {
    return (
      <Container>
        <Loader size="lg" />
      </Container>
    );
  }
  
  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="xl">Pending Vendor Applications</Title>
      
      {vendors.length === 0 ? (
        <Text c="dimmed">No pending applications</Text>
      ) : (
        <Stack gap="md">
          {vendors.map((vendor) => (
            <VendorReviewCard
              key={vendor.id}
              vendor={vendor}
              onUpdate={fetchVendors}
            />
          ))}
        </Stack>
      )}
    </Container>
  );
}
```

