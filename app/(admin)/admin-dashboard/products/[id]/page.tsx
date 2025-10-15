'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Button, Group, Stack, Loader, Center } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { ProductDetailCard } from '@/components/admin/products/ProductDetailCard';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { notifications } from '@mantine/notifications';
import { ProductStatus } from '@prisma/client';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      setProduct(data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch product details',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const handleEdit = () => {
    router.push(`/admin-dashboard/products/${productId}/edit`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product');
      }

      notifications.show({
        title: 'Success',
        message: 'Product deleted successfully',
        color: 'green',
      });

      router.push('/admin-dashboard/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete product',
        color: 'red',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleStatusChange = async (status: ProductStatus) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product status');
      }

      notifications.show({
        title: 'Success',
        message: 'Product status updated successfully',
        color: 'green',
      });

      fetchProduct();
    } catch (error) {
      console.error('Error updating product status:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update product status',
        color: 'red',
      });
    }
  };

  if (loading) {
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
        </Group>

        <ProductDetailCard
          product={product}
          onEdit={handleEdit}
          onDelete={() => setDeleteDialogOpen(true)}
          onStatusChange={handleStatusChange}
        />

        <ConfirmDialog
          opened={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Product"
          message="Are you sure you want to delete this product? This action cannot be undone."
          confirmLabel="Delete"
          confirmColor="red"
          loading={deleting}
        />
      </Stack>
    </Container>
  );
}
