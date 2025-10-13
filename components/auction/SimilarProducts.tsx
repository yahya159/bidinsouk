'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Text, ActionIcon, Card, Group, Stack, Box } from '@mantine/core';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import type { AuctionProduct } from '@/types/auction';

interface SimilarProductsProps {
  products: AuctionProduct[];
  categorySlug: string;
  categoryName: string;
}

export function SimilarProducts({ products, categorySlug }: SimilarProductsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleWatchlist = async (productId: string, isWatchlisted: boolean) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      notifications.show({
        title: isWatchlisted ? "Retiré des favoris" : "Ajouté aux favoris",
        message: isWatchlisted ? "Produit retiré de votre liste de favoris." : "Produit ajouté à votre liste de favoris.",
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Erreur",
        message: "Impossible de modifier vos favoris.",
        color: "red"
      });
    }
  };

  if (!products.length) return null;

  return (
    <Card shadow="sm" padding="xl" radius="md" withBorder mb="xl">
      <Group justify="space-between" align="center" mb="xl">
        <Text size="xl" fw={700} c="dark">Produits similaires</Text>
        <Group gap="xs">
          <Text 
            component={Link} 
            href={`/categorie/${categorySlug}`} 
            size="sm" 
            c="dimmed"
            style={{ textDecoration: 'none' }}
            className="hover:text-blue-600"
          >
            Voir tous les produits
          </Text>
          <ActionIcon variant="subtle" size="sm">
            <ChevronLeft size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" size="sm">
            <ChevronRight size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Horizontal Scrollable Grid */}
      <Box style={{ overflowX: 'auto', paddingBottom: '8px' }}>
        <Group gap="lg" style={{ flexWrap: 'nowrap', minWidth: 'fit-content' }}>
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onWatchlist={handleWatchlist}
              formatPrice={formatPrice}
            />
          ))}
        </Group>
      </Box>
    </Card>
  );
}

interface ProductCardProps {
  product: AuctionProduct;
  onWatchlist: (productId: string, isWatchlisted: boolean) => void;
  formatPrice: (price: number) => string;
}

function ProductCard({ product, onWatchlist, formatPrice }: ProductCardProps) {
  return (
    <Card 
      shadow="sm" 
      padding={0} 
      radius="md" 
      withBorder 
      style={{ 
        width: '220px', 
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden'
      }}
      className="group hover:shadow-md transition-shadow"
    >
      {/* Image Container */}
      <Box style={{ position: 'relative', height: '180px' }}>
        <Link href={`/produit/${product.slug}`}>
          <Image
            src={product.images[0]?.url || ''}
            alt={product.images[0]?.alt || product.title}
            fill
            style={{ objectFit: 'cover' }}
            className="group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        
        {/* NOUVEAU Badge */}
        <Box
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: '#ff4757',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}
        >
          NOUVEAU
        </Box>

        {/* Wishlist Heart */}
        <ActionIcon
          variant="filled"
          size="sm"
          color="white"
          style={{ 
            position: 'absolute', 
            top: '8px', 
            right: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: product.watchlisted ? '#ff4757' : '#666'
          }}
          onClick={() => onWatchlist(product.id, product.watchlisted || false)}
        >
          <Heart 
            size={14}
            style={{ 
              fill: product.watchlisted ? '#ff4757' : 'none'
            }}
          />
        </ActionIcon>
      </Box>

      {/* Content */}
      <Stack gap="xs" p="md">
        <Link href={`/produit/${product.slug}`} style={{ textDecoration: 'none' }}>
          <Text 
            size="sm" 
            fw={500} 
            c="dark" 
            lineClamp={2}
            style={{ minHeight: '40px', lineHeight: '1.4' }}
            className="hover:text-blue-600 transition-colors"
          >
            {product.title}
          </Text>
        </Link>

        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            Starting bid:
          </Text>
          <Text size="lg" fw={700} c="#ff6b35">
            {formatPrice(product.currentBidMAD)} د.م
          </Text>
        </Box>

        <Button 
          component={Link} 
          href={`/produit/${product.slug}`}
          size="sm" 
          fullWidth
          color="#ff6b35"
          style={{
            backgroundColor: '#ff6b35',
            border: 'none'
          }}
        >
          Enchérir
        </Button>
      </Stack>
    </Card>
  );
}