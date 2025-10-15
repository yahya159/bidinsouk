'use client';

import { NumberInput, Switch, Stack, Text } from '@mantine/core';

interface AuctionSettingsProps {
  values: {
    defaultDuration: number;
    minIncrement: number;
    autoExtendEnabled: boolean;
    autoExtendMinutes: number;
    reservePriceRequired: boolean;
    commissionRate: number;
  };
  onChange: (key: string, value: any) => void;
}

export function AuctionSettings({ values, onChange }: AuctionSettingsProps) {
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Configure default auction parameters and behavior
      </Text>

      <NumberInput
        label="Default Duration (days)"
        description="Default auction duration when creating new auctions"
        value={values.defaultDuration}
        onChange={(value) => onChange('defaultDuration', value)}
        min={1}
        max={30}
        required
      />

      <NumberInput
        label="Minimum Bid Increment"
        description="Minimum amount by which bids must increase"
        value={values.minIncrement}
        onChange={(value) => onChange('minIncrement', value)}
        min={0.1}
        step={0.1}
        decimalScale={2}
        prefix="$"
        required
      />

      <Switch
        label="Enable Auto-Extend"
        description="Automatically extend auctions when bids are placed near the end"
        checked={values.autoExtendEnabled}
        onChange={(event) => onChange('autoExtendEnabled', event.currentTarget.checked)}
      />

      {values.autoExtendEnabled && (
        <NumberInput
          label="Auto-Extend Minutes"
          description="Number of minutes to extend the auction"
          value={values.autoExtendMinutes}
          onChange={(value) => onChange('autoExtendMinutes', value)}
          min={1}
          max={60}
          required
        />
      )}

      <Switch
        label="Require Reserve Price"
        description="Make reserve price mandatory for all auctions"
        checked={values.reservePriceRequired}
        onChange={(event) => onChange('reservePriceRequired', event.currentTarget.checked)}
      />

      <NumberInput
        label="Commission Rate (%)"
        description="Platform commission on auction sales"
        value={values.commissionRate}
        onChange={(value) => onChange('commissionRate', value)}
        min={0}
        max={100}
        step={0.5}
        decimalScale={2}
        suffix="%"
        required
      />
    </Stack>
  );
}
