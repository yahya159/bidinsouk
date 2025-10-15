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
  Select,
  Grid
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

interface VendorReviewCardProps {
  vendor: any;
  onUpdate: () => void;
}

export function VendorReviewCard({ vendor, onUpdate }: VendorReviewCardProps) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
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
    } catch (error: any) {
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
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuspend = async () => {
    if (!suspensionReason) {
      notifications.show({
        title: 'Error',
        message: 'Please provide a suspension reason',
        color: 'red'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/vendors/${vendor.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: suspensionReason
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to suspend vendor');
      }
      
      notifications.show({
        title: 'Vendor Suspended',
        message: `${vendor.businessName} has been suspended`,
        color: 'red'
      });
      
      setSuspendModalOpen(false);
      onUpdate();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'yellow';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'SUSPENDED': return 'red';
      default: return 'gray';
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
            <Badge color={getStatusColor(vendor.status)}>
              {vendor.status}
            </Badge>
          </Group>
          
          <Text size="sm" lineClamp={2}>{vendor.businessDescription}</Text>
          
          <Grid>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Type:</Text>
              <Text size="sm">{vendor.businessType}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Phone:</Text>
              <Text size="sm">{vendor.phoneNumber}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Tax ID:</Text>
              <Text size="sm">{vendor.taxId}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Applied:</Text>
              <Text size="sm">
                {new Date(vendor.createdAt).toLocaleDateString()}
              </Text>
            </Grid.Col>
          </Grid>
          
          <Group mt="md">
            {vendor.status === 'PENDING' && (
              <>
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
              </>
            )}
            {vendor.status === 'APPROVED' && (
              <Button 
                color="red" 
                variant="outline"
                onClick={() => setSuspendModalOpen(true)}
              >
                Suspend
              </Button>
            )}
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
      
      <Modal
        opened={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        title="Suspend Vendor Account"
      >
        <Stack gap="md">
          <Textarea
            label="Suspension Reason"
            placeholder="Provide a detailed reason for suspension"
            required
            minRows={4}
            value={suspensionReason}
            onChange={(e) => setSuspensionReason(e.target.value)}
          />
          
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              color="red" 
              onClick={handleSuspend}
              loading={loading}
            >
              Suspend Vendor
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
