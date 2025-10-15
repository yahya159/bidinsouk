'use client';

import {
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Grid,
  Title,
  Image,
  Button,
  Menu,
  ActionIcon,
  SimpleGrid,
} from '@mantine/core';
import { IconEdit, IconTrash, IconDots, IconEye } from '@tabler/icons-react';
import { ProductCondition, ProductStatus } from '@prisma/client';

interface ProductDetail {
  id: string;
  title: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  condition: ProductCondition;
  status: ProductStatus;
  price: number | null;
  compareAtPrice: number | null;
  sku: string | null;
  barcode: string | null;
  images: any;
  tags: any;
  views: number;
  createdAt: string;
  updatedAt: string;
  store: {
    id: string;
    name: string;
    seller: {
      user: {
        id: string;
        name: string;
        email: string;
      };
    };
  };
}

interface ProductDetailCardProps {
  product: ProductDetail;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: ProductStatus) => void;
}

export function ProductDetailCard({
  product,
  onEdit,
  onDelete,
  onStatusChange,
}: ProductDetailCardProps) {
  const getStatusBadgeColor = (status: ProductStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'DRAFT':
        return 'gray';
      case 'ARCHIVED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getConditionBadgeColor = (condition: ProductCondition) => {
    return condition === 'NEW' ? 'blue' : 'orange';
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const images = product.images ? (Array.isArray(product.images) ? product.images : []) : [];
  const tags = product.tags ? (Array.isArray(product.tags) ? product.tags : []) : [];

  return (
    <Stack gap="md">
      {/* Header with Actions */}
      <Card withBorder>
        <Group justify="space-between">
          <div>
            <Title order={2}>{product.title}</Title>
            <Group gap="xs" mt="xs">
              <Badge color={getStatusBadgeColor(product.status)} variant="light">
                {product.status}
              </Badge>
              <Badge color={getConditionBadgeColor(product.condition)} variant="light">
                {product.condition}
              </Badge>
            </Group>
          </div>
          <Group gap="xs">
            <Button leftSection={<IconEdit size={16} />} onClick={onEdit}>
              Edit
            </Button>
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <ActionIcon variant="default" size="lg">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Change Status</Menu.Label>
                <Menu.Item onClick={() => onStatusChange('ACTIVE')}>
                  Set Active
                </Menu.Item>
                <Menu.Item onClick={() => onStatusChange('DRAFT')}>
                  Set Draft
                </Menu.Item>
                <Menu.Item onClick={() => onStatusChange('ARCHIVED')}>
                  Archive
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={onDelete}>
                  Delete Product
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Card>

      <Grid>
        {/* Images */}
        {images.length > 0 && (
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder>
              <Title order={4} mb="md">
                Images
              </Title>
              <SimpleGrid cols={2} spacing="sm">
                {images.map((image: string, index: number) => (
                  <Image
                    key={index}
                    src={image}
                    alt={`${product.title} - ${index + 1}`}
                    height={200}
                    fit="contain"
                  />
                ))}
              </SimpleGrid>
            </Card>
          </Grid.Col>
        )}

        {/* Product Information */}
        <Grid.Col span={{ base: 12, md: images.length > 0 ? 6 : 12 }}>
          <Card withBorder>
            <Title order={4} mb="md">
              Product Information
            </Title>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={500}>Price:</Text>
                <Text size="lg" fw={700} c="blue">
                  {formatPrice(product.price)}
                </Text>
              </Group>
              {product.compareAtPrice && (
                <Group justify="space-between">
                  <Text fw={500}>Compare at Price:</Text>
                  <Text td="line-through" c="dimmed">
                    {formatPrice(product.compareAtPrice)}
                  </Text>
                </Group>
              )}
              {product.brand && (
                <Group justify="space-between">
                  <Text fw={500}>Brand:</Text>
                  <Text>{product.brand}</Text>
                </Group>
              )}
              {product.category && (
                <Group justify="space-between">
                  <Text fw={500}>Category:</Text>
                  <Text>{product.category}</Text>
                </Group>
              )}
              {product.sku && (
                <Group justify="space-between">
                  <Text fw={500}>SKU:</Text>
                  <Text>{product.sku}</Text>
                </Group>
              )}
              {product.barcode && (
                <Group justify="space-between">
                  <Text fw={500}>Barcode:</Text>
                  <Text>{product.barcode}</Text>
                </Group>
              )}
              <Group justify="space-between">
                <Text fw={500}>Views:</Text>
                <Group gap={4}>
                  <IconEye size={16} />
                  <Text>{product.views}</Text>
                </Group>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Description */}
        {product.description && (
          <Grid.Col span={12}>
            <Card withBorder>
              <Title order={4} mb="md">
                Description
              </Title>
              <Text>{product.description}</Text>
            </Card>
          </Grid.Col>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <Grid.Col span={12}>
            <Card withBorder>
              <Title order={4} mb="md">
                Tags
              </Title>
              <Group gap="xs">
                {tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </Group>
            </Card>
          </Grid.Col>
        )}

        {/* Vendor Information */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder>
            <Title order={4} mb="md">
              Vendor Information
            </Title>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={500}>Store:</Text>
                <Text>{product.store.name}</Text>
              </Group>
              <Group justify="space-between">
                <Text fw={500}>Seller:</Text>
                <Text>{product.store.seller.user.name}</Text>
              </Group>
              <Group justify="space-between">
                <Text fw={500}>Email:</Text>
                <Text size="sm" c="dimmed">
                  {product.store.seller.user.email}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Metadata */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder>
            <Title order={4} mb="md">
              Metadata
            </Title>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={500}>Created:</Text>
                <Text size="sm">{formatDate(product.createdAt)}</Text>
              </Group>
              <Group justify="space-between">
                <Text fw={500}>Last Updated:</Text>
                <Text size="sm">{formatDate(product.updatedAt)}</Text>
              </Group>
              <Group justify="space-between">
                <Text fw={500}>Product ID:</Text>
                <Text size="sm" c="dimmed">
                  {product.id}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
