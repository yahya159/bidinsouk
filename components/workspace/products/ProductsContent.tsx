'use client';

import { useState, useEffect } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Table,
  Badge,
  Image,
  ActionIcon,
  Menu,
  TextInput,
  Select,
  Checkbox,
  Pagination,
  Modal,
  Drawer,
  Loader,
  Center,
  Alert,
  Textarea,
  NumberInput,
  MultiSelect,
  FileInput,
  Switch,
  Tabs,
  Grid,
  Divider,
} from '@mantine/core';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
  Eye,
  Download,
  AlertCircle,
  Upload,
  Save,
  X,
  Package,
  Tag,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { ImageCropper } from '@/components/shared/ImageCropper';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
}

interface Product {
  id: string;
  title: string;
  description?: string;
  images?: string[];
  category?: string;
  price?: number;
  compareAtPrice?: number;
  sku?: string;
  stock?: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  condition?: 'NEW' | 'USED';
  views?: number;
  createdAt: string;
  updatedAt?: string;
  storeId: string;
  attributes?: Record<string, string>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

interface ProductsContentProps {
  user: User;
}

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    title: 'iPhone 14 Pro Max 256GB',
    description: 'iPhone 14 Pro Max en excellent état, 256GB de stockage, couleur noir sidéral.',
    images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop&auto=format'],
    category: 'electronics',
    price: 8500,
    compareAtPrice: 9500,
    sku: 'IPH14PM256',
    stock: 5,
    status: 'ACTIVE',
    condition: 'USED',
    views: 156,
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    storeId: 'store-1',
  },
  {
    id: '2',
    title: 'MacBook Air M2 13"',
    description: 'MacBook Air M2 13 pouces, 8GB RAM, 256GB SSD, état neuf avec garantie.',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop&auto=format'],
    category: 'electronics',
    price: 12000,
    sku: 'MBA13M2',
    stock: 0,
    status: 'DRAFT',
    condition: 'NEW',
    views: 89,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
    storeId: 'store-1',
  },
  {
    id: '3',
    title: 'Montre Rolex Submariner',
    description: 'Rolex Submariner authentique, modèle 116610LN, avec boîte et papiers.',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&auto=format'],
    category: 'watches',
    price: 45000,
    sku: 'ROL116610LN',
    stock: 1,
    status: 'ACTIVE',
    condition: 'USED',
    views: 342,
    createdAt: '2024-01-09T08:00:00Z',
    updatedAt: '2024-01-12T21:00:00Z',
    storeId: 'store-1',
  },
];

const categories = [
  { value: 'electronics', label: 'Électronique' },
  { value: 'watches', label: 'Montres' },
  { value: 'fashion', label: 'Mode' },
  { value: 'home', label: 'Maison' },
  { value: 'sports', label: 'Sport' },
];

const statuses = ['Tous', 'DRAFT', 'ACTIVE', 'ARCHIVED'];

export function ProductsContent({ user }: ProductsContentProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [maxStock, setMaxStock] = useState<number | undefined>();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modals and drawers
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [productDrawerOpened, { open: openProductDrawer, close: closeProductDrawer }] = useDisclosure(false);
  const [cropperOpened, { open: openCropper, close: closeCropper }] = useDisclosure(false);
  
  // Form state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    images: [] as string[],
    category: '',
    price: 0,
    compareAtPrice: undefined as number | undefined,
    sku: '',
    stock: 0,
    status: 'DRAFT' as Product['status'],
    condition: 'NEW' as Product['condition'],
    attributes: {} as Record<string, string>,
    seo: {
      title: '',
      description: '',
      keywords: [] as string[],
    } as { title: string; description: string; keywords: string[] },
  });

  const itemsPerPage = 10;

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedStatus !== 'Tous' && { status: selectedStatus }),
        ...(selectedCategory !== 'Toutes' && { category: selectedCategory }),
      });

      const response = await fetch(`/api/vendors/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching products:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les produits',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchQuery, selectedStatus, selectedCategory]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Tous' || product.status === selectedStatus;
    const matchesStock = maxStock === undefined || (product.stock !== undefined && product.stock <= maxStock);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'ACTIVE': return 'green';
      case 'ARCHIVED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Brouillon';
      case 'ACTIVE': return 'Actif';
      case 'ARCHIVED': return 'Archivé';
      default: return status;
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'NEW': return 'Neuf';
      case 'USED': return 'Occasion';
      default: return condition;
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'archive' | 'delete' | 'export') => {
    if (selectedProducts.length === 0) return;

    try {
      setLoading(true);
      
      switch (action) {
        case 'activate':
          setProducts(prev => prev.map(product => 
            selectedProducts.includes(product.id) 
              ? { ...product, status: 'ACTIVE' as const }
              : product
          ));
          notifications.show({
            title: 'Produits activés',
            message: `${selectedProducts.length} produit(s) activé(s) avec succès`,
            color: 'green',
          });
          break;
        case 'archive':
          setProducts(prev => prev.map(product => 
            selectedProducts.includes(product.id) 
              ? { ...product, status: 'ARCHIVED' as const }
              : product
          ));
          notifications.show({
            title: 'Produits archivés',
            message: `${selectedProducts.length} produit(s) archivé(s) avec succès`,
            color: 'orange',
          });
          break;
        case 'delete':
          setProducts(prev => prev.filter(product => !selectedProducts.includes(product.id)));
          notifications.show({
            title: 'Produits supprimés',
            message: `${selectedProducts.length} produit(s) supprimé(s) avec succès`,
            color: 'red',
          });
          break;
        case 'export':
          // Mock CSV export
          const csvData = products
            .filter(p => selectedProducts.includes(p.id))
            .map(p => `${p.title},${p.sku},${p.price},${p.stock},${p.status}`)
            .join('\n');
          const blob = new Blob([`Titre,SKU,Prix,Stock,Statut\n${csvData}`], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'produits.csv';
          a.click();
          notifications.show({
            title: 'Export terminé',
            message: 'Les produits ont été exportés en CSV',
            color: 'blue',
          });
          break;
      }
      
      setSelectedProducts([]);
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Une erreur est survenue',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description || '',
      images: product.images || [],
      category: product.category || '',
      price: product.price || 0,
      compareAtPrice: product.compareAtPrice,
      sku: product.sku || '',
      stock: product.stock || 0,
      status: product.status,
      condition: product.condition || 'NEW',
      attributes: product.attributes || {},
      seo: {
        title: product.seo?.title || '',
        description: product.seo?.description || '',
        keywords: product.seo?.keywords || [],
      },
    });
    openProductDrawer();
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      description: '',
      images: [],
      category: '',
      price: 0,
      compareAtPrice: undefined,
      sku: '',
      stock: 0,
      status: 'DRAFT',
      condition: 'NEW',
      attributes: {},
      seo: { title: '', description: '', keywords: [] },
    });
    openProductDrawer();
  };

  const handleSaveProduct = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!productForm.title || !productForm.description || !productForm.category) {
        notifications.show({
          title: 'Erreur de validation',
          message: 'Veuillez remplir tous les champs obligatoires',
          color: 'red',
        });
        return;
      }

      if (editingProduct) {
        // Update existing product via API
        const response = await fetch(`/api/vendors/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update product');
        }

        const result = await response.json();
        
        // Update local state
        setProducts(prev => prev.map(product => 
          product.id === editingProduct.id ? result.product : product
        ));
        
        notifications.show({
          title: 'Produit mis à jour',
          message: result.message || 'Le produit a été mis à jour avec succès',
          color: 'green',
        });
      } else {
        // Create new product via API
        const response = await fetch('/api/vendors/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...productForm,
            images: productForm.images.length > 0 ? productForm.images : ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&auto=format'],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create product');
        }

        const result = await response.json();
        
        // Add to local state
        setProducts(prev => [result.product, ...prev]);
        
        notifications.show({
          title: 'Produit créé',
          message: result.message || 'Le produit a été créé avec succès',
          color: 'green',
        });
      }
      
      // Reset form and close drawer
      setProductForm({
        title: '',
        description: '',
        images: [],
        category: '',
        price: 0,
        compareAtPrice: undefined,
        sku: '',
        stock: 0,
        status: 'DRAFT',
        condition: 'NEW',
        attributes: {},
        seo: { title: '', description: '', keywords: [] },
      });
      setEditingProduct(null);
      closeProductDrawer();
      
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.message || 'Impossible de sauvegarder le produit',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageCrop = (croppedImage: string) => {
    setProductForm(prev => ({
      ...prev,
      images: [...prev.images, croppedImage]
    }));
  };

  const handleImageReorder = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(productForm.images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setProductForm(prev => ({ ...prev, images: items }));
  };

  const removeImage = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  if (loading && products.length === 0) {
    return (
      <Center style={{ height: 400 }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <>
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1} size="2rem" mb="xs">
              Produits
            </Title>
            <Text c="dimmed" size="lg">
              Gérez votre catalogue de produits
            </Text>
          </div>
          <Button
            leftSection={<Plus size={16} />}
            onClick={handleCreateProduct}
          >
            Nouveau produit
          </Button>
        </Group>

        {/* Filters */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                placeholder="Rechercher un produit..."
                leftSection={<Search size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Select
                placeholder="Catégorie"
                data={categories}
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value || '')}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Select
                placeholder="Statut"
                data={statuses}
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value || 'Tous')}
                clearable={false}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <NumberInput
                placeholder="Stock max"
                value={maxStock}
                onChange={(value) => setMaxStock(value as number)}
                min={0}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Button
                variant="light"
                leftSection={<Filter size={16} />}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedStatus('Tous');
                  setMaxStock(undefined);
                }}
              >
                Réinitialiser
              </Button>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between">
              <Text size="sm">
                {selectedProducts.length} produit(s) sélectionné(s)
              </Text>
              <Group gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="green"
                  onClick={() => handleBulkAction('activate')}
                >
                  Activer
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="orange"
                  onClick={() => handleBulkAction('archive')}
                >
                  Archiver
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  leftSection={<Download size={14} />}
                  onClick={() => handleBulkAction('export')}
                >
                  Export CSV
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  onClick={() => handleBulkAction('delete')}
                >
                  Supprimer
                </Button>
              </Group>
            </Group>
          </Card>
        )}

        {/* Products Table */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          {paginatedProducts.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <Package size={48} color="gray" />
                <Text size="lg" c="dimmed">
                  Aucun produit trouvé
                </Text>
                <Button
                  leftSection={<Plus size={16} />}
                  onClick={handleCreateProduct}
                >
                  Créer votre premier produit
                </Button>
              </Stack>
            </Center>
          ) : (
            <>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>
                      <Checkbox
                        checked={selectedProducts.length === paginatedProducts.length}
                        indeterminate={selectedProducts.length > 0 && selectedProducts.length < paginatedProducts.length}
                        onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                      />
                    </Table.Th>
                    <Table.Th>Image</Table.Th>
                    <Table.Th>Titre</Table.Th>
                    <Table.Th>Catégorie</Table.Th>
                    <Table.Th>Prix</Table.Th>
                    <Table.Th>Stock</Table.Th>
                    <Table.Th>Statut</Table.Th>
                    <Table.Th>Vues</Table.Th>
                    <Table.Th>Créé le</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedProducts.map((product) => (
                    <Table.Tr key={product.id}>
                      <Table.Td>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => handleSelectProduct(product.id, e.currentTarget.checked)}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Image
                          src={product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/40x40'}
                          alt={product.title}
                          width={40}
                          height={40}
                          radius="sm"
                        />
                      </Table.Td>
                      <Table.Td>
                        <div>
                          <Text fw={500} size="sm">
                            {product.title}
                          </Text>
                          {product.sku && (
                            <Text size="xs" c="dimmed">
                              SKU: {product.sku}
                            </Text>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {categories.find(c => c.value === product.category)?.label || product.category}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <div>
                          {product.price !== undefined && (
                            <Text size="sm" fw={500}>
                              {new Intl.NumberFormat('fr-FR').format(product.price)} MAD
                            </Text>
                          )}
                          {product.compareAtPrice !== undefined && product.compareAtPrice > 0 && (
                            <Text size="xs" c="dimmed" td="line-through">
                              {new Intl.NumberFormat('fr-FR').format(product.compareAtPrice)} MAD
                            </Text>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        {product.stock !== undefined ? (
                          <Badge color={product.stock > 0 ? 'green' : 'red'} variant="light">
                            {product.stock}
                          </Badge>
                        ) : (
                          <Badge color="gray" variant="light">
                            N/A
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(product.status)} variant="light">
                          {getStatusLabel(product.status)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {product.views !== undefined ? (
                          <Text size="sm">{product.views}</Text>
                        ) : (
                          <Text size="sm">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {new Date(product.createdAt).toLocaleDateString('fr-FR')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="subtle">
                              <MoreHorizontal size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<Eye size={16} />}
                              onClick={() => router.push(`/products/${product.id}`)}
                            >
                              Voir le produit
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<Edit size={16} />}
                              onClick={() => handleEditProduct(product)}
                            >
                              Modifier
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              leftSection={<Archive size={16} />}
                              color="orange"
                            >
                              Archiver
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<Trash2 size={16} />}
                              color="red"
                            >
                              Supprimer
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <Group justify="center" mt="md">
                  <Pagination
                    value={currentPage}
                    onChange={setCurrentPage}
                    total={totalPages}
                  />
                </Group>
              )}
            </>
          )}
        </Card>
      </Stack>

      {/* Product Create/Edit Drawer */}
      <Drawer
        opened={productDrawerOpened}
        onClose={closeProductDrawer}
        title={editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
        position="right"
        size="xl"
      >
        <Tabs defaultValue="general">
          <Tabs.List>
            <Tabs.Tab value="general" leftSection={<Package size={16} />}>
              Général
            </Tabs.Tab>
            <Tabs.Tab value="pricing" leftSection={<DollarSign size={16} />}>
              Prix
            </Tabs.Tab>
            <Tabs.Tab value="seo" leftSection={<BarChart3 size={16} />}>
              SEO
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general" pt="md">
            <Stack gap="md">
              <TextInput
                label="Titre"
                placeholder="Nom du produit"
                required
                value={productForm.title}
                onChange={(e) => setProductForm(prev => ({ ...prev, title: e.target.value }))}
              />

              <Textarea
                label="Description"
                placeholder="Description détaillée du produit"
                minRows={3}
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
              />

              <div>
                <Text size="sm" fw={500} mb="xs">Images</Text>
                <Button
                  variant="light"
                  leftSection={<Upload size={16} />}
                  onClick={openCropper}
                  mb="md"
                >
                  Ajouter une image
                </Button>
                
                {productForm.images.length > 0 && (
                  <DragDropContext onDragEnd={handleImageReorder}>
                    <Droppable droppableId="images" direction="horizontal">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                        >
                          {productForm.images.map((image, index) => (
                            <Draggable key={index} draggableId={`image-${index}`} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    position: 'relative',
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  <Image
                                    src={image}
                                    alt={`Product ${index + 1}`}
                                    width={80}
                                    height={80}
                                    radius="sm"
                                  />
                                  <ActionIcon
                                    size="xs"
                                    color="red"
                                    variant="filled"
                                    style={{
                                      position: 'absolute',
                                      top: -8,
                                      right: -8,
                                    }}
                                    onClick={() => removeImage(index)}
                                  >
                                    <X size={12} />
                                  </ActionIcon>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>

              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label="Catégorie"
                    placeholder="Sélectionner une catégorie"
                    data={categories}
                    value={productForm.category}
                    onChange={(value) => setProductForm(prev => ({ ...prev, category: value || '' }))}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="État"
                    data={[
                      { value: 'NEW', label: 'Neuf' },
                      { value: 'USED', label: 'Occasion' },
                    ]}
                    value={productForm.condition}
                    onChange={(value) => setProductForm(prev => ({ ...prev, condition: value as Product['condition'] }))}
                    required
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="SKU"
                    placeholder="Code produit unique"
                    value={productForm.sku}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    required
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <NumberInput
                    label="Stock"
                    placeholder="Quantité disponible"
                    min={0}
                    value={productForm.stock}
                    onChange={(value) => setProductForm(prev => ({ ...prev, stock: value as number }))}
                  />
                </Grid.Col>
              </Grid>

              <Select
                label="Statut"
                data={[
                  { value: 'DRAFT', label: 'Brouillon' },
                  { value: 'ACTIVE', label: 'Actif' },
                  { value: 'ARCHIVED', label: 'Archivé' },
                ]}
                value={productForm.status}
                onChange={(value) => setProductForm(prev => ({ ...prev, status: value as Product['status'] }))}
                required
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="pricing" pt="md">
            <Stack gap="md">
              <NumberInput
                label="Prix de vente"
                placeholder="Prix en MAD"
                min={0}
                decimalScale={2}
                value={productForm.price}
                onChange={(value) => setProductForm(prev => ({ ...prev, price: value as number }))}
                required
              />

              <NumberInput
                label="Prix barré (optionnel)"
                placeholder="Prix de comparaison en MAD"
                min={0}
                decimalScale={2}
                value={productForm.compareAtPrice}
                onChange={(value) => setProductForm(prev => ({ ...prev, compareAtPrice: value as number }))}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="seo" pt="md">
            <Stack gap="md">
              <TextInput
                label="Titre SEO"
                placeholder="Titre pour les moteurs de recherche"
                value={productForm.seo.title}
                onChange={(e) => setProductForm(prev => ({ 
                  ...prev, 
                  seo: { ...prev.seo, title: e.target.value }
                }))}
              />

              <Textarea
                label="Description SEO"
                placeholder="Description pour les moteurs de recherche"
                minRows={2}
                value={productForm.seo.description}
                onChange={(e) => setProductForm(prev => ({ 
                  ...prev, 
                  seo: { ...prev.seo, description: e.target.value }
                }))}
              />

              <MultiSelect
                label="Mots-clés SEO"
                placeholder="Ajouter des mots-clés"
                data={productForm.seo.keywords.map(k => ({ value: k, label: k }))}
                value={productForm.seo.keywords}
                onChange={(value) => setProductForm(prev => ({ 
                  ...prev, 
                  seo: { ...prev.seo, keywords: value }
                }))}
                searchable
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Divider my="md" />

        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={closeProductDrawer}>
            Annuler
          </Button>
          <Button
            leftSection={<Save size={16} />}
            onClick={handleSaveProduct}
            loading={loading}
          >
            {editingProduct ? 'Mettre à jour' : 'Créer le produit'}
          </Button>
        </Group>
      </Drawer>

      {/* Image Cropper */}
      <ImageCropper
        opened={cropperOpened}
        onClose={closeCropper}
        onCrop={handleImageCrop}
        aspectRatio={1}
        title="Recadrer l'image du produit"
      />
    </>
  );
}