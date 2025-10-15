'use client';

import { TextInput, Switch, Stack, Text, Select, MultiSelect } from '@mantine/core';

interface GeneralSettingsProps {
  values: {
    siteName: string;
    supportEmail: string;
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
    defaultLocale: string;
    availableLocales: string[];
  };
  onChange: (key: string, value: any) => void;
}

const LOCALE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
];

export function GeneralSettings({ values, onChange }: GeneralSettingsProps) {
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Configure general platform settings and preferences
      </Text>

      <TextInput
        label="Site Name"
        description="Name of your marketplace platform"
        value={values.siteName}
        onChange={(event) => onChange('siteName', event.currentTarget.value)}
        required
      />

      <TextInput
        label="Support Email"
        description="Email address for customer support inquiries"
        value={values.supportEmail}
        onChange={(event) => onChange('supportEmail', event.currentTarget.value)}
        type="email"
        required
      />

      <Switch
        label="Maintenance Mode"
        description="Enable maintenance mode to prevent user access"
        checked={values.maintenanceMode}
        onChange={(event) => onChange('maintenanceMode', event.currentTarget.checked)}
        color="red"
      />

      <Switch
        label="Allow New Registrations"
        description="Allow new users to register on the platform"
        checked={values.allowNewRegistrations}
        onChange={(event) => onChange('allowNewRegistrations', event.currentTarget.checked)}
      />

      <Select
        label="Default Locale"
        description="Default language for new users"
        data={LOCALE_OPTIONS}
        value={values.defaultLocale}
        onChange={(value) => onChange('defaultLocale', value)}
        required
      />

      <MultiSelect
        label="Available Locales"
        description="Languages available on the platform"
        data={LOCALE_OPTIONS}
        value={values.availableLocales}
        onChange={(value) => onChange('availableLocales', value)}
        required
      />
    </Stack>
  );
}
