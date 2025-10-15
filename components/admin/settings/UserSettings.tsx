'use client';

import { Switch, Stack, Text, NumberInput } from '@mantine/core';

interface UserSettingsProps {
  values: {
    emailVerificationRequired: boolean;
    phoneVerificationRequired: boolean;
    autoApproveVendors: boolean;
    maxStoresPerVendor: number;
    allowGuestCheckout: boolean;
  };
  onChange: (key: string, value: any) => void;
}

export function UserSettings({ values, onChange }: UserSettingsProps) {
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Configure user registration and account policies
      </Text>

      <Switch
        label="Require Email Verification"
        description="Users must verify their email address before accessing the platform"
        checked={values.emailVerificationRequired}
        onChange={(event) => onChange('emailVerificationRequired', event.currentTarget.checked)}
      />

      <Switch
        label="Require Phone Verification"
        description="Users must verify their phone number during registration"
        checked={values.phoneVerificationRequired}
        onChange={(event) => onChange('phoneVerificationRequired', event.currentTarget.checked)}
      />

      <Switch
        label="Auto-Approve Vendors"
        description="Automatically approve vendor applications without manual review"
        checked={values.autoApproveVendors}
        onChange={(event) => onChange('autoApproveVendors', event.currentTarget.checked)}
      />

      <NumberInput
        label="Max Stores Per Vendor"
        description="Maximum number of stores a vendor can create"
        value={values.maxStoresPerVendor}
        onChange={(value) => onChange('maxStoresPerVendor', value)}
        min={1}
        max={50}
        required
      />

      <Switch
        label="Allow Guest Checkout"
        description="Allow users to place orders without creating an account"
        checked={values.allowGuestCheckout}
        onChange={(event) => onChange('allowGuestCheckout', event.currentTarget.checked)}
      />
    </Stack>
  );
}
