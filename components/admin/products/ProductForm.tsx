'use client';

import { useForm } from '@mantine/form';
import {
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Button,
  Stack,
  Group,
  Paper,
  Title,
  TagsInput,
  FileInput,
  Text,
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { ProductCondition, ProductStatus } from '@prisma/client';

interface ProductFormData {
  title: string;
  description: string;
  brand: string;
  category: string;
  condition: ProductCondition;
  status: ProductStatus;
  price: number | string;
  compareAtPrice: number | string;
  storeId: string;
  tags: string[];
  sku: string;
  barcode: string;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  stores: Array<{ value: string; label: string }>;
  categories?: Array<{ value: string; label: string }>;
}

export function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  stores,
  categories = [],
}: ProductFormProps) {
  const form = useForm<ProductFormData>({
    initialValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      brand: initialData?.brand || '',
      category: initialData?.category || '',
      condition: initialData?.condition || 'USED',
      status: initialData?.status || 'DRAFT',
      price: initialData?.price || '',
      compareAtPrice: initialData?.compareAtPrice || '',
      storeId: initialData?.storeId || '',
      tags: initialData?.tags || [],
      sku: initialData?.sku || '',
      barcode: initialData?.barcode || '',
    },

    validate: {
      title: (value) => (!value ? 'Title is required' : null),
      storeId: (value) => (!value ? 'Store is required' : null),
      condition: (value) => (!value ? 'Condition is required' : null),
      price: (value) => {
        if (value && typeof value === 'string') {
          const num = parseFloat(value);
          if (isNaN(num) || num < 0) {
            return 'Price must be a positive number';
          }
        }
        return null;
      },
      compareAtPrice: (value) => {
        if (value && typeof value === 'string') {
          const num = parseFloat(value);
          if (isNaN(num) || num < 0) {
            return 'Compare at price must be a positive number';
          }
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: ProductFormData) => {
    await onSubmit(values);
  };

  return (
    <Paper p="md" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Title order={3}>
            {initialData ? 'Edit Product' : 'Create New Product'}
          </Title>

          <TextInput
            label="Title"
            placeholder="Enter product title"
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Description"
            placeholder="Enter product description"
            minRows={4}
            {...form.getInputProps('description')}
          />

          <Group grow>
            <TextInput
              label="Brand"
              placeholder="Enter brand name"
              {...form.getInputProps('brand')}
            />

            <Select
              label="Category"
              placeholder="Select category"
              data={categories.length > 0 ? categories : [
                { value: 'Electronics', label: 'Electronics' },
                { value: 'Fashion', label: 'Fashion' },
                { value: 'Home', label: 'Home' },
                { value: 'Sports', label: 'Sports' },
                { value: 'Books', label: 'Books' },
                { value: 'Other', label: 'Other' },
              ]}
              searchable
              clearable
              {...form.getInputProps('category')}
            />
          </Group>

          <Group grow>
            <Select
              label="Store"
              placeholder="Select store"
              data={stores}
              required
              searchable
              {...form.getInputProps('storeId')}
            />

            <Select
              label="Condition"
              placeholder="Select condition"
              data={[
                { value: 'NEW', label: 'New' },
                { value: 'USED', label: 'Used' },
              ]}
              required
              {...form.getInputProps('condition')}
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Price"
              placeholder="0.00"
              min={0}
              decimalScale={2}
              fixedDecimalScale
              prefix="$"
              {...form.getInputProps('price')}
            />

            <NumberInput
              label="Compare at Price"
              placeholder="0.00"
              min={0}
              decimalScale={2}
              fixedDecimalScale
              prefix="$"
              {...form.getInputProps('compareAtPrice')}
            />
          </Group>

          <Select
            label="Status"
            placeholder="Select status"
            data={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'ARCHIVED', label: 'Archived' },
            ]}
            required
            {...form.getInputProps('status')}
          />

          <Group grow>
            <TextInput
              label="SKU"
              placeholder="Enter SKU"
              {...form.getInputProps('sku')}
            />

            <TextInput
              label="Barcode"
              placeholder="Enter barcode"
              {...form.getInputProps('barcode')}
            />
          </Group>

          <TagsInput
            label="Tags"
            placeholder="Enter tags"
            description="Press Enter to add a tag"
            {...form.getInputProps('tags')}
          />

          <FileInput
            label="Product Images"
            placeholder="Upload images"
            leftSection={<IconUpload size={16} />}
            multiple
            accept="image/*"
            description="Upload product images (not yet implemented)"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {initialData ? 'Update Product' : 'Create Product'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
