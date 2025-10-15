'use client';

import { useForm } from '@mantine/form';
import {
  TextInput,
  Select,
  PasswordInput,
  Button,
  Stack,
  Group,
  Paper,
} from '@mantine/core';
import { Role } from '@prisma/client';

interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  role: Role;
  password?: string;
  locale?: string;
}

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
  loading?: boolean;
}

export function UserForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  loading = false,
}: UserFormProps) {
  const form = useForm<UserFormData>({
    initialValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      role: initialData?.role || 'CLIENT',
      password: '',
      locale: initialData?.locale || 'fr',
    },
    validate: {
      name: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Name is required';
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters';
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
          // Basic phone validation - at least 10 digits
          const digitsOnly = value.replace(/\D/g, '');
          if (digitsOnly.length < 10) {
            return 'Phone number must be at least 10 digits';
          }
        }
        return null;
      },
      role: (value) => {
        if (!value) {
          return 'Role is required';
        }
        if (!['CLIENT', 'VENDOR', 'ADMIN'].includes(value)) {
          return 'Invalid role';
        }
        return null;
      },
      password: (value) => {
        if (!isEdit) {
          // Password required for new users
          if (!value || value.length === 0) {
            return 'Password is required';
          }
          if (value.length < 8) {
            return 'Password must be at least 8 characters';
          }
        } else {
          // Password optional for edits, but if provided must be valid
          if (value && value.length > 0 && value.length < 8) {
            return 'Password must be at least 8 characters';
          }
        }
        return null;
      },
      locale: (value) => {
        if (!value) {
          return 'Locale is required';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: UserFormData) => {
    try {
      // Remove password from edit if not provided
      if (isEdit && !values.password) {
        const { password, ...dataWithoutPassword } = values;
        await onSubmit(dataWithoutPassword as UserFormData);
      } else {
        await onSubmit(values);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Paper p="md" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Enter user's full name"
            required
            {...form.getInputProps('name')}
          />

          <TextInput
            label="Email"
            placeholder="user@example.com"
            type="email"
            required
            {...form.getInputProps('email')}
          />

          <TextInput
            label="Phone"
            placeholder="+1 (555) 123-4567"
            {...form.getInputProps('phone')}
          />

          <Select
            label="Role"
            placeholder="Select user role"
            required
            data={[
              { value: 'CLIENT', label: 'Client' },
              { value: 'VENDOR', label: 'Vendor' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
            {...form.getInputProps('role')}
          />

          <Select
            label="Locale"
            placeholder="Select language"
            required
            data={[
              { value: 'en', label: 'English' },
              { value: 'fr', label: 'French' },
              { value: 'ar', label: 'Arabic' },
            ]}
            {...form.getInputProps('locale')}
          />

          {!isEdit && (
            <PasswordInput
              label="Password"
              placeholder="Enter password"
              required
              description="Must be at least 8 characters"
              {...form.getInputProps('password')}
            />
          )}

          {isEdit && (
            <PasswordInput
              label="Password"
              placeholder="Leave blank to keep current password"
              description="Enter new password only if you want to change it (min 8 characters)"
              {...form.getInputProps('password')}
            />
          )}

          <Group justify="flex-end" mt="md">
            {onCancel && (
              <Button variant="default" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={loading}>
              {isEdit ? 'Update User' : 'Create User'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
