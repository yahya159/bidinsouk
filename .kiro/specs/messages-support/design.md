# Document de Conception - Mes Messages et Demandes

## Vue d'ensemble

L'espace "Mes messages et demandes" est une interface unifiée permettant aux utilisateurs de gérer leurs communications avec les vendeurs et leurs demandes de support. L'interface suit les principes de design moderne avec une approche mobile-first et une accessibilité complète.

## Architecture

### Structure des Composants

```
components/messages/
├── MessagesLayout.tsx           # Layout principal avec onglets
├── support/
│   ├── SupportTickets.tsx       # Liste des demandes SAV
│   ├── TicketDetail.tsx         # Vue détaillée d'une demande
│   ├── CreateTicket.tsx         # Formulaire de création
│   ├── TicketFilters.tsx        # Filtres et recherche
│   └── TicketStatusBadge.tsx    # Badge de statut
├── conversations/
│   ├── ConversationsList.tsx    # Liste des conversations
│   ├── ConversationView.tsx     # Vue de conversation
│   ├── MessageComposer.tsx      # Compositeur de message
│   ├── MessageBubble.tsx        # Bulle de message
│   └── VendorSelector.tsx       # Sélecteur de vendeur
└── shared/
    ├── MessageSearch.tsx        # Barre de recherche
    ├── FileUpload.tsx          # Upload de fichiers
    ├── StatusIndicator.tsx     # Indicateurs de statut
    └── InfiniteScroll.tsx      # Pagination infinie
```

### Intégration des Pages

```
app/(pages)/messages/
├── page.tsx                     # Page principale des messages
├── support/
│   ├── page.tsx                # Liste des demandes SAV
│   ├── [id]/
│   │   └── page.tsx            # Détail d'une demande
│   └── new/
│       └── page.tsx            # Créer une demande
└── conversations/
    ├── page.tsx                # Liste des conversations
    ├── [vendorId]/
    │   └── page.tsx            # Conversation avec un vendeur
    └── new/
        └── page.tsx            # Nouveau message
```

### Endpoints API

```
app/api/messages/
├── support/
│   ├── route.ts                # GET: Liste tickets, POST: Créer ticket
│   ├── [id]/
│   │   ├── route.ts            # GET: Détail, PUT: Mettre à jour
│   │   └── messages/
│   │       └── route.ts        # POST: Ajouter réponse
│   └── categories/
│       └── route.ts            # GET: Catégories de support
├── conversations/
│   ├── route.ts                # GET: Liste conversations, POST: Nouvelle conversation
│   ├── [id]/
│   │   ├── route.ts            # GET: Messages conversation
│   │   └── messages/
│   │       └── route.ts        # POST: Envoyer message
│   └── vendors/
│       └── route.ts            # GET: Liste des vendeurs
└── notifications/
    └── route.ts                # GET: Notifications messages
```

## Composants et Interfaces

### Modèles de Données

```typescript
interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: SupportCategory;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  userId: string;
  assignedTo?: string;
  attachments: Attachment[];
  messages: TicketMessage[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

interface TicketMessage {
  id: string;
  ticketId: string;
  content: string;
  authorId: string;
  authorType: 'USER' | 'SUPPORT';
  attachments: Attachment[];
  isInternal: boolean;
  createdAt: Date;
}

interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments: Attachment[];
  readBy: MessageRead[];
  createdAt: Date;
  editedAt?: Date;
}

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

interface SupportCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}
```

### Interface Principale

```typescript
interface MessagesLayoutProps {
  user: User;
  initialTab?: 'support' | 'conversations';
}

export function MessagesLayout({ user, initialTab = 'support' }: MessagesLayoutProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [unreadCounts, setUnreadCounts] = useState({
    support: 0,
    conversations: 0
  });

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">Mes messages et demandes</Title>
          <Text c="dimmed">Gérez vos demandes de support et conversations avec les vendeurs</Text>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab 
              value="support" 
              leftSection={<Headphones size={16} />}
              rightSection={unreadCounts.support > 0 && (
                <Badge size="xs" color="red">{unreadCounts.support}</Badge>
              )}
            >
              Mes demandes
            </Tabs.Tab>
            <Tabs.Tab 
              value="conversations"
              leftSection={<MessageCircle size={16} />}
              rightSection={unreadCounts.conversations > 0 && (
                <Badge size="xs" color="blue">{unreadCounts.conversations}</Badge>
              )}
            >
              Mes messages
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="support">
            <SupportTickets user={user} />
          </Tabs.Panel>

          <Tabs.Panel value="conversations">
            <ConversationsList user={user} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
```

### Composant Demandes SAV

```typescript
interface SupportTicketsProps {
  user: User;
}

export function SupportTickets({ user }: SupportTicketsProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all'
  });
  const [loading, setLoading] = useState(true);

  return (
    <Stack gap="lg">
      {/* Barre d'actions */}
      <Group justify="space-between">
        <TicketFilters filters={filters} onFiltersChange={setFilters} />
        <Button leftSection={<Plus size={16} />} onClick={openCreateModal}>
          Nouvelle demande
        </Button>
      </Group>

      {/* Liste des tickets */}
      <Card withBorder>
        {loading ? (
          <LoadingState />
        ) : tickets.length === 0 ? (
          <EmptyState 
            icon={<Headphones size={48} />}
            title="Aucune demande"
            description="Vous n'avez pas encore créé de demande de support."
            action={
              <Button leftSection={<Plus size={16} />}>
                Créer ma première demande
              </Button>
            }
          />
        ) : (
          <Stack gap={0}>
            {tickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} onClick={() => openTicket(ticket.id)} />
            ))}
          </Stack>
        )}
      </Card>

      {/* Pagination */}
      <InfiniteScroll onLoadMore={loadMoreTickets} hasMore={hasMoreTickets} />
    </Stack>
  );
}
```

### Composant Vue Détaillée de Demande

```typescript
interface TicketDetailProps {
  ticketId: string;
  onClose: () => void;
}

export function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  return (
    <Modal opened size="xl" onClose={onClose} title={`Demande #${ticket?.ticketNumber}`}>
      <Stack gap="lg">
        {/* En-tête du ticket */}
        <Card withBorder>
          <Group justify="space-between" mb="md">
            <div>
              <Title order={3}>{ticket?.title}</Title>
              <Text size="sm" c="dimmed">
                Créée le {ticket?.createdAt.toLocaleDateString('fr-FR')}
              </Text>
            </div>
            <Group>
              <TicketStatusBadge status={ticket?.status} />
              <Badge color={getPriorityColor(ticket?.priority)}>
                {getPriorityLabel(ticket?.priority)}
              </Badge>
            </Group>
          </Group>
          
          <Text>{ticket?.description}</Text>
          
          {ticket?.attachments.length > 0 && (
            <AttachmentsList attachments={ticket.attachments} />
          )}
        </Card>

        {/* Historique des messages */}
        <Card withBorder>
          <Title order={4} mb="md">Historique</Title>
          <Stack gap="md">
            {ticket?.messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message}
                isFromUser={message.authorType === 'USER'}
              />
            ))}
          </Stack>
        </Card>

        {/* Composer une réponse */}
        {ticket?.status !== 'CLOSED' && (
          <Card withBorder>
            <Title order={4} mb="md">Votre réponse</Title>
            <Stack gap="md">
              <Textarea
                placeholder="Écrivez votre message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                minRows={3}
                autosize
              />
              
              <FileUpload
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onFilesChange={setAttachments}
                maxSize={5 * 1024 * 1024} // 5MB
              />
              
              <Group justify="flex-end">
                <Button 
                  leftSection={<Send size={16} />}
                  onClick={sendReply}
                  disabled={!newMessage.trim()}
                >
                  Envoyer
                </Button>
              </Group>
            </Stack>
          </Card>
        )}
      </Stack>
    </Modal>
  );
}
```

### Composant Conversations

```typescript
interface ConversationsListProps {
  user: User;
}

export function ConversationsList({ user }: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px', height: '600px' }}>
      {/* Liste des conversations */}
      <Card withBorder style={{ display: 'flex', flexDirection: 'column' }}>
        <Stack gap="md" p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
          <Group justify="space-between">
            <Title order={4}>Conversations</Title>
            <Button size="xs" leftSection={<Plus size={14} />}>
              Nouveau
            </Button>
          </Group>
          
          <TextInput
            placeholder="Rechercher une conversation..."
            leftSection={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Stack>

        <ScrollArea style={{ flex: 1 }}>
          {conversations.length === 0 ? (
            <EmptyState 
              icon={<MessageCircle size={48} />}
              title="Aucune conversation"
              description="Commencez une conversation avec un vendeur."
            />
          ) : (
            <Stack gap={0}>
              {conversations.map((conversation) => (
                <ConversationRow 
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation === conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                />
              ))}
            </Stack>
          )}
        </ScrollArea>
      </Card>

      {/* Vue de conversation */}
      <Card withBorder>
        {selectedConversation ? (
          <ConversationView 
            conversationId={selectedConversation}
            user={user}
          />
        ) : (
          <EmptyState 
            icon={<MessageCircle size={48} />}
            title="Sélectionnez une conversation"
            description="Choisissez une conversation dans la liste pour commencer à échanger."
          />
        )}
      </Card>
    </div>
  );
}
```

## Modèles de Données

### Extensions de Schéma Base de Données

```sql
-- Table des tickets de support
CREATE TABLE support_tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category_id BIGINT REFERENCES support_categories(id),
  priority VARCHAR(20) DEFAULT 'NORMAL',
  status VARCHAR(20) DEFAULT 'OPEN',
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL
);

-- Table des catégories de support
CREATE TABLE support_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Table des messages de tickets
CREATE TABLE ticket_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT REFERENCES support_tickets(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  author_type VARCHAR(20) NOT NULL, -- 'USER' or 'SUPPORT'
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des conversations (étend les threads existants)
ALTER TABLE message_threads ADD COLUMN conversation_type VARCHAR(20) DEFAULT 'GENERAL';
ALTER TABLE message_threads ADD COLUMN vendor_id BIGINT REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE message_threads ADD COLUMN last_message_at TIMESTAMP;

-- Table des participants aux conversations
CREATE TABLE conversation_participants (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'PARTICIPANT', -- 'PARTICIPANT', 'MODERATOR'
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP,
  UNIQUE(thread_id, user_id)
);

-- Table des lectures de messages
CREATE TABLE message_reads (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id)
);

-- Table des pièces jointes
CREATE TABLE message_attachments (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
  ticket_message_id BIGINT REFERENCES ticket_messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (message_id IS NOT NULL OR ticket_message_id IS NOT NULL)
);
```

### Modèles Prisma

```typescript
model SupportTicket {
  id           BigInt   @id @default(autoincrement())
  ticketNumber String   @unique @map("ticket_number")
  title        String
  description  String   @db.Text
  categoryId   BigInt   @map("category_id")
  priority     Priority @default(NORMAL)
  status       TicketStatus @default(OPEN)
  userId       BigInt   @map("user_id")
  assignedTo   BigInt?  @map("assigned_to")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  resolvedAt   DateTime? @map("resolved_at")

  category     SupportCategory @relation(fields: [categoryId], references: [id])
  user         User @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignee     User? @relation("AssignedTickets", fields: [assignedTo], references: [id], onDelete: SetNull)
  messages     TicketMessage[]
  attachments  MessageAttachment[]

  @@map("support_tickets")
}

model SupportCategory {
  id          BigInt  @id @default(autoincrement())
  name        String
  description String?
  icon        String?
  color       String?
  sortOrder   Int     @default(0) @map("sort_order")
  isActive    Boolean @default(true) @map("is_active")

  tickets     SupportTicket[]

  @@map("support_categories")
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}
```

## Gestion des Erreurs

### Gestion d'Erreurs Côté Client

```typescript
interface MessageError {
  type: 'NETWORK' | 'VALIDATION' | 'PERMISSION' | 'FILE_SIZE' | 'FILE_TYPE';
  message: string;
  field?: string;
}

const handleMessageError = (error: MessageError) => {
  switch (error.type) {
    case 'NETWORK':
      notifications.show({
        title: 'Erreur de connexion',
        message: 'Vérifiez votre connexion internet et réessayez',
        color: 'red',
      });
      break;
    case 'FILE_SIZE':
      notifications.show({
        title: 'Fichier trop volumineux',
        message: 'La taille maximale autorisée est de 5MB',
        color: 'orange',
      });
      break;
    case 'FILE_TYPE':
      notifications.show({
        title: 'Type de fichier non autorisé',
        message: 'Seuls les images et documents PDF/Word sont acceptés',
        color: 'orange',
      });
      break;
  }
};
```

### Gestion d'Erreurs Côté Serveur

```typescript
export class MessageError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'MessageError';
  }
}

// Validation des règles métier
const validateTicketOperation = (ticket: SupportTicket, operation: string) => {
  switch (operation) {
    case 'REPLY':
      if (ticket.status === 'CLOSED') {
        throw new MessageError(
          'Impossible de répondre à une demande fermée',
          'TICKET_CLOSED',
          400
        );
      }
      break;
    case 'CLOSE':
      if (ticket.status === 'OPEN') {
        throw new MessageError(
          'Veuillez d\'abord traiter la demande avant de la fermer',
          'TICKET_NOT_PROCESSED',
          400
        );
      }
      break;
  }
};
```

## Stratégie de Test

### Tests Unitaires

```typescript
describe('MessagesLayout', () => {
  it('should display support tickets tab by default', () => {
    render(<MessagesLayout user={mockUser} />);
    expect(screen.getByText('Mes demandes')).toBeInTheDocument();
  });
  
  it('should show unread count badges', () => {
    render(<MessagesLayout user={mockUser} />);
    // Test badge display logic
  });
});

describe('SupportTickets', () => {
  it('should filter tickets by status', () => {
    // Test filtering functionality
  });
  
  it('should create new ticket', () => {
    // Test ticket creation
  });
});
```

### Tests d'Intégration

```typescript
describe('Messages API', () => {
  it('should create and retrieve support tickets', async () => {
    // Test complete ticket workflow
  });
  
  it('should handle conversation messaging', async () => {
    // Test messaging functionality
  });
});
```

## Fonctionnalités Temps Réel

### Intégration WebSocket

```typescript
// Configuration des canaux Pusher
const messagesChannel = pusher.subscribe(`user-messages-${userId}`);

messagesChannel.bind('new-message', (data: NewMessageEvent) => {
  updateConversation(data.conversationId, data.message);
  showNotification(data);
});

messagesChannel.bind('ticket-updated', (data: TicketUpdateEvent) => {
  updateTicketStatus(data.ticketId, data.status);
  if (data.newMessage) {
    addTicketMessage(data.ticketId, data.newMessage);
  }
});
```

### Système de Notifications

```typescript
interface MessageNotification {
  type: 'NEW_MESSAGE' | 'TICKET_REPLY' | 'TICKET_STATUS_CHANGE';
  title: string;
  message: string;
  actionUrl?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
}

const showMessageNotification = (notification: MessageNotification) => {
  notifications.show({
    title: notification.title,
    message: notification.message,
    color: getNotificationColor(notification.type),
    autoClose: notification.priority === 'HIGH' ? false : 5000,
    onClick: notification.actionUrl ? () => router.push(notification.actionUrl) : undefined,
  });
};
```

## Considérations d'Accessibilité

### Navigation au Clavier

```typescript
const useMessagesKeyboardShortcuts = () => {
  useHotkeys([
    ['ctrl+n', () => openCreateTicket()],
    ['ctrl+f', () => focusSearch()],
    ['escape', () => closeModals()],
    ['ctrl+enter', () => sendMessage()],
  ]);
};
```

### Support Lecteur d'Écran

```typescript
const MessageRow = ({ message, isUnread }: MessageRowProps) => (
  <div
    role="button"
    tabIndex={0}
    aria-label={`Message de ${message.sender.name}, ${isUnread ? 'non lu' : 'lu'}, envoyé le ${message.createdAt.toLocaleDateString('fr-FR')}`}
    aria-describedby={`message-preview-${message.id}`}
  >
    {/* Contenu du message */}
  </div>
);
```

## Design Responsive

### Adaptation Mobile

```typescript
const MobileMessagesLayout = () => {
  const [view, setView] = useState<'list' | 'conversation'>('list');
  
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {view === 'list' ? (
        <ConversationsList onSelectConversation={(id) => {
          setSelectedConversation(id);
          setView('conversation');
        }} />
      ) : (
        <ConversationView 
          conversationId={selectedConversation}
          onBack={() => setView('list')}
        />
      )}
    </div>
  );
};
```

### Breakpoints et Adaptations

```typescript
const useResponsiveLayout = () => {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const isTablet = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  
  return {
    isMobile,
    isTablet,
    layout: isMobile ? 'stack' : isTablet ? 'sidebar' : 'split',
    conversationWidth: isMobile ? '100%' : isTablet ? '300px' : '400px',
  };
};
```

## Optimisations de Performance

### Stratégie de Cache

```typescript
// Cache Redis pour les conversations fréquentes
const cacheConversation = async (conversationId: string, messages: Message[]) => {
  await redis.setex(
    `conversation:${conversationId}`,
    1800, // 30 minutes
    JSON.stringify(messages)
  );
};

// Mise à jour optimiste pour les nouveaux messages
const optimisticMessageUpdate = (conversationId: string, message: Message) => {
  setConversations(prev => prev.map(conv => 
    conv.id === conversationId 
      ? { ...conv, lastMessage: message, updatedAt: new Date() }
      : conv
  ));
};
```

### Pagination Infinie

```typescript
const useInfiniteMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages?before=${messages[0]?.id}`);
      const newMessages = await response.json();
      
      setMessages(prev => [...newMessages, ...prev]);
      setHasMore(newMessages.length === 20); // Page size
    } finally {
      setLoading(false);
    }
  }, [conversationId, messages, loading, hasMore]);

  return { messages, loadMore, hasMore, loading };
};
```

Ce document de conception fournit une base complète pour implémenter l'espace "Mes messages et demandes" avec une architecture moderne, une expérience utilisateur optimale et une accessibilité complète.