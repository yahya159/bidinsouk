'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Paper,
  Accordion,
  Button,
  Group,
  Text,
  Modal,
  Stack,
  Alert,
  Loader,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSettings, IconDeviceFloppy, IconAlertCircle, IconCheck, IconRefresh } from '@tabler/icons-react';
import { AuctionSettings } from '@/components/admin/settings/AuctionSettings';
import { UserSettings } from '@/components/admin/settings/UserSettings';
import { PaymentSettings } from '@/components/admin/settings/PaymentSettings';
import { GeneralSettings } from '@/components/admin/settings/GeneralSettings';

interface Settings {
  auction: {
    defaultDuration: number;
    minIncrement: number;
    autoExtendEnabled: boolean;
    autoExtendMinutes: number;
    reservePriceRequired: boolean;
    commissionRate: number;
  };
  user: {
    emailVerificationRequired: boolean;
    phoneVerificationRequired: boolean;
    autoApproveVendors: boolean;
    maxStoresPerVendor: number;
    allowGuestCheckout: boolean;
  };
  payment: {
    platformFeeRate: number;
    vendorCommissionRate: number;
    minOrderAmount: number;
    refundWindowDays: number;
    paymentMethods: string[];
  };
  general: {
    siteName: string;
    supportEmail: string;
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
    defaultLocale: string;
    availableLocales: string[];
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data.settings);
      setLastUpdated(data.lastUpdated);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load settings',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category: keyof Settings, key: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      setSettings(data.settings);
      setHasChanges(false);
      setConfirmModalOpen(false);

      notifications.show({
        title: 'Success',
        message: 'Settings saved successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      // Refresh to get latest update time
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save settings',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
    setHasChanges(false);
    notifications.show({
      title: 'Reset',
      message: 'Settings reset to saved values',
      color: 'blue',
    });
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!settings) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          Failed to load settings. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="xs" mb="xs">
              <IconSettings size={28} />
              <Title order={1}>Platform Settings</Title>
            </Group>
            <Text c="dimmed" size="sm">
              Configure platform-wide settings and preferences
            </Text>
            {lastUpdated && (
              <Text c="dimmed" size="xs" mt="xs">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </Text>
            )}
          </div>

          <Group>
            {hasChanges && (
              <Button
                variant="subtle"
                leftSection={<IconRefresh size={16} />}
                onClick={handleReset}
              >
                Reset
              </Button>
            )}
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={() => setConfirmModalOpen(true)}
              disabled={!hasChanges}
              loading={saving}
            >
              Save Changes
            </Button>
          </Group>
        </Group>

        {hasChanges && (
          <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
            You have unsaved changes. Click &quot;Save Changes&quot; to apply them.
          </Alert>
        )}

        <Paper shadow="sm" p="md" withBorder>
          <Accordion variant="separated" defaultValue="auction">
            <Accordion.Item value="auction">
              <Accordion.Control>
                <Text fw={500}>Auction Settings</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <AuctionSettings
                  values={settings.auction}
                  onChange={(key, value) => handleSettingChange('auction', key, value)}
                />
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="user">
              <Accordion.Control>
                <Text fw={500}>User Settings</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <UserSettings
                  values={settings.user}
                  onChange={(key, value) => handleSettingChange('user', key, value)}
                />
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="payment">
              <Accordion.Control>
                <Text fw={500}>Payment Settings</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <PaymentSettings
                  values={settings.payment}
                  onChange={(key, value) => handleSettingChange('payment', key, value)}
                />
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="general">
              <Accordion.Control>
                <Text fw={500}>General Settings</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <GeneralSettings
                  values={settings.general}
                  onChange={(key, value) => handleSettingChange('general', key, value)}
                />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Paper>
      </Stack>

      {/* Confirmation Modal */}
      <Modal
        opened={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Settings Update"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to save these settings? This will affect the entire platform.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => setConfirmModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              leftSection={<IconDeviceFloppy size={16} />}
            >
              Save Settings
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
