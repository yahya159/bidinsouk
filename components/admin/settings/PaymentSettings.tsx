'use client';

import { NumberInput, Stack, Text, MultiSelect } from '@mantine/core';

interface PaymentSettingsProps {
  values: {
    platformFeeRate: number;
    vendorCommissionRate: number;
    minOrderAmount: number;
    refundWindowDays: number;
    paymentMethods: string[];
  };
  onChange: (key: string, value: any) => void;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash_on_delivery', label: 'Cash on Delivery' },
];

export function PaymentSettings({ values, onChange }: PaymentSettingsProps) {
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Configure payment processing and fee structure
      </Text>

      <NumberInput
        label="Platform Fee Rate (%)"
        description="Platform fee charged on all transactions"
        value={values.platformFeeRate}
        onChange={(value) => onChange('platformFeeRate', value)}
        min={0}
        max={100}
        step={0.1}
        decimalScale={2}
        suffix="%"
        required
      />

      <NumberInput
        label="Vendor Commission Rate (%)"
        description="Commission rate for vendor sales"
        value={values.vendorCommissionRate}
        onChange={(value) => onChange('vendorCommissionRate', value)}
        min={0}
        max={100}
        step={0.5}
        decimalScale={2}
        suffix="%"
        required
      />

      <NumberInput
        label="Minimum Order Amount"
        description="Minimum order value required for checkout"
        value={values.minOrderAmount}
        onChange={(value) => onChange('minOrderAmount', value)}
        min={0}
        step={1}
        decimalScale={2}
        prefix="$"
        required
      />

      <NumberInput
        label="Refund Window (days)"
        description="Number of days customers can request refunds"
        value={values.refundWindowDays}
        onChange={(value) => onChange('refundWindowDays', value)}
        min={0}
        max={90}
        required
      />

      <MultiSelect
        label="Payment Methods"
        description="Available payment methods for customers"
        data={PAYMENT_METHOD_OPTIONS}
        value={values.paymentMethods}
        onChange={(value) => onChange('paymentMethods', value)}
        required
      />
    </Stack>
  );
}
