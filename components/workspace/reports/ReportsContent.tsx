'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Button,
  Select,
  TextInput,
  Table,
  ActionIcon,
  Menu,
  Stack,
  Paper,
  SimpleGrid,
  Progress,
  ThemeIcon,
  Tooltip,
  Modal,
  ScrollArea,
} from '@mantine/core';
import {
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  Filter,
  Search,
  MoreVertical,
  Calendar,
  DollarSign,
  Users,
  Package,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { useDisclosure } from '@mantine/hooks';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
}

interface ReportsContentProps {
  user: User;
}

interface Report {
  id: string;
  title: string;
  type: 'sales' | 'inventory' | 'customers' | 'performance' | 'financial';
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
  size: string;
  description: string;
  data?: any;
}

export function ReportsContent({ user }: ReportsContentProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  // Mock data for reports
  const mockReports: Report[] = [
    {
      id: '1',
      title: 'Rapport des Ventes - Janvier 2024',
      type: 'sales',
      status: 'completed',
      createdAt: '2024-01-15T10:30:00Z',
      size: '2.3 MB',
      description: 'Analyse complète des ventes du mois de janvier incluant les revenus, les produits les plus vendus et les tendances.',
      data: {
        totalSales: 45600,
        totalOrders: 234,
        averageOrderValue: 195,
        topProducts: ['iPhone 14', 'MacBook Air', 'AirPods Pro']
      }
    },
    {
      id: '2',
      title: 'Inventaire - État des Stocks',
      type: 'inventory',
      status: 'completed',
      createdAt: '2024-01-14T15:45:00Z',
      size: '1.8 MB',
      description: 'Rapport détaillé de l\'état des stocks, produits en rupture et recommandations de réapprovisionnement.',
      data: {
        totalProducts: 156,
        lowStock: 12,
        outOfStock: 3,
        totalValue: 125000
      }
    },
    {
      id: '3',
      title: 'Analyse des Clients - Q4 2023',
      type: 'customers',
      status: 'completed',
      createdAt: '2024-01-10T09:15:00Z',
      size: '3.1 MB',
      description: 'Segmentation des clients, analyse de la fidélité et recommandations pour améliorer la rétention.',
      data: {
        totalCustomers: 1250,
        newCustomers: 89,
        returningCustomers: 456,
        averageLifetimeValue: 850
      }
    },
    {
      id: '4',
      title: 'Performance des Enchères',
      type: 'performance',
      status: 'processing',
      createdAt: '2024-01-16T14:20:00Z',
      size: 'En cours...',
      description: 'Analyse des performances des enchères, taux de conversion et optimisations suggérées.',
    },
    {
      id: '5',
      title: 'Rapport Financier - Décembre 2023',
      type: 'financial',
      status: 'completed',
      createdAt: '2024-01-05T11:00:00Z',
      size: '4.2 MB',
      description: 'Bilan financier complet incluant les revenus, dépenses, marges et projections.',
      data: {
        revenue: 78500,
        expenses: 23400,
        profit: 55100,
        margin: 70.2
      }
    },
    {
      id: '6',
      title: 'Analyse des Tendances - 2023',
      type: 'performance',
      status: 'failed',
      createdAt: '2024-01-12T16:30:00Z',
      size: 'Échec',
      description: 'Analyse des tendances de vente et prédictions pour 2024.',
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setReports(mockReports);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'processing': return 'blue';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'processing': return <Clock size={16} />;
      case 'failed': return <AlertTriangle size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sales': return <DollarSign size={20} />;
      case 'inventory': return <Package size={20} />;
      case 'customers': return <Users size={20} />;
      case 'performance': return <BarChart3 size={20} />;
      case 'financial': return <PieChart size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sales': return 'Ventes';
      case 'inventory': return 'Inventaire';
      case 'customers': return 'Clients';
      case 'performance': return 'Performance';
      case 'financial': return 'Financier';
      default: return 'Autre';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || report.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    openModal();
  };

  const handleDownloadReport = (reportId: string) => {
    // Simulate download
    console.log('Downloading report:', reportId);
  };

  const handleGenerateReport = () => {
    // Simulate report generation
    console.log('Generating new report...');
  };

  // Statistics for overview cards
  const stats = {
    totalReports: reports.length,
    completedReports: reports.filter(r => r.status === 'completed').length,
    processingReports: reports.filter(r => r.status === 'processing').length,
    failedReports: reports.filter(r => r.status === 'failed').length,
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1} size="h2" mb="xs">
              Rapports et Analyses
            </Title>
            <Text c="dimmed">
              Consultez et téléchargez vos rapports d'activité
            </Text>
          </div>
          <Button
            leftSection={<FileText size={16} />}
            onClick={handleGenerateReport}
          >
            Générer un Rapport
          </Button>
        </Group>

        {/* Overview Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Total des Rapports
                </Text>
                <Text size="xl" fw={700}>
                  {stats.totalReports}
                </Text>
              </div>
              <ThemeIcon size="lg" variant="light" color="blue">
                <FileText size={20} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Terminés
                </Text>
                <Text size="xl" fw={700} c="green">
                  {stats.completedReports}
                </Text>
              </div>
              <ThemeIcon size="lg" variant="light" color="green">
                <CheckCircle size={20} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  En Cours
                </Text>
                <Text size="xl" fw={700} c="blue">
                  {stats.processingReports}
                </Text>
              </div>
              <ThemeIcon size="lg" variant="light" color="blue">
                <Clock size={20} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Échecs
                </Text>
                <Text size="xl" fw={700} c="red">
                  {stats.failedReports}
                </Text>
              </div>
              <ThemeIcon size="lg" variant="light" color="red">
                <AlertTriangle size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <Card withBorder>
          <Group gap="md">
            <TextInput
              placeholder="Rechercher un rapport..."
              leftSection={<Search size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Type de rapport"
              leftSection={<Filter size={16} />}
              value={filterType}
              onChange={(value) => setFilterType(value || 'all')}
              data={[
                { value: 'all', label: 'Tous les types' },
                { value: 'sales', label: 'Ventes' },
                { value: 'inventory', label: 'Inventaire' },
                { value: 'customers', label: 'Clients' },
                { value: 'performance', label: 'Performance' },
                { value: 'financial', label: 'Financier' },
              ]}
              w={200}
            />
          </Group>
        </Card>

        {/* Reports Table */}
        <Card withBorder>
          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Rapport</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th>Date de Création</Table.Th>
                  <Table.Th>Taille</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredReports.map((report) => (
                  <Table.Tr key={report.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <ThemeIcon size="sm" variant="light" color="blue">
                          {getTypeIcon(report.type)}
                        </ThemeIcon>
                        <div>
                          <Text fw={500} size="sm">
                            {report.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {report.description}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue">
                        {getTypeLabel(report.type)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {getStatusIcon(report.status)}
                        <Badge variant="light" color={getStatusColor(report.status)}>
                          {report.status === 'completed' && 'Terminé'}
                          {report.status === 'processing' && 'En cours'}
                          {report.status === 'failed' && 'Échec'}
                        </Badge>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{report.size}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {report.status === 'completed' && (
                          <>
                            <Tooltip label="Voir le rapport">
                              <ActionIcon
                                variant="subtle"
                                onClick={() => handleViewReport(report)}
                              >
                                <Eye size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Télécharger">
                              <ActionIcon
                                variant="subtle"
                                onClick={() => handleDownloadReport(report.id)}
                              >
                                <Download size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        )}
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="subtle">
                              <MoreVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<Eye size={14} />}>
                              Voir les détails
                            </Menu.Item>
                            {report.status === 'completed' && (
                              <Menu.Item leftSection={<Download size={14} />}>
                                Télécharger
                              </Menu.Item>
                            )}
                            {report.status === 'failed' && (
                              <Menu.Item leftSection={<Activity size={14} />}>
                                Régénérer
                              </Menu.Item>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>
      </Stack>

      {/* Report Detail Modal */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={selectedReport?.title}
        size="lg"
      >
        {selectedReport && (
          <Stack gap="md">
            <Group>
              <Badge variant="light" color="blue">
                {getTypeLabel(selectedReport.type)}
              </Badge>
              <Badge variant="light" color={getStatusColor(selectedReport.status)}>
                {selectedReport.status === 'completed' && 'Terminé'}
                {selectedReport.status === 'processing' && 'En cours'}
                {selectedReport.status === 'failed' && 'Échec'}
              </Badge>
            </Group>
            
            <Text>{selectedReport.description}</Text>
            
            {selectedReport.data && (
              <Paper withBorder p="md">
                <Title order={4} mb="md">Aperçu des Données</Title>
                <SimpleGrid cols={2} spacing="md">
                  {Object.entries(selectedReport.data).map(([key, value]) => (
                    <div key={key}>
                      <Text size="sm" c="dimmed" mb={4}>
                        {key === 'totalSales' && 'Ventes Totales'}
                        {key === 'totalOrders' && 'Commandes Totales'}
                        {key === 'averageOrderValue' && 'Panier Moyen'}
                        {key === 'totalProducts' && 'Produits Totaux'}
                        {key === 'lowStock' && 'Stock Faible'}
                        {key === 'outOfStock' && 'Rupture de Stock'}
                        {key === 'totalValue' && 'Valeur Totale'}
                        {key === 'totalCustomers' && 'Clients Totaux'}
                        {key === 'newCustomers' && 'Nouveaux Clients'}
                        {key === 'returningCustomers' && 'Clients Fidèles'}
                        {key === 'averageLifetimeValue' && 'Valeur Vie Client'}
                        {key === 'revenue' && 'Revenus'}
                        {key === 'expenses' && 'Dépenses'}
                        {key === 'profit' && 'Bénéfices'}
                        {key === 'margin' && 'Marge (%)'}
                        {key}
                      </Text>
                      <Text fw={500}>
                        {Array.isArray(value) ? value.join(', ') : 
                         typeof value === 'number' ? 
                         (key.includes('Value') || key.includes('Sales') || key.includes('revenue') || key.includes('expenses') || key.includes('profit')) ? 
                         `${new Intl.NumberFormat('fr-FR').format(value)} MAD` : 
                         key === 'margin' ? `${value}%` :
                         new Intl.NumberFormat('fr-FR').format(value) : 
                         value}
                      </Text>
                    </div>
                  ))}
                </SimpleGrid>
              </Paper>
            )}
            
            <Group justify="flex-end">
              <Button variant="outline" onClick={closeModal}>
                Fermer
              </Button>
              {selectedReport.status === 'completed' && (
                <Button onClick={() => handleDownloadReport(selectedReport.id)}>
                  Télécharger
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}