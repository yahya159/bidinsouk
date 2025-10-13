'use client';

import { useState } from 'react';
import { Button, Textarea, Text } from '@mantine/core';
import { MessageCircle } from 'lucide-react';
import { notifications } from '@mantine/notifications';

interface AskQuestionProps {
  productId: string;
}

export function AskQuestion({ productId }: AskQuestionProps) {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxLength = 500;
  const remainingChars = maxLength - question.length;

  const handleSubmit = async () => {
    if (!question.trim()) {
      notifications.show({
        title: "Question vide",
        message: "Veuillez saisir votre question.",
        color: "red"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, call: await fetch('/api/questions', { method: 'POST', body: JSON.stringify({ productId, message: question }) })
      
      notifications.show({
        title: "Question envoyée !",
        message: "Le vendeur vous répondra par message.",
        color: "green"
      });
      
      setQuestion('');
    } catch (error) {
      notifications.show({
        title: "Erreur",
        message: "Impossible d'envoyer votre question. Veuillez réessayer.",
        color: "red"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Text fw={600} c="dark" mb="md">Poser une question</Text>
      
      <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '12px', padding: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Textarea
            placeholder="Posez votre question au vendeur..."
            value={question}
            onChange={(e) => setQuestion(e.currentTarget.value)}
            maxLength={maxLength}
            rows={4}
            resize="none"
          />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <Text size="xs" c="dimmed">
              Le vendeur vous répondra par message.
            </Text>
            <Text size="xs" c={remainingChars < 50 ? 'orange' : 'dimmed'}>
              {remainingChars} caractères restants
            </Text>
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !question.trim()}
          variant="light"
          fullWidth
          leftSection={<MessageCircle size={16} />}
        >
          {isSubmitting ? 'Envoi en cours...' : 'Poser une question'}
        </Button>
      </div>
    </div>
  );
}