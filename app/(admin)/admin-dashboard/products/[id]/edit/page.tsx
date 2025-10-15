'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Button, Group, Stack, Loader, Center } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { notifications } from '@mantine/notifications';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [stores, setStores] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product details
        const productResponse = await fetch(`/api/admin/products/${productId}`);
        if (productResponse.ok) {
          const productData = await productResponse.json();
          setProduct(productData.product);
        } else {
          throw new Error('Failed to fetch product');
        }

        // Fetch stores for the dropdown
        const storesResponse = await fetch('/api/admin/stores');
        if (storesResponse.ok) {
          const storesData = await storesResponse.json();
          const storeOptions = storesData.stores.map((store: any) => ({
            value: store.id.toString(),
            label: store.name,
          }));
          setStores(storeOptions);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to fetch product details',
          color: 'red',
        });
      } finally {
        setFetchingProduct(false);
      }
    };

    fetchData();
  }, [productId]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      notifications.show({
        title: 'Success',
        message: 'Product updated successfully',
        color: 'green',
      });

      router.push(`/admin-dashboard/products/${productId}`);
    } catch (error) {
      console.error('Error updating product:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update product',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (fetchingProduct) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ minHeight: 400 }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ minHeight: 400 }}>
          <Stack align="center">
            <Title order={3}>Product not found</Title>
            <Button leftSection={<IconArrowLeft size={16} />} onClick={() => router.back()}>
              Go Back
            </Button>
          </Stack>
        </Center>
      </Container>
    );
  }

  const initialData = {
    title: product.title,
    description: product.description || '',
    brand: product.brand || '',
    category: product.category || '',
    condition: product.condition,
    status: product.status,
    price: product.price || '',
    compareAtPrice: product.compareAtPrice || '',
    storeId: product.store.id.toString(),
    tags: product.tags || [],
    sku: product.sku || '',
    barcode: product.barcode || '',
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group>
          <Button
            variant="default"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Title order={2}>Edit Product</Title>
        </Group>

        <ProductForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          stores={stores}
        />
      </Stack>
    </Container>
  );
}
