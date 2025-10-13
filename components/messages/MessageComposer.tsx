'use client';

import { useState, useRef } from 'react';
import { 
  Textarea, 
  Button, 
  Group, 
  ActionIcon, 
  FileInput, 
  Text, 
  Stack,
  Card,
  Progress,
  Alert
} from '@mantine/core';
import { 
  IconSend, 
  IconPaperclip, 
  IconX, 
  IconFile, 
  IconPhoto,
  IconLoader2,
  IconAlertCircle
} from '@tabler/icons-react';
import { useHotkeys } from '@mantine/hooks';
import { useRefreshMessageCounts } from '@/contexts/MessageCountsContext';

interface MessageComposerProps {
  threadId: string;
  onMessageSent: () => void;
}

interface AttachmentFile {
  file: File;
  id: string;
  progress: number;
  error?: string;
}

export const MessageComposer = ({ threadId, onMessageSent }: MessageComposerProps) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refreshMessageCounts = useRefreshMessageCounts();

  // Raccourci clavier pour envoyer (Ctrl+Enter)
  useHotkeys([
    ['ctrl+Enter', () => handleSend()],
    ['mod+Enter', () => handleSend()]
  ]);

  // Gérer l'ajout de fichiers
  const handleFileSelect = (files: File[] | null) => {
    if (!files) return;

    const newAttachments: AttachmentFile[] = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0
    }));

    // Vérifier la taille des fichiers (max 10MB par fichier)
    const validAttachments = newAttachments.filter(attachment => {
      if (attachment.file.size > 10 * 1024 * 1024) {
        attachment.error = 'Fichier trop volumineux (max 10MB)';
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validAttachments]);
  };

  // Supprimer une pièce jointe
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Upload d'un fichier
  const uploadFile = async (attachment: AttachmentFile): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', attachment.file);
    formData.append('threadId', threadId);

    try {
      const response = await fetch('/api/messages/attachments', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      const data = await response.json();
      return data.attachmentId;
    } catch (err) {
      console.error('Erreur upload:', err);
      return null;
    }
  };

  // Envoyer le message
  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Upload des pièces jointes d'abord
      const attachmentIds: string[] = [];
      
      for (const attachment of attachments) {
        if (!attachment.error) {
          const attachmentId = await uploadFile(attachment);
          if (attachmentId) {
            attachmentIds.push(attachmentId);
          }
        }
      }

      // Envoyer le message
      const response = await fetch(`/api/messages/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message.trim(),
          attachmentIds
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }

      // Réinitialiser le formulaire
      setMessage('');
      setAttachments([]);
      onMessageSent();
      
      // Rafraîchir les compteurs globaux
      refreshMessageCounts();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la touche Entrée
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // Obtenir l'icône pour un type de fichier
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <IconPhoto size={16} />;
    }
    return <IconFile size={16} />;
  };

  return (
    <Stack gap="sm">
      {/* Erreur */}
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {error}
        </Alert>
      )}

      {/* Pièces jointes */}
      {attachments.length > 0 && (
        <Stack gap="xs">
          {attachments.map(attachment => (
            <Card key={attachment.id} p="xs" withBorder>
              <Group justify="space-between" align="center">
                <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                  {getFileIcon(attachment.file.type)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" truncate>
                      {attachment.file.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {(attachment.file.size / 1024).toFixed(1)} KB
                    </Text>
                    {attachment.error && (
                      <Text size="xs" c="red">
                        {attachment.error}
                      </Text>
                    )}
                  </div>
                </Group>
                
                {attachment.progress > 0 && attachment.progress < 100 && (
                  <Progress value={attachment.progress} size="sm" style={{ width: 100 }} />
                )}
                
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={() => removeAttachment(attachment.id)}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      {/* Zone de saisie */}
      <div>
        <Textarea
          placeholder="Tapez votre message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          minRows={3}
          maxRows={8}
          autosize
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <FileInput
            ref={fileInputRef}
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <ActionIcon
            variant="subtle"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <IconPaperclip size={16} />
          </ActionIcon>
          
          <Text size="xs" c="dimmed">
            Joindre des fichiers (max 10MB)
          </Text>
        </Group>

        <Group gap="xs" align="center">
          <Text size="xs" c="dimmed">
            Ctrl+Entrée pour envoyer
          </Text>
          
          <Button
            leftSection={
              isLoading ? (
                <IconLoader2 size={16} className="animate-spin" />
              ) : (
                <IconSend size={16} />
              )
            }
            onClick={handleSend}
            disabled={(!message.trim() && attachments.length === 0) || isLoading}
            size="sm"
          >
            {isLoading ? 'Envoi...' : 'Envoyer'}
          </Button>
        </Group>
      </Group>
    </Stack>
  );
};