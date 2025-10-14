'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ClientStats {
  orders: number;
  watchlist: number;
  activeAuctions: number;
  reviews: number;
}

export function useClientStats() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<ClientStats>({
    orders: 0,
    watchlist: 0,
    activeAuctions: 0,
    reviews: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    // Ne pas faire la requête si l'utilisateur n'est pas connecté
    if (status !== 'authenticated' || !session?.user?.id) {
      setStats({
        orders: 0,
        watchlist: 0,
        activeAuctions: 0,
        reviews: 0
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer toutes les statistiques en parallèle
      const [ordersResponse, watchlistResponse, auctionsResponse, reviewsResponse] = await Promise.all([
        fetch('/api/orders/count'),
        fetch('/api/watchlist/count'),
        fetch('/api/auctions/my-bids/count'),
        fetch('/api/reviews/my-reviews/count')
      ]);

      // Traiter les réponses
      const ordersData = ordersResponse.ok ? await ordersResponse.json() : { count: 0 };
      const watchlistData = watchlistResponse.ok ? await watchlistResponse.json() : { count: 0 };
      const auctionsData = auctionsResponse.ok ? await auctionsResponse.json() : { count: 0 };
      const reviewsData = reviewsResponse.ok ? await reviewsResponse.json() : { count: 0 };

      setStats({
        orders: ordersData.count || 0,
        watchlist: watchlistData.count || 0,
        activeAuctions: auctionsData.count || 0,
        reviews: reviewsData.count || 0
      });

    } catch (err) {
      console.error('Erreur dans useClientStats:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      // En cas d'exception, retourner des valeurs par défaut
      setStats({
        orders: 0,
        watchlist: 0,
        activeAuctions: 0,
        reviews: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats on mount and when session changes
  useEffect(() => {
    fetchStats();
  }, [session?.user?.id, status]);

  // Refresh function for manual updates
  const refresh = () => {
    fetchStats();
  };

  return {
    stats,
    loading,
    error,
    refresh
  };
}