'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Stack, 
  Group, 
  Text, 
  Avatar, 
  ScrollArea, 
  ActionIcon, 
  Menu, 
  Badge, 
  Card,
  Loader,
  Alert,
  Button
} from '@mantine/core';
import { 
  IconDots, 
  IconCheck, 
  IconArchive, 
  IconTrash, 
  IconLifebuoy, 
  IconUser,
  IconAlertCircle
} from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageComposer } from './MessageComposer';

interface MessageThread {
  id: string;
  type: 'SUPPORT_TICKET' | 'VENDOR_CHAT';
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category?: 'ORDER' | 'PRODUCT' | 'TECHNICAL' | 'OTHER';
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

interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  attachments?: Attachment[];
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
}

interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

interface ConversationViewProps {
  thread: MessageThread;
  onThreadUpdate: () => void;
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

// Composant pour une bulle de message
const MessageBubble = ({ message, currentUserId }: { message: Message; currentUserId: string }) => {
  const isFromCurrentUser = message.senderId === currentUserId;
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: isFromCurrentUser ? 'flex-end' : 'flex-start',
      marginBottom: '1rem'
    }}>
      <div style={{ 
        maxWidth: '70%',
        display: 'flex',
        flexDirection: isFromCurrentUser ? 'row-reverse' : 'row',
        gap: '0.5rem',
        alignItems: 'flex-start'
      }}>
        <Avatar size="sm" radius="xl">
          {message.sender.avatar ? (
            <img src={message.sender.avatar} alt={message.sender.name} />
          ) : (
            <IconUser size={16} />
          )}
        </Avatar>
        
        <Card
          p="sm"
          style={{
            backgroundColor: isFromCurrentUser ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-gray-1)',
            color: isFromCurrentUser ? 'white' : 'var(--mantine-color-dark-7)'
          }}
        >
          <Stack gap="xs">
            <Group gap="xs" justify="space-between">
              <Text size="xs" fw={500} opacity={0.8}>
                {message.sender.name}
                {message.sender.role && (
                  <Badge size="xs" ml="xs" variant="dot">
                    {message.sender.role}
                  </Badge>
                )}
              </Text>
              <Text size="xs" opacity={0.7}>
                {formatDistanceToNow(new Date(message.createdAt), { 
                  addSuffix: true, 
                  locale: fr 
                })}
              </Text>
            </Group>
            
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Text>
            
            {message.attachments && message.attachments.length > 0 && (
              <Stack gap="xs">
                {message.attachments.map(attachment => (
                  <Card key={attachment.id} p="xs" withBorder>
                    <Group gap="xs">
                      <Text size="xs" fw={500}>
                        {attachment.filename}
                      </Text>
                      <Text size="xs" c="dimmed">
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </Text>
                      <Button size="xs" variant="subtle">
                        Télécharger
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
            
            {isFromCurrentUser && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {message.isRead ? (
                  <IconCheck size={12} style={{ opacity: 0.7 }} />
                ) : (
                  <div style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: 'currentColor',
                    opacity: 0.5
                  }} />
                )}
              </div>
            )}
          </Stack>
        </Card>
      </div>
    </div>
  );
};

export const ConversationView = ({ thread, onThreadUpdate }: ConversationViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId] = useState('current-user-id'); // À remplacer par l'ID utilisateur réel
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Charger les messages du fil
  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/messages/threads/${thread.id}/messages`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des messages');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Scroll vers le bas après chargement
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les messages au montage et changement de fil
  useEffect(() => {
    loadMessages();
  }, [thread.id]);

  // Gérer l'envoi d'un nouveau message
  const handleMessageSent = () => {
    loadMessages(); // Recharger les messages
    onThreadUpdate(); // Mettre à jour la liste des fils
  };

  // Gérer le changement de statut
  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/messages/threads/${thread.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      onThreadUpdate();
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err);
    }
  };

  return (
    <Stack h="100%" gap={0}>
      {/* En-tête de la conversation */}
      <Card.Section p="md" withBorder style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Group gap="sm" mb="xs">
              <Avatar size="sm" radius="xl">
                {thread.type === 'SUPPORT_TICKET' ? (
                  <IconLifebuoy size={16} />
                ) : thread.vendor?.avatar ? (
                  <img src={thread.vendor.avatar} alt={thread.vendor.name} />
                ) : (
                  <IconUser size={16} />
                )}
              </Avatar>
              
              <div>
                <Text fw={600} size="sm">
                  {thread.subject}
                </Text>
                <Text size="xs" c="dimmed">
                  {thread.type === 'SUPPORT_TICKET' 
                    ? 'Support BidinSouk' 
                    : thread.vendor?.name
                  }
                </Text>
              </div>
            </Group>
            
            {/* Informations contextuelles */}
            <Group gap="xs">
              <StatusBadge status={thread.status} />
              
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
            </Group>
          </div>
          
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            
            <Menu.Dropdown>
              <Menu.Item 
                leftSection={<IconCheck size={14} />}
                onClick={() => handleStatusChange('RESOLVED')}
                disabled={thread.status === 'RESOLVED'}
              >
                Marquer comme résolu
              </Menu.Item>
              <Menu.Item 
                leftSection={<IconArchive size={14} />}
                onClick={() => handleStatusChange('CLOSED')}
                disabled={thread.status === 'CLOSED'}
              >
                Archiver
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={14} />} color="red">
                Supprimer la conversation
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Card.Section>

      {/* Zone des messages */}
      <Card.Section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {error ? (
          <Alert icon={<IconAlertCircle size={16} />} color="red" m="md">
            {error}
          </Alert>
        ) : loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            flex: 1,
            padding: '2rem'
          }}>
            <Loader size="md" />
          </div>
        ) : (
          <ScrollArea 
            ref={scrollAreaRef}
            style={{ flex: 1 }}
            p="md"
            scrollbarSize={6}
          >
            {messages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: 'var(--mantine-color-gray-6)'
              }}>
                <Text size="sm">Aucun message dans cette conversation</Text>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                />
              ))
            )}
          </ScrollArea>
        )}
      </Card.Section>

      {/* Composer de message */}
      {thread.status !== 'CLOSED' && (
        <Card.Section p="md" withBorder style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <MessageComposer
            threadId={thread.id}
            onMessageSent={handleMessageSent}
          />
        </Card.Section>
      )}
    </Stack>
  );
};