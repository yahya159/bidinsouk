'use client';

import { Stack, Text, Badge, Group, Avatar, Card, ActionIcon, Menu, ScrollArea, Button } from '@mantine/core';
import { IconDots, IconArchive, IconTrash, IconCheck, IconClock, IconAlertTriangle, IconUser, IconLifebuoy } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  lastMessage?: {
    content: string;
    senderName: string;
  };
}

interface MessageThreadListProps {
  threads: MessageThread[];
  selectedThread: MessageThread | null;
  onThreadSelect: (thread: MessageThread) => void;
  type: 'support' | 'messages';
}

// Composant pour les badges de statut
const StatusBadge = ({ status }: { status: MessageThread['status'] }) => {
  const variants = {
    OPEN: { color: 'blue', label: 'Ouvert' },
    IN_PROGRESS: { color: 'orange', label: 'En cours' },
    RESOLVED: { color: 'green', label: 'Résolu' },
    CLOSED: { color: 'gray', label: 'Fermé' }
  };
  
  const variant = variants[status];
  
  return (
    <Badge color={variant.color} size="sm" variant="light">
      {variant.label}
    </Badge>
  );
};

// Composant pour les badges de priorité
const PriorityBadge = ({ priority }: { priority: MessageThread['priority'] }) => {
  const variants = {
    URGENT: { color: 'red', icon: IconAlertTriangle, label: 'Urgente' },
    HIGH: { color: 'orange', icon: IconClock, label: 'Haute' },
    NORMAL: { color: 'blue', icon: IconCheck, label: 'Normale' },
    LOW: { color: 'gray', icon: IconCheck, label: 'Basse' }
  };
  
  const variant = variants[priority];
  const Icon = variant.icon;
  
  return (
    <Badge 
      color={variant.color} 
      size="xs" 
      variant="outline"
      leftSection={<Icon size={10} />}
    >
      {variant.label}
    </Badge>
  );
};

// Composant pour une carte de fil de discussion
const ThreadCard = ({ 
  thread, 
  isSelected, 
  onClick 
}: { 
  thread: MessageThread; 
  isSelected: boolean; 
  onClick: () => void; 
}) => {
  const isUnread = thread.unreadCount > 0;
  
  return (
    <Card
      p="md"
      withBorder={isSelected}
      style={{
        cursor: 'pointer',
        backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : isUnread ? 'var(--mantine-color-blue-0)' : undefined,
        borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined,
        transition: 'all 0.2s ease'
      }}
      onClick={onClick}
    >
      <Stack gap="xs">
        {/* En-tête avec sujet et badges */}
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text 
              fw={isUnread ? 700 : 500} 
              size="sm" 
              lineClamp={1}
              c={isUnread ? 'blue.9' : undefined}
            >
              {thread.subject}
            </Text>
          </div>
          
          <Group gap="xs" align="center">
            <StatusBadge status={thread.status} />
            {thread.priority !== 'NORMAL' && (
              <PriorityBadge priority={thread.priority} />
            )}
            
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon 
                  variant="subtle" 
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconDots size={14} />
                </ActionIcon>
              </Menu.Target>
              
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconCheck size={14} />}>
                  Marquer comme résolu
                </Menu.Item>
                <Menu.Item leftSection={<IconArchive size={14} />}>
                  Archiver
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconTrash size={14} />} color="red">
                  Supprimer
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* Dernier message */}
        {thread.lastMessage && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            <Text component="span" fw={500}>
              {thread.lastMessage.senderName}:
            </Text>{' '}
            {thread.lastMessage.content}
          </Text>
        )}

        {/* Informations contextuelles */}
        {(thread.product || thread.order || thread.vendor) && (
          <Group gap="xs">
            {thread.product && (
              <Badge size="xs" variant="dot" color="blue">
                Produit: {thread.product.title}
              </Badge>
            )}
            {thread.order && (
              <Badge size="xs" variant="dot" color="green">
                Commande: {thread.order.reference}
              </Badge>
            )}
            {thread.vendor && (
              <Badge size="xs" variant="dot" color="orange">
                {thread.vendor.name}
              </Badge>
            )}
          </Group>
        )}

        {/* Pied avec avatar, date et compteur */}
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <Avatar size="xs" radius="xl">
              {thread.type === 'SUPPORT_TICKET' ? (
                <IconLifebuoy size={12} />
              ) : thread.vendor?.avatar ? (
                <img src={thread.vendor.avatar} alt={thread.vendor.name} />
              ) : (
                <IconUser size={12} />
              )}
            </Avatar>
            
            <Text size="xs" c="dimmed">
              {formatDistanceToNow(new Date(thread.lastMessageAt), { 
                addSuffix: true, 
                locale: fr 
              })}
            </Text>
            
            <Text size="xs" c="dimmed">
              {thread.participants.length} participant{thread.participants.length > 1 ? 's' : ''}
            </Text>
          </Group>
          
          {thread.unreadCount > 0 && (
            <Badge color="red" size="sm" variant="filled">
              {thread.unreadCount}
            </Badge>
          )}
        </Group>
      </Stack>
    </Card>
  );
};

export const MessageThreadList = ({ 
  threads, 
  selectedThread, 
  onThreadSelect, 
  type 
}: MessageThreadListProps) => {
  if (threads.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '3rem',
        textAlign: 'center'
      }}>
        {type === 'support' ? (
          <>
            <IconLifebuoy size={48} color="var(--mantine-color-gray-5)" />
            <Text size="lg" fw={500} mt="md" mb="xs">
              Aucune demande de support
            </Text>
            <Text size="sm" c="dimmed" mb="lg">
              Vous n'avez pas encore créé de ticket de support.
            </Text>
            <Button size="sm">
              Créer ma première demande
            </Button>
          </>
        ) : (
          <>
            <IconLifebuoy size={48} color="var(--mantine-color-gray-5)" />
            <Text size="lg" fw={500} mt="md" mb="xs">
              Aucune conversation
            </Text>
            <Text size="sm" c="dimmed" mb="lg">
              Vous n'avez pas encore de messages avec les vendeurs.
            </Text>
            <Button size="sm">
              Contacter un vendeur
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <ScrollArea h={600}>
      <Stack gap="xs" p="xs">
        {threads.map((thread) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            isSelected={selectedThread?.id === thread.id}
            onClick={() => onThreadSelect(thread)}
          />
        ))}
      </Stack>
    </ScrollArea>
  );
};