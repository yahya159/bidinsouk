'use client';

import { useState, useEffect, useRef } from 'react';
import {
  TextInput,
  Box,
  Paper,
  Text,
  Group,
  Badge,
  Loader,
  ActionIcon,
  Stack,
  Anchor
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Search, Clock, Package, Store, Gavel, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = 'Rechercher des produits, enchères, boutiques...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Search API call
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [debouncedQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        const allResults = [
          ...data.auctions || [],
          ...data.products || [],
          ...data.stores || []
        ];
        setResults(allResults);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Save to recent searches
      const newRecentSearches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
      
      // Navigate to search results page
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
      setQuery('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch(query);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery('');
    router.push(result.url);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'auction': return <Gavel size={16} />;
      case 'product': return <Package size={16} />;
      case 'store': return <Store size={16} />;
      default: return <Search size={16} />;
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

  return (
    <Box ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 600 }}>
      <TextInput
        placeholder={placeholder}
        leftSection={<Search size={18} />}
        rightSection={loading ? <Loader size={18} /> : null}
        radius="xl"
        size="md"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        onFocus={() => setShowResults(true)}
        styles={{
          input: {
            border: '2px solid #e9ecef',
            '&:focus': {
              borderColor: '#228be6',
            },
          },
        }}
      />

      {showResults && (
        <Paper
          shadow="lg"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            marginTop: 4,
            maxHeight: 400,
            overflowY: 'auto'
          }}
          p="sm"
        >
          {query.length < 2 ? (
            // Show recent searches when not searching
            <Stack gap="xs">
              {recentSearches.length > 0 && (
                <>
                  <Group justify="space-between">
                    <Text size="sm" fw={500} c="dimmed">Recherches récentes</Text>
                    <ActionIcon size="sm" variant="subtle" onClick={clearRecentSearches}>
                      <X size={12} />
                    </ActionIcon>
                  </Group>
                  {recentSearches.map((search, index) => (
                    <Group
                      key={index}
                      gap="xs"
                      style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}
                      onClick={() => {
                        setQuery(search);
                        performSearch(search);
                      }}
                    >
                      <Clock size={14} />
                      <Text size="sm">{search}</Text>
                    </Group>
                  ))}
                </>
              )}
              <Text size="sm" c="dimmed" ta="center" py="md">
                Tapez au moins 2 caractères pour rechercher
              </Text>
            </Stack>
          ) : results.length > 0 ? (
            // Show search results
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
              </Text>
              {results.map((result) => (
                <Box
                  key={`${result.type}-${result.id}`}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#f8f9fa'
                    }
                  }}
                  onClick={() => handleResultClick(result)}
                >
                  <Group justify="space-between" align="flex-start">
                    <Group gap="sm" align="flex-start" style={{ flex: 1 }}>
                      {getResultIcon(result.type)}
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {result.title}
                        </Text>
                        {result.description && (
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {result.description}
                          </Text>
                        )}
                        {result.category && (
                          <Text size="xs" c="blue">
                            {result.category}
                          </Text>
                        )}
                        {result.currentBid && (
                          <Text size="xs" fw={500} c="orange">
                            {result.currentBid.toLocaleString()} MAD
                          </Text>
                        )}
                      </Stack>
                    </Group>
                    <Badge size="xs" color={getResultBadgeColor(result.type)}>
                      {result.type === 'auction' ? 'Enchère' : 
                       result.type === 'product' ? 'Produit' : 'Boutique'}
                    </Badge>
                  </Group>
                </Box>
              ))}
              <Box style={{ borderTop: '1px solid #e9ecef', paddingTop: 8, marginTop: 4 }}>
                <Anchor
                  size="sm"
                  onClick={() => handleSearch(query)}
                  style={{ cursor: 'pointer' }}
                >
                  Voir tous les résultats pour "{query}"
                </Anchor>
              </Box>
            </Stack>
          ) : loading ? (
            <Group justify="center" py="md">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Recherche en cours...</Text>
            </Group>
          ) : (
            <Text size="sm" c="dimmed" ta="center" py="md">
              Aucun résultat trouvé pour "{query}"
            </Text>
          )}
        </Paper>
      )}
    </Box>
  );
}