'use client';

import { useState, useEffect } from 'react';
import {
  Drawer,
  Stack,
  Button,
  MultiSelect,
  TextInput,
  Group,
  Title,
  Divider,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconFilter, IconX, IconRefresh } from '@tabler/icons-react';

interface LogFiltersProps {
  opened: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

export interface FilterValues {
  actions: string[];
  entities: string[];
  ipAddress: string;
  dateFrom: Date | null;
  dateTo: Date | null;
}

// Action type options
const ACTION_OPTIONS = [
  { value: 'USER_CREATED', label: 'User Created' },
  { value: 'USER_UPDATED', label: 'User Updated' },
  { value: 'USER_DELETED', label: 'User Deleted' },
  { value: 'USER_ROLE_CHANGED', label: 'User Role Changed' },
  { value: 'USER_SUSPENDED', label: 'User Suspended' },
  { value: 'USER_ACTIVATED', label: 'User Activated' },
  { value: 'PRODUCT_CREATED', label: 'Product Created' },
  { value: 'PRODUCT_UPDATED', label: 'Product Updated' },
  { value: 'PRODUCT_DELETED', label: 'Product Deleted' },
  { value: 'PRODUCT_STATUS_CHANGED', label: 'Product Status Changed' },
  { value: 'AUCTION_CREATED', label: 'Auction Created' },
  { value: 'AUCTION_UPDATED', label: 'Auction Updated' },
  { value: 'AUCTION_DELETED', label: 'Auction Deleted' },
  { value: 'AUCTION_EXTENDED', label: 'Auction Extended' },
  { value: 'AUCTION_ENDED_EARLY', label: 'Auction Ended Early' },
  { value: 'ORDER_STATUS_UPDATED', label: 'Order Status Updated' },
  { value: 'ORDER_REFUNDED', label: 'Order Refunded' },
  { value: 'STORE_CREATED', label: 'Store Created' },
  { value: 'STORE_UPDATED', label: 'Store Updated' },
  { value: 'STORE_DELETED', label: 'Store Deleted' },
  { value: 'STORE_APPROVED', label: 'Store Approved' },
  { value: 'STORE_REJECTED', label: 'Store Rejected' },
  { value: 'ADMIN_LOGIN', label: 'Admin Login' },
  { value: 'ADMIN_LOGOUT', label: 'Admin Logout' },
  { value: 'ADMIN_SESSION_EXPIRED', label: 'Admin Session Expired' },
  { value: 'SETTINGS_UPDATED', label: 'Settings Updated' },
];

// Entity type options
const ENTITY_OPTIONS = [
  { value: 'User', label: 'User' },
  { value: 'Product', label: 'Product' },
  { value: 'Auction', label: 'Auction' },
  { value: 'Order', label: 'Order' },
  { value: 'Store', label: 'Store' },
  { value: 'Settings', label: 'Settings' },
  { value: 'Session', label: 'Session' },
];

// Common IP addresses for autocomplete (can be populated from recent logs)
const IP_SUGGESTIONS = [
  '127.0.0.1',
  '::1',
  '192.168.1.1',
  '10.0.0.1',
];

export function LogFilters({
  opened,
  onClose,
  onApplyFilters,
  initialFilters,
}: LogFiltersProps) {
  const [actions, setActions] = useState<string[]>(initialFilters?.actions || []);
  const [entities, setEntities] = useState<string[]>(initialFilters?.entities || []);
  const [ipAddress, setIpAddress] = useState(initialFilters?.ipAddress || '');
  const [dateFrom, setDateFrom] = useState<Date | null>(
    initialFilters?.dateFrom || null
  );
  const [dateTo, setDateTo] = useState<Date | null>(
    initialFilters?.dateTo || null
  );

  // Update local state when initial filters change
  useEffect(() => {
    if (initialFilters) {
      setActions(initialFilters.actions || []);
      setEntities(initialFilters.entities || []);
      setIpAddress(initialFilters.ipAddress || '');
      setDateFrom(initialFilters.dateFrom || null);
      setDateTo(initialFilters.dateTo || null);
    }
  }, [initialFilters]);

  const handleApply = () => {
    onApplyFilters({
      actions,
      entities,
      ipAddress,
      dateFrom,
      dateTo,
    });
    onClose();
  };

  const handleReset = () => {
    setActions([]);
    setEntities([]);
    setIpAddress('');
    setDateFrom(null);
    setDateTo(null);
  };

  const hasActiveFilters =
    actions.length > 0 ||
    entities.length > 0 ||
    ipAddress !== '' ||
    dateFrom !== null ||
    dateTo !== null;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconFilter size={20} />
          <Title order={4}>Advanced Filters</Title>
        </Group>
      }
      position="right"
      size="md"
      padding="lg"
    >
      <Stack gap="lg">
        {/* Action Types Filter */}
        <div>
          <MultiSelect
            label="Action Types"
            placeholder="Select action types to filter"
            data={ACTION_OPTIONS}
            value={actions}
            onChange={setActions}
            searchable
            clearable
            description="Filter logs by specific action types"
          />
        </div>

        <Divider />

        {/* Entity Types Filter */}
        <div>
          <MultiSelect
            label="Entity Types"
            placeholder="Select entity types to filter"
            data={ENTITY_OPTIONS}
            value={entities}
            onChange={setEntities}
            searchable
            clearable
            description="Filter logs by entity types"
          />
        </div>

        <Divider />

        {/* IP Address Filter */}
        <div>
          <TextInput
            label="IP Address"
            placeholder="Enter IP address"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.currentTarget.value)}
            description="Filter logs by IP address (exact match)"
            list="ip-suggestions"
          />
          <datalist id="ip-suggestions">
            {IP_SUGGESTIONS.map((ip) => (
              <option key={ip} value={ip} />
            ))}
          </datalist>
        </div>

        <Divider />

        {/* Date Range Filter */}
        <div>
          <Stack gap="sm">
            <DatePickerInput
              label="From Date"
              placeholder="Select start date"
              value={dateFrom}
              onChange={setDateFrom}
              clearable
              description="Filter logs from this date"
            />
            <DatePickerInput
              label="To Date"
              placeholder="Select end date"
              value={dateTo}
              onChange={setDateTo}
              clearable
              description="Filter logs until this date"
              minDate={dateFrom || undefined}
            />
          </Stack>
        </div>

        <Divider />

        {/* Action Buttons */}
        <Stack gap="sm">
          <Button
            leftSection={<IconFilter size={16} />}
            onClick={handleApply}
            fullWidth
          >
            Apply Filters
          </Button>

          {hasActiveFilters && (
            <Button
              variant="light"
              color="gray"
              leftSection={<IconRefresh size={16} />}
              onClick={handleReset}
              fullWidth
            >
              Reset Filters
            </Button>
          )}

          <Button variant="subtle" onClick={onClose} fullWidth>
            Cancel
          </Button>
        </Stack>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <>
            <Divider />
            <div>
              <Title order={6} mb="xs">
                Active Filters:
              </Title>
              <Stack gap="xs">
                {actions.length > 0 && (
                  <Group gap="xs">
                    <strong>Actions:</strong>
                    <span>{actions.length} selected</span>
                  </Group>
                )}
                {entities.length > 0 && (
                  <Group gap="xs">
                    <strong>Entities:</strong>
                    <span>{entities.length} selected</span>
                  </Group>
                )}
                {ipAddress && (
                  <Group gap="xs">
                    <strong>IP:</strong>
                    <span>{ipAddress}</span>
                  </Group>
                )}
                {dateFrom && (
                  <Group gap="xs">
                    <strong>From:</strong>
                    <span>{dateFrom.toLocaleDateString()}</span>
                  </Group>
                )}
                {dateTo && (
                  <Group gap="xs">
                    <strong>To:</strong>
                    <span>{dateTo.toLocaleDateString()}</span>
                  </Group>
                )}
              </Stack>
            </div>
          </>
        )}
      </Stack>
    </Drawer>
  );
}
