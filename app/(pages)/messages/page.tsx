'use client';

import { useState, useEffect } from 'react';
import { Container, Tabs, Badge, Title, Text, Group, Button, Card, Stack, Loader, Alert } from '@mantine/core';
import { IconLifebuoy, IconMessageCircle, IconPlus, IconAlertCircle } from '@tabler/icons-react';
import { MessageThreadList } from '@/components/messages/MessageThreadList';
import { ConversationView } from '@/components/messages/ConversationView';
import { MessageFilters } from '@/components/messages/MessageFilters';
import { CreateTicketModal } from '@/components/messages/CreateTicketModal';
import { CreateMessageModal } from '@/components/messages/CreateMessageModal';
import { useRefreshMessageCounts } from '@/contexts/MessageCountsContext';

interface MessageThread {
  id: string;
  type: 'SUPPORT_TICKET' | 'VENDOR_CHAT';
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category?: 'ORDER' | 'PRODUCT' | 'TECHNICAL' | 'OTHER';
  lastMessageAt: Date;
  unreadCount: number;
  participants: any[];
  vendor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  product?: {
    id: string;
    title: string;
  };
  order?: {
    id: string;
    reference: string;
  };
}

interface FiltersState {
  search: string;
  status: string;
  priority: string;
  dateRange: [Date | null, Date | null];
  category: string;
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'support' | 'messages'>('support');
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    status: 'all',
    priority: 'all',
    dateRange: [null, null],
    category: 'all'
  });
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [createMessageOpen, setCreateMessageOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({
    support: 0,
    messages: 0
  });

  const refreshMessageCounts = useRefreshMessageCounts();

  // Charger les fils de discussion
  const loadThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        type: activeTab === 'support' ? 'SUPPORT_TICKET' : 'VENDOR_CHAT',
        ...filters.search && { search: filters.search },
        ...filters.status !== 'all' && { status: filters.status },
        ...filters.priority !== 'all' && { priority: filters.priority },
        ...filters.category !== 'all' && { category: filters.category },
      });

      const response = await fetch(`/api/messages/threads?${params}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des messages');
      }
      
      const data = await response.json();
      setThreads(data.threads || []);
      setUnreadCounts(data.unreadCounts || { support: 0, messages: 0 });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage et changement d'onglet/filtres
  useEffect(() => {
    loadThreads();
  }, [activeTab, filters]);

  // Gérer la sélection d'un fil
  const handleThreadSelect = (thread: MessageThread) => {
    setSelectedThread(thread);
    // Marquer comme lu si nécessaire
    if (thread.unreadCount > 0) {
      markThreadAsRead(thread.id);
    }
  };

  // Marquer un fil comme lu
  const markThreadAsRead = async (threadId: string) => {
    try {
      await fetch(`/api/messages/threads/${threadId}/read`, {
        method: 'PUT'
      });
      // Recharger les données pour mettre à jour les compteurs
      loadThreads();
      // Rafraîchir les compteurs globaux
      refreshMessageCounts();
    } catch (err) {
      console.error('Erreur lors du marquage comme lu:', err);
    }
  };

  // Gérer la création d'un nouveau ticket/message
  const handleCreateSuccess = () => {
    setCreateTicketOpen(false);
    setCreateMessageOpen(false);
    loadThreads(); // Recharger la liste
    refreshMessageCounts(); // Rafraîchir les compteurs globaux
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* En-tête */}
        <div>
          <Title order={1} mb="sm">Mes messages et demandes</Title>
          <Text c="dimmed">
            Gérez vos tickets de support et vos conversations avec les vendeurs
          </Text>
        </div>

        {/* Onglets principaux */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as 'support' | 'messages')}>
          <Tabs.List grow>
            <Tabs.Tab 
              value="support" 
              leftSection={<IconLifebuoy size={16} />}
              rightSection={
                unreadCounts.support > 0 ? (
                  <Badge color="red" size="sm" variant="filled">
                    {unreadCounts.support}
                  </Badge>
                ) : null
              }
            >
              Mes demandes (SAV)
            </Tabs.Tab>
            <Tabs.Tab 
              value="messages" 
              leftSection={<IconMessageCircle size={16} />}
              rightSection={
                unreadCounts.messages > 0 ? (
                  <Badge color="red" size="sm" variant="filled">
                    {unreadCounts.messages}
                  </Badge>
                ) : null
              }
            >
              Mes messages
            </Tabs.Tab>
          </Tabs.List>

          {/* Contenu des onglets */}
          <Tabs.Panel value="support" pt="lg">
            <Stack gap="md">
              {/* Actions et filtres */}
              <Group justify="space-between">
                <Button 
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setCreateTicketOpen(true)}
                >
                  Nouvelle demande
                </Button>
                <MessageFilters 
                  filters={filters}
                  onChange={setFilters}
                  type="support"
                />
              </Group>

              {/* Contenu principal */}
              <div style={{ display: 'grid', gridTemplateColumns: selectedThread ? '1fr 2fr' : '1fr', gap: '1rem', minHeight: '600px' }}>
                {/* Liste des fils */}
                <Card withBorder>
                  {error ? (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
                      {error}
                    </Alert>
                  ) : null}
                  
                  {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                      <Loader size="md" />
                    </div>
                  ) : (
                    <MessageThreadList
                      threads={threads}
                      selectedThread={selectedThread}
                      onThreadSelect={handleThreadSelect}
                      type="support"
                    />
                  )}
                </Card>

                {/* Vue conversation */}
                {selectedThread && (
                  <Card withBorder>
                    <ConversationView
                      thread={selectedThread}
                      onThreadUpdate={() => {
                        loadThreads();
                        refreshMessageCounts();
                      }}
                    />
                  </Card>
                )}
              </div>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="messages" pt="lg">
            <Stack gap="md">
              {/* Actions et filtres */}
              <Group justify="space-between">
                <Button 
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setCreateMessageOpen(true)}
                >
                  Nouveau message
                </Button>
                <MessageFilters 
                  filters={filters}
                  onChange={setFilters}
                  type="messages"
                />
              </Group>

              {/* Contenu principal */}
              <div style={{ display: 'grid', gridTemplateColumns: selectedThread ? '1fr 2fr' : '1fr', gap: '1rem', minHeight: '600px' }}>
                {/* Liste des fils */}
                <Card withBorder>
                  {error ? (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
                      {error}
                    </Alert>
                  ) : null}
                  
                  {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                      <Loader size="md" />
                    </div>
                  ) : (
                    <MessageThreadList
                      threads={threads}
                      selectedThread={selectedThread}
                      onThreadSelect={handleThreadSelect}
                      type="messages"
                    />
                  )}
                </Card>

                {/* Vue conversation */}
                {selectedThread && (
                  <Card withBorder>
                    <ConversationView
                      thread={selectedThread}
                      onThreadUpdate={() => {
                        loadThreads();
                        refreshMessageCounts();
                      }}
                    />
                  </Card>
                )}
              </div>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Modals */}
      <CreateTicketModal
        opened={createTicketOpen}
        onClose={() => setCreateTicketOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      
      <CreateMessageModal
        opened={createMessageOpen}
        onClose={() => setCreateMessageOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </Container>
  );
}
