'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Card,
  Badge,
  Button,
  Tabs,
  Loader,
  Center,
  Pagination,
  Select,
  TextInput
} from '@mantine/core';
import { Search, Package, Gavel, Store, Filter } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  type: 'auction' | 'product' | 'store';
  title: string;
  description: string;
  category?: string;
  currentBid?: number;
  status?: string;
  url: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<{
    auctions: SearchResult[];
    products: SearchResult[];
    stores: SearchResult[];
    total: number;
  }>({ auctions: [], products: [], stores: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (query) {
      performSearch(query, activeTab, page);
    }
  }, [query, activeTab, page]);

  const performSearch = async (searchQuery: string, type: string = 'all', currentPage: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&type=${type}&limit=20&page=${currentPage}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'auction': return <Gavel size={20} />;
      case 'product': return <Package size={20} />;
      case 'store': return <Store size={20} />;
      default: return <Search size={20} />;
    }
  };

  const getResultBadgeColor = (type: string) => {
    switch (type) {
      case 'auction': return 'orange';
      case 'product': return 'blue';
      case 'store': return 'green';
      default: return 'gray';
    }
  };

  const renderResults = (resultsList: SearchResult[]) => {
    if (resultsList.length === 0) {
      return (
        <Center py="xl">
          <Stack align="center" gap="md">
            <Search size={48} color="#adb5bd" />
            <Text size="lg" c="dimmed">Aucun résultat trouvé</Text>
            <Text size="sm" c="dimmed" ta="center">
              Essayez avec des mots-clés différents ou vérifiez l'orthographe
            </Text>
          </Stack>
        </Center>
      );
    }

    return (
      <Stack gap="md">
        {resultsList.map((result) => (
          <Card key={`${result.type}-${result.id}`} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" align="flex-start">
              <Group gap="md" align="flex-start" style={{ flex: 1 }}>
                {getResultIcon(result.type)}
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Group justify="space-between">
                    <Text fw={600} size="lg" component={Link} href={result.url} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {result.title}
                    </Text>
                    <Badge color={getResultBadgeColor(result.type)}>
                      {result.type === 'auction' ? 'Enchère' : 
                       result.type === 'product' ? 'Produit' : 'Boutique'}
                    </Badge>
                  </Group>
                  
                  {result.description && (
                    <Text c="dimmed" lineClamp={2}>
                      {result.description}
                    </Text>
                  )}
                  
                  <Group gap="md">
                    {result.category && (
                      <Badge variant="light" color="blue" size="sm">
                        {result.category}
                      </Badge>
                    )}
                    {result.currentBid && (
                      <Text fw={600} c="orange">
                        {new Intl.NumberFormat('fr-FR').format(result.currentBid)} MAD
                      </Text>
                    )}
                    {result.status && (
                      <Badge variant="light" color={result.status === 'ACTIVE' ? 'green' : 'gray'} size="sm">
                        {result.status}
                      </Badge>
                    )}
                  </Group>
                </Stack>
              </Group>
              
              <Button component={Link} href={result.url} variant="light" size="sm">
                Voir détails
              </Button>
            </Group>
          </Card>
        ))}
      </Stack>
    );
  };

  const getAllResults = () => {
    return [...results.auctions, ...results.products, ...results.stores];
  };

  const getTabResults = () => {
    switch (activeTab) {
      case 'auctions': return results.auctions;
      case 'products': return results.products;
      case 'stores': return results.stores;
      default: return getAllResults();
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1} mb="sm">
            Résultats de recherche
          </Title>
          {query && (
            <Text c="dimmed" size="lg">
              Résultats pour "{query}" ({results.total} résultat{results.total > 1 ? 's' : ''})
            </Text>
          )}
        </div>

        {/* Search Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'all')}>
          <Tabs.List>
            <Tabs.Tab value="all" leftSection={<Search size={16} />}>
              Tout ({results.total})
            </Tabs.Tab>
            <Tabs.Tab value="auctions" leftSection={<Gavel size={16} />}>
              Enchères ({results.auctions.length})
            </Tabs.Tab>
            <Tabs.Tab value="products" leftSection={<Package size={16} />}>
              Produits ({results.products.length})
            </Tabs.Tab>
            <Tabs.Tab value="stores" leftSection={<Store size={16} />}>
              Boutiques ({results.stores.length})
            </Tabs.Tab>
          </Tabs.List>

          {/* Results */}
          <Tabs.Panel value={activeTab} pt="xl">
            {loading ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" />
                  <Text>Recherche en cours...</Text>
                </Stack>
              </Center>
            ) : (
              renderResults(getTabResults())
            )}
          </Tabs.Panel>
        </Tabs>

        {/* Pagination */}
        {!loading && getTabResults().length > 0 && (
          <Group justify="center">
            <Pagination
              value={page}
              onChange={setPage}
              total={Math.ceil(results.total / 20)}
            />
          </Group>
        )}
      </Stack>
    </Container>
  );
}
