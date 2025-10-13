'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface MessageCounts {
  support: number;
  messages: number;
  total: number;
}

export function useMessageCounts() {
  const { data: session } = useSession();
  const [counts, setCounts] = useState<MessageCounts>({
    support: 0,
    messages: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    if (!session?.user?.id) {
      setCounts({ support: 0, messages: 0, total: 0 });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch unread counts for both support tickets and vendor messages
      const [supportResponse, messagesResponse] = await Promise.all([
        fetch('/api/messages/threads?type=SUPPORT_TICKET&unreadOnly=true'),
        fetch('/api/messages/threads?type=VENDOR_CHAT&unreadOnly=true')
      ]);

      if (!supportResponse.ok || !messagesResponse.ok) {
        throw new Error('Erreur lors du chargement des compteurs');
      }

      const [supportData, messagesData] = await Promise.all([
        supportResponse.json(),
        messagesResponse.json()
      ]);

      const supportCount = supportData.unreadCounts?.support || 0;
      const messagesCount = messagesData.unreadCounts?.messages || 0;
      const total = supportCount + messagesCount;

      setCounts({
        support: supportCount,
        messages: messagesCount,
        total
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setCounts({ support: 0, messages: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch counts on mount and when session changes
  useEffect(() => {
    fetchCounts();
  }, [session?.user?.id]);

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