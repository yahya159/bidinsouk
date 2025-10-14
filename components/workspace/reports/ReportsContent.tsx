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
  Center,
  Loader,
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
import { notifications } from '@mantine/notifications';

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

  // Fetch reports from API
  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Use different API endpoints based on user role
      let apiUrl;
      let headers: HeadersInit = {
        'x-user-id': user.id,
        'x-user-role': user.role,
      };
      
      if (user.role === 'ADMIN') {
        const params = new URLSearchParams({
          limit: '50',
          offset: '0',
          type: filterType !== 'all' ? filterType : '',
        });
        apiUrl = `/api/admin/reports?${params}`;
      } else if (user.role === 'VENDOR') {
        const params = new URLSearchParams({
          limit: '50',
          offset: '0',
          type: filterType !== 'all' ? filterType : '',
        });
        apiUrl = `/api/vendor/reports?${params}`;
      } else {
        // If user is not admin or vendor, they don't have permission
        notifications.show({
          title: 'Accès refusé',
          message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
          color: 'red',
        });
        setLoading(false);
        return;
      }

      const response = await fetch(apiUrl, { headers });
      
      if (response.ok) {
        const data = await response.json();
        // Convert audit logs to report format
        const convertedReports = data.reports.map((report: any) => ({
          id: report.id,
          title: `Rapport ${report.entity} - ${new Date(report.createdAt).toLocaleDateString('fr-FR')}`,
          type: report.entity === 'Order' ? 'sales' : 
                 report.entity === 'Product' ? 'inventory' : 
                 report.entity === 'User' ? 'customers' : 'performance',
          status: 'completed', // All audit logs are completed
          createdAt: report.createdAt,
          size: 'N/A',
          description: `Action: ${report.action} - Effectuée par: ${report.actor.name}`,
          data: report.diff || {}
        }));
        setReports(convertedReports);
      } else {
        throw new Error('Erreur lors du chargement des rapports');
      }
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les rapports',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user.role, filterType]);

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

  const handleGenerateReport = async () => {
    try {
      // Ouvrir une modale pour choisir le type de rapport
      // Pour l'instant, on va générer un rapport de ventes par défaut
      const response = await fetch(user.role === 'ADMIN' ? '/api/admin/reports/generate' : '/api/vendor/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        body: JSON.stringify({
          type: 'sales', // Type de rapport par défaut
          dateRange: 'last_30_days' // Plage de dates par défaut
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const newReport = await response.json();
      
      // Ajouter le nouveau rapport à la liste
      setReports(prev => [newReport, ...prev]);
      
      notifications.show({
        title: 'Rapport généré',
        message: 'Le rapport a été généré avec succès',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de générer le rapport',
        color: 'red',
      });
    }
  };

  // Statistics for overview cards
  const stats = {
    totalReports: reports.length,
    completedReports: reports.filter(r => r.status === 'completed').length,
    processingReports: reports.filter(r => r.status === 'processing').length,
    failedReports: reports.filter(r => r.status === 'failed').length,
  };

  if (loading) {
    return (
      <Center style={{ height: 400 }}>
        <Loader size="lg" />
      </Center>
    );
  }

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
                        {key}
                      </Text>
                      <Text fw={500}>
                        {Array.isArray(value) ? value.join(', ') : 
                         typeof value === 'number' ? 
                         (key.includes('Value') || key.includes('Sales') || key.includes('revenue') || key.includes('expenses') || key.includes('profit')) ? 
                         `${new Intl.NumberFormat('fr-FR').format(value)} MAD` : 
                         key === 'margin' ? `${value}%` :
                         new Intl.NumberFormat('fr-FR').format(value) : 
                         value?.toString() || 'N/A'}
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