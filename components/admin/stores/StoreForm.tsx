'use client';

import { useForm } from '@mantine/form';
import {
  TextInput,
  Select,
  Textarea,
  Button,
  Stack,
  Group,
  Paper,
  Switch,
  FileInput,
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

type StoreStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

interface StoreFormData {
  name: string;
  email: string;
  phone?: string;
  sellerId: string;
  status: StoreStatus;
  address?: any;
  socials?: any;
  seo?: any;
}

interface Seller {
  id: string;
  user: {
    name: string;
    email: string;
  };
}

interface StoreFormProps {
  initialData?: Partial<StoreFormData>;
  onSubmit: (data: StoreFormData) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
  loading?: boolean;
  sellers?: Seller[];
}

export function StoreForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  loading = false,
  sellers = [],
}: StoreFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(initialData?.status === 'ACTIVE');

  const form = useForm<StoreFormData>({
    initialValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      sellerId: initialData?.sellerId || '',
      status: initialData?.status || 'PENDING',
      address: initialData?.address || null,
      socials: initialData?.socials || null,
      seo: initialData?.seo || null,
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Store name is required';
        }
        if (value.trim().length < 2) {
          return 'Store name must be at least 2 characters';
        }
        return null;
      },
      email: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Email is required';
        }
        if (!/^\S+@\S+\.\S+$/.test(value)) {
          return 'Invalid email format';
        }
        return null;
      },
      phone: (value) => {
        if (value && value.trim().length > 0) {
          const digitsOnly = value.replace(/\D/g, '');
          if (digitsOnly.length < 10) {
            return 'Phone number must be at least 10 digits';
          }
        }
        return null;
      },
      sellerId: (value) => {
        if (!isEdit && (!value || value.trim().length === 0)) {
          return 'Seller is required';
        }
        return null;
      },
    },
  });

  // Update status when switch changes
  useEffect(() => {
    form.setFieldValue('status', isActive ? 'ACTIVE' : 'SUSPENDED');
  }, [isActive]);

  const handleSubmit = async (values: StoreFormData) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const sellerOptions = sellers.map((seller) => ({
    value: seller.id,
    label: `${seller.user.name} (${seller.user.email})`,
  }));

  return (
    <Paper p="md" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <TextInput
            label="Store Name"
            placeholder="Enter store name"
            required
            {...form.getInputProps('name')}
          />

          <TextInput
            label="Email"
            placeholder="store@example.com"
            type="email"
            required
            {...form.getInputProps('email')}
          />

          <TextInput
            label="Phone"
            placeholder="+1 (555) 123-4567"
            {...form.getInputProps('phone')}
          />

          {/* Seller Selection (only for create) */}
          {!isEdit && (
            <Select
              label="Seller"
              placeholder="Select a seller"
              data={sellerOptions}
              required
              searchable
              {...form.getInputProps('sellerId')}
            />
          )}

          {/* Logo Upload */}
          <FileInput
            label="Store Logo"
            placeholder="Upload logo"
            accept="image/*"
            leftSection={<IconUpload size={16} />}
            value={logoFile}
            onChange={setLogoFile}
          />

          {/* Address (optional - JSON field) */}
          <Textarea
            label="Address (JSON)"
            placeholder='{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}'
            minRows={3}
            {...form.getInputProps('address')}
          />

          {/* Social Links (optional - JSON field) */}
          <Textarea
            label="Social Links (JSON)"
            placeholder='{"facebook": "https://facebook.com/store", "instagram": "https://instagram.com/store"}'
            minRows={2}
            {...form.getInputProps('socials')}
          />

          {/* SEO Data (optional - JSON field) */}
          <Textarea
            label="SEO Data (JSON)"
            placeholder='{"title": "Store Title", "description": "Store Description", "keywords": ["keyword1", "keyword2"]}'
            minRows={2}
            {...form.getInputProps('seo')}
          />

          {/* Status Toggle */}
          <Switch
            label="Active Status"
            description="Toggle to activate or suspend the store"
            checked={isActive}
            onChange={(event) => setIsActive(event.currentTarget.checked)}
          />

          {/* Form Actions */}
          <Group justify="flex-end" mt="md">
            {onCancel && (
              <Button variant="subtle" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={loading}>
              {isEdit ? 'Update Store' : 'Create Store'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
