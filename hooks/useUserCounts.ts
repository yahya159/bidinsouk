'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserCounts {
  favorites: number;
  notifications: number;
  cart: number;
  messages: number;
  support: number;
  totalMessages: number;
}

export function useUserCounts() {
  const { data: session, status } = useSession();
  const [counts, setCounts] = useState<UserCounts>({
    favorites: 0,
    notifications: 0,
    cart: 0,
    messages: 0,
    support: 0,
    totalMessages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    // Ne pas faire la requête si l'utilisateur n'est pas connecté
    if (status !== 'authenticated' || !session?.user?.id) {
      setCounts({
        favorites: 0,
        notifications: 0,
        cart: 0,
        messages: 0,
        support: 0,
        totalMessages: 0
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer tous les compteurs en parallèle
      const [favoritesResponse, notificationsResponse, cartResponse, messagesResponse] = await Promise.all([
        fetch('/api/watchlist/count'),
        fetch('/api/notifications/count'),
        // Le panier n'est pas implémenté, on retourne 0
        Promise.resolve({ ok: true, json: async () => ({ count: 0 }) }),
        fetch('/api/messages/counts')
      ]);

      // Traiter les réponses
      const favoritesData = favoritesResponse.ok ? await favoritesResponse.json() : { count: 0 };
      const notificationsData = notificationsResponse.ok ? await notificationsResponse.json() : { count: 0 };
      const cartData = cartResponse.ok ? await cartResponse.json() : { count: 0 };
      const messagesData = messagesResponse.ok ? await messagesResponse.json() : { support: 0, messages: 0 };

      // Calculer les totaux
      const favoritesCount = favoritesData.count || 0;
      const notificationsCount = notificationsData.count || 0;
      const cartCount = cartData.count || 0;
      const supportCount = messagesData.support || 0;
      const messagesCount = messagesData.messages || 0;
      const totalMessages = supportCount + messagesCount;

      setCounts({
        favorites: favoritesCount,
        notifications: notificationsCount,
        cart: cartCount,
        messages: messagesCount,
        support: supportCount,
        totalMessages
      });

    } catch (err) {
      console.error('Erreur dans useUserCounts:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      // En cas d'exception, retourner des valeurs par défaut
      setCounts({
        favorites: 0,
        notifications: 0,
        cart: 0,
        messages: 0,
        support: 0,
        totalMessages: 0
      });
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