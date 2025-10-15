'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Stack } from '@mantine/core';
import { ProductsTable } from '@/components/admin/products/ProductsTable';
import { BulkActions } from '@/components/admin/shared/BulkActions';
import { notifications } from '@mantine/notifications';

interface Product {
  id: string;
  title: string;
  brand: string | null;
  category: string | null;
  condition: 'NEW' | 'USED';
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  price: number | null;
  views: number;
  createdAt: string;
  store: {
    id: string;
    name: string;
    seller: {
      user: {
        name: string;
        email: string;
      };
    };
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search) params.append('search', search);
      if (storeFilter) params.append('storeId', storeFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (priceMin !== null) params.append('priceMin', priceMin.toString());
      if (priceMax !== null) params.append('priceMax', priceMax.toString());

      const response = await fetch(`/api/admin/products?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      console.error('Error fetching products:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch products',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, storeFilter, categoryFilter, statusFilter, priceMin, priceMax]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStoreFilter = (value: string | null) => {
    setStoreFilter(value);
    setPage(1);
  };

  const handleCategoryFilter = (value: string | null) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string | null) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePriceRangeFilter = (min: number | null, max: number | null) => {
    setPriceMin(min);
    setPriceMax(max);
    setPage(1);
  };

  const handleBulkStatusUpdate = async (status: string, ids: string[]) => {
    const promises = ids.map((id) =>
      fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    );

    const results = await Promise.all(promises);
    const successCount = results.filter((r) => r.ok).length;
    const failCount = results.length - successCount;

    fetchProducts();
    return { success: successCount, failed: failCount };
  };

  const handleBulkDelete = async (ids: string[]) => {
    const promises = ids.map((id) =>
      fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })
    );

    const results = await Promise.all(promises);
    const successCount = results.filter((r) => r.ok).length;
    const failCount = results.length - successCount;

    fetchProducts();
    return { success: successCount, failed: failCount };
  };

  const bulkActions = [
    {
      key: 'set-active',
      label: 'Set Active',
      icon: null,
      color: 'green',
      action: async (ids: string[]) => handleBulkStatusUpdate('ACTIVE', ids),
    },
    {
      key: 'set-draft',
      label: 'Set Draft',
      icon: null,
      color: 'gray',
      action: async (ids: string[]) => handleBulkStatusUpdate('DRAFT', ids),
    },
    {
      key: 'archive',
      label: 'Archive',
      icon: null,
      color: 'orange',
      action: async (ids: string[]) => handleBulkStatusUpdate('ARCHIVED', ids),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: null,
      color: 'red',
      action: handleBulkDelete,
      confirmMessage: 'Are you sure you want to delete the selected products?',
    },
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Title order={2}>Products</Title>

        {selectedIds.length > 0 && (
          <BulkActions
            selectedIds={selectedIds}
            actions={bulkActions}
            onClearSelection={() => setSelectedIds([])}
          />
        )}

        <ProductsTable
          products={products}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onStoreFilter={handleStoreFilter}
          onCategoryFilter={handleCategoryFilter}
          onStatusFilter={handleStatusFilter}
          onPriceRangeFilter={handlePriceRangeFilter}
          loading={loading}
        />
      </Stack>
    </Container>
  );
}
