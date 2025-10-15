import { Card, Image, Stack, Text, Group, Badge, Button, ActionIcon } from '@mantine/core';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

export interface ProductCardProps {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  compareAtPrice?: number;
  condition: 'NEW' | 'USED';
  category?: string;
  rating?: number;
  reviewsCount?: number;
  inStock: boolean;
  seller?: {
    name: string;
  };
  onAddToCart?: (e: React.MouseEvent) => void;
  onAddToWishlist?: (e: React.MouseEvent) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

export const ProductCard = memo(function ProductCard({
  id,
  title,
  imageUrl,
  price,
  compareAtPrice,
  condition,
  category,
  rating,
  reviewsCount,
  inStock,
  seller,
  onAddToCart,
  onAddToWishlist,
}: ProductCardProps) {
  const discountPct = compareAtPrice && compareAtPrice > price
    ? Math.round((1 - price / compareAtPrice) * 100)
    : 0;

  return (
    <Card
      component={Link}
      href={`/products/${id}`}
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{ 
        cursor: 'pointer', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      className="hover:shadow-lg"
    >
      {/* Image Section */}
      <Card.Section style={{ position: 'relative' }}>
        <Image
          src={imageUrl}
          alt={title}
          height={200}
          fit="cover"
          fallbackSrc="https://placehold.co/400x400?text=No+Image"
        />
        
        {/* Badges */}
        <Group 
          gap="xs" 
          style={{ 
            position: 'absolute', 
            top: 8, 
            left: 8, 
            right: 8 
          }}
          justify="space-between"
        >
          <div>
            {discountPct > 0 && (
              <Badge color="red" size="sm" variant="filled">
                -{discountPct}%
              </Badge>
            )}
          </div>
          <Badge 
            color={condition === 'NEW' ? 'green' : 'blue'} 
            size="sm"
          >
            {condition === 'NEW' ? 'Neuf' : 'Occasion'}
          </Badge>
        </Group>

        {/* Wishlist Button */}
        <ActionIcon
          style={{ 
            position: 'absolute', 
            bottom: 8, 
            right: 8 
          }}
          variant="light"
          color="red"
          size="md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToWishlist?.(e);
          }}
          aria-label="Ajouter aux favoris"
        >
          <Heart size={16} />
        </ActionIcon>
      </Card.Section>

      {/* Content */}
      <Stack gap="sm" mt="md" style={{ flex: 1 }} justify="space-between">
        <div>
          {/* Category */}
          {category && (
            <Text size="xs" c="dimmed" mb="xs">
              {category}
            </Text>
          )}

          {/* Title */}
          <Text fw={500} size="sm" lineClamp={2} mb="xs">
            {title}
          </Text>

          {/* Rating */}
          {rating && (
            <Group gap="xs" mb="xs">
              <Group gap={2}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    style={{
                      color: i < Math.floor(rating) ? '#fbbf24' : '#d1d5db',
                      fill: i < Math.floor(rating) ? '#fbbf24' : 'none',
                    }}
                  />
                ))}
              </Group>
              {reviewsCount !== undefined && (
                <Text size="xs" c="dimmed">
                  ({reviewsCount})
                </Text>
              )}
            </Group>
          )}

          {/* Price */}
          <Group gap="xs" align="baseline" mb="xs">
            <Text fw={700} size="lg" c="blue">
              {formatPrice(price)} د.م
            </Text>
            {compareAtPrice && compareAtPrice > price && (
              <Text size="xs" c="dimmed" td="line-through">
                {formatPrice(compareAtPrice)} د.م
              </Text>
            )}
          </Group>

          {/* Seller */}
          {seller && (
            <Text size="xs" c="dimmed">
              Vendu par {seller.name}
            </Text>
          )}
        </div>

        <div>
          {/* Stock Badge */}
          <Badge 
            color={inStock ? 'green' : 'red'} 
            variant="light" 
            size="sm"
            fullWidth
            mb="xs"
          >
            {inStock ? 'En stock' : 'Rupture de stock'}
          </Badge>

          {/* Action Buttons */}
          <Group gap="xs">
            <Button
              style={{ flex: 1 }}
              leftSection={<ShoppingCart size={16} />}
              disabled={!inStock}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart?.(e);
              }}
              size="sm"
            >
              Acheter
            </Button>
            <ActionIcon
              variant="outline"
              size={36}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToWishlist?.(e);
              }}
              aria-label="Ajouter aux favoris"
            >
              <Heart size={16} />
            </ActionIcon>
          </Group>
        </div>
      </Stack>
    </Card>
  );
});

