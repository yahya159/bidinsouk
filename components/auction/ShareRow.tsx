'use client';

import { Button, Text } from '@mantine/core';
import { Share2, Copy, MessageCircle } from 'lucide-react';
import { notifications } from '@mantine/notifications';

interface ShareRowProps {
  title: string;
  url: string;
}

export function ShareRow({ title, url }: ShareRowProps) {
  const handleCopyLink = async () => {
    try {
      const fullUrl = `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      notifications.show({
        title: "Lien copié !",
        message: "Le lien du produit a été copié dans le presse-papiers.",
        color: "green"
      });
    } catch (error) {
      notifications.show({
        title: "Erreur",
        message: "Impossible de copier le lien.",
        color: "red"
      });
    }
  };

  const handleWhatsAppShare = () => {
    const fullUrl = `${window.location.origin}${url}`;
    const text = encodeURIComponent(`Regarde ce produit : ${title} ${fullUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleFacebookShare = () => {
    const fullUrl = `${window.location.origin}${url}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank');
  };

  const handleTwitterShare = () => {
    const fullUrl = `${window.location.origin}${url}`;
    const text = encodeURIComponent(`Regarde ce produit : ${title}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(fullUrl)}`, '_blank');
  };

  return (
    <div>
      <Text fw={600} c="dark" mb="md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Share2 size={16} />
        Partager ce produit
      </Text>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleWhatsAppShare}
          color="green"
          leftSection={<MessageCircle size={16} />}
        >
          WhatsApp
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleFacebookShare}
          color="blue"
          leftSection={
            <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          }
        >
          Facebook
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleTwitterShare}
          color="cyan"
          leftSection={
            <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          }
        >
          Twitter
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          leftSection={<Copy size={16} />}
        >
          Copier le lien
        </Button>
      </div>
    </div>
  );
}