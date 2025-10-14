'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface MessageCounts {
  support: number;
  messages: number;
  total: number;
}

export function useMessageCounts() {
  const { data: session, status } = useSession();
  const [counts, setCounts] = useState<MessageCounts>({
    support: 0,
    messages: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    // Ne pas faire la requête si l'utilisateur n'est pas connecté
    if (status !== 'authenticated' || !session?.user?.id) {
      setCounts({ support: 0, messages: 0, total: 0 });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Utiliser la nouvelle API simplifiée pour les compteurs
      const response = await fetch('/api/messages/counts');
      
      if (!response.ok) {
        console.error('Erreur API:', {
          status: response.status,
          url: response.url
        });
        // En cas d'erreur, retourner des valeurs par défaut
        setCounts({ support: 0, messages: 0, total: 0 });
        return;
      }

      const data = await response.json();

      // Les données sont déjà formatées correctement
      const supportCount = data.support || 0;
      const messagesCount = data.messages || 0;
      const total = supportCount + messagesCount;

      setCounts({
        support: supportCount,
        messages: messagesCount,
        total
      });

    } catch (err) {
      console.error('Erreur dans useMessageCounts:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      // En cas d'exception, retourner des valeurs par défaut
      setCounts({ support: 0, messages: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch counts on mount and when session changes
  useEffect(() => {
    fetchCounts();
  }, [session?.user?.id, status]);

  // Refresh function for manual updates
  const refresh = () => {
    fetchCounts();
  };

  return {
    counts,
    loading,
    error,
    refresh
  };
}