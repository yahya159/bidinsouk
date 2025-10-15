'use client';

import { useEffect, useState } from 'react';
import {
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Switch,
  Button,
  Stack,
  Group,
  Paper,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

interface AuctionFormData {
  title: string;
  description: string;
  category: string;
  productId: string;
  storeId: string;
  startPrice: number;
  reservePrice: number | null;
  minIncrement: number;
  startAt: Date;
  endAt: Date;
  autoExtend: boolean;
  extendMinutes: number;
}

interface AuctionFormProps {
  initialData?: Partial<AuctionFormData>;
  auctionId?: string;
  onSuccess?: () => void;
}

interface Store {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
}

export function AuctionForm({ initialData, auctionId, onSuccess }: AuctionFormProps) {
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const form = useForm<AuctionFormData>({
    initialValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      productId: initialData?.productId || '',
      storeId: initialData?.storeId || '',
      startPrice: initialData?.startPrice || 0,
      reservePrice: initialData?.reservePrice || null,
      minIncrement: initialData?.minIncrement || 1,
      startAt: initialData?.startAt || new Date(),
      endAt: initialData?.endAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      autoExtend: initialData?.autoExtend || false,
      extendMinutes: initialData?.extendMinutes || 5,
    },
    validate: {
      title: (value) => (!value ? 'Title is required' : null),
      storeId: (value) => (!value ? 'Store is required' : null),
      startPrice: (value) => (value <= 0 ? 'Start price must be greater than 0' : null),
      minIncrement: (value) => (value <= 0 ? 'Min increment must be greater than 0' : null),
      startAt: (value) => (!value ? 'Start date is required' : null),
      endAt: (value, values) => {
        if (!value) return 'End date is required';
        if (value <= values.startAt) return 'End date must be after start date';
        return null;
      },
    },
  });

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (form.values.storeId) {
      fetchProducts(form.values.storeId);
    }
  }, [form.values.storeId]);

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/admin/stores?pageSize=1000');
      if (response.ok) {
        const data = await response.json();
        setStores(data.stores);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoadingStores(false);
    }
  };

  const fetchProducts = async (storeId: string) => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`/api/admin/products?storeId=${storeId}&pageSize=1000`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (values: AuctionFormData) => {
    setLoading(true);
    try {
      const url = auctionId
        ? `/api/admin/auctions/${auctionId}`
        : '/api/admin/auctions';
      const method = auctionId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: `Auction ${auctionId ? 'updated' : 'created'} successfully`,
          color: 'green',
        });
        if (onSuccess) onSuccess();
      } else {
        const error = await response.json();
        notifications.show({
          title: 'Error',
          message: error.error || 'Failed to save auction',
          color: 'red',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports',
    'Toys',
    'Books',
    'Art',
    'Collectibles',
    'Other',
  ];

  return (
    <Paper p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="Auction title"
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Description"
            placeholder="Auction description"
            minRows={3}
            {...form.getInputProps('description')}
          />

          <Select
            label="Store"
            placeholder="Select store"
            required
            data={stores.map((store) => ({
              value: store.id,
              label: store.name,
            }))}
            disabled={loadingStores}
            {...form.getInputProps('storeId')}
          />

          <Select
            label="Product (Optional)"
            placeholder="Select product"
            clearable
            data={products.map((product) => ({
              value: product.id,
              label: product.title,
            }))}
            disabled={!form.values.storeId || loadingProducts}
            {...form.getInputProps('productId')}
          />

          <Select
            label="Category"
            placeholder="Select category"
            clearable
            data={categories}
            {...form.getInputProps('category')}
          />

          <Group grow>
            <NumberInput
              label="Start Price"
              placeholder="0.00"
              required
              min={0}
              decimalScale={2}
              prefix="$"
              {...form.getInputProps('startPrice')}
            />

            <NumberInput
              label="Reserve Price (Optional)"
              placeholder="0.00"
              min={0}
              decimalScale={2}
              prefix="$"
              {...form.getInputProps('reservePrice')}
            />
          </Group>

          <NumberInput
            label="Minimum Bid Increment"
            placeholder="1.00"
            required
            min={0.01}
            decimalScale={2}
            prefix="$"
            {...form.getInputProps('minIncrement')}
          />

          <Group grow>
            <DateTimePicker
              label="Start Date & Time"
              placeholder="Select start date"
              required
              {...form.getInputProps('startAt')}
            />

            <DateTimePicker
              label="End Date & Time"
              placeholder="Select end date"
              required
              {...form.getInputProps('endAt')}
            />
          </Group>

          <Switch
            label="Auto-extend auction when bid placed near end"
            {...form.getInputProps('autoExtend', { type: 'checkbox' })}
          />

          {form.values.autoExtend && (
            <NumberInput
              label="Extension Duration (minutes)"
              placeholder="5"
              min={1}
              max={60}
              {...form.getInputProps('extendMinutes')}
            />
          )}

          <Group justify="flex-end" mt="md">
            <Button type="submit" loading={loading}>
              {auctionId ? 'Update Auction' : 'Create Auction'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
