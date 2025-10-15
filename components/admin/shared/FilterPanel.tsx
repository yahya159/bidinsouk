'use client';

import { useState, useEffect } from 'react';
import {
  Drawer,
  Button,
  Stack,
  Group,
  Badge,
  Text,
  TextInput,
  Select,
  NumberInput,
  MultiSelect,
  Box,
  Divider,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconFilter, IconX } from '@tabler/icons-react';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'number' | 'date' | 'daterange';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: any;
}

export interface FilterPanelProps {
  opened: boolean;
  onClose: () => void;
  fields: FilterField[];
  values: FilterValues;
  onApply: (values: FilterValues) => void;
  onReset: () => void;
}

export function FilterPanel({
  opened,
  onClose,
  fields,
  values,
  onApply,
  onReset,
}: FilterPanelProps) {
  const [localValues, setLocalValues] = useState<FilterValues>(values);

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const handleChange = (key: string, value: any) => {
    setLocalValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    onApply(localValues);
    onClose();
  };

  const handleReset = () => {
    setLocalValues({});
    onReset();
  };

  const activeFiltersCount = Object.values(values).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (v instanceof Date) return true;
    return v !== null && v !== undefined && v !== '';
  }).length;

  const renderField = (field: FilterField) => {
    const value = localValues[field.key];

    switch (field.type) {
      case 'text':
        return (
          <TextInput
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => handleChange(field.key, e.currentTarget.value)}
          />
        );

      case 'select':
        return (
          <Select
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            data={field.options || []}
            value={value || null}
            onChange={(val) => handleChange(field.key, val)}
            clearable
          />
        );

      case 'multiselect':
        return (
          <MultiSelect
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            data={field.options || []}
            value={value || []}
            onChange={(val) => handleChange(field.key, val)}
            clearable
          />
        );

      case 'number':
        return (
          <NumberInput
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(val) => handleChange(field.key, val)}
          />
        );

      case 'date':
        return (
          <DatePickerInput
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            value={value || null}
            onChange={(val) => handleChange(field.key, val)}
            clearable
          />
        );

      case 'daterange':
        return (
          <DatePickerInput
            key={field.key}
            type="range"
            label={field.label}
            placeholder={field.placeholder}
            value={value || [null, null]}
            onChange={(val) => handleChange(field.key, val)}
            clearable
          />
        );

      default:
        return null;
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconFilter size={20} />
          <Text fw={600}>Filters</Text>
          {activeFiltersCount > 0 && (
            <Badge size="sm" variant="filled">
              {activeFiltersCount}
            </Badge>
          )}
        </Group>
      }
      position="right"
      size="md"
    >
      <Stack gap="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
        <Box style={{ flex: 1, overflowY: 'auto' }}>
          <Stack gap="md">
            {fields.map((field) => renderField(field))}
          </Stack>
        </Box>

        <Divider />

        <Group justify="space-between">
          <Button variant="subtle" onClick={handleReset} leftSection={<IconX size={16} />}>
            Reset
          </Button>
          <Group gap="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply Filters</Button>
          </Group>
        </Group>
      </Stack>
    </Drawer>
  );
}

export function FilterChips({
  filters,
  fields,
  onRemove,
}: {
  filters: FilterValues;
  fields: FilterField[];
  onRemove: (key: string) => void;
}) {
  const activeFilters = Object.entries(filters).filter(([_, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value instanceof Date) return true;
    return value !== null && value !== undefined && value !== '';
  });

  if (activeFilters.length === 0) return null;

  const getFilterLabel = (key: string, value: any) => {
    const field = fields.find((f) => f.key === key);
    if (!field) return `${key}: ${value}`;

    let displayValue = value;

    if (field.type === 'select' && field.options) {
      const option = field.options.find((opt) => opt.value === value);
      displayValue = option?.label || value;
    } else if (field.type === 'multiselect' && Array.isArray(value)) {
      displayValue = value.length === 1 ? value[0] : `${value.length} selected`;
    } else if (value instanceof Date) {
      displayValue = value.toLocaleDateString();
    } else if (Array.isArray(value) && value.length === 2) {
      // Date range
      const [start, end] = value;
      if (start && end) {
        displayValue = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      }
    }

    return `${field.label}: ${displayValue}`;
  };

  return (
    <Group gap="xs">
      {activeFilters.map(([key, value]) => (
        <Badge
          key={key}
          variant="light"
          rightSection={
            <IconX
              size={12}
              style={{ cursor: 'pointer' }}
              onClick={() => onRemove(key)}
            />
          }
          style={{ paddingRight: 3 }}
        >
          {getFilterLabel(key, value)}
        </Badge>
      ))}
    </Group>
  );
}
