import { useEffect, useState, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import Pusher from 'pusher-js';

interface Bid {
  id: string;
  amount: number;
  bidder: {
    id: string;
    name: string;
  };
  placedAt: string;
}

interface AuctionUpdate {
  currentBid: number;
  bidsCount: number;
}

export function useAuctionRealtime(auctionId: string, currentUserId?: string) {
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [bidsCount, setBidsCount] = useState<number>(0);
  const [latestBids, setLatestBids] = useState<Bid[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load bid sound
    if (typeof window !== 'undefined') {
      soundRef.current = new Audio('/sounds/bid.mp3');
    }
  }, []);

  useEffect(() => {
    // Check if Pusher credentials are configured
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      console.warn('⚠️ Pusher not configured. Set NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER in .env.local');
      setIsConnected(false);
      return;
    }

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: '/api/pusher/auth',
    });

    const channel = pusher.subscribe(`auction-${auctionId}`);

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
      console.log(`✅ Subscribed to auction-${auctionId}`);
    });

    channel.bind('bid-placed', (data: { bid: Bid; auction: AuctionUpdate }) => {
      setCurrentBid(data.auction.currentBid);
      setBidsCount(data.auction.bidsCount);
      setLatestBids(prev => [data.bid, ...prev].slice(0, 10));

      // Don't notify if current user placed the bid
      if (data.bid.bidder.id !== currentUserId) {
        notifications.show({
          title: 'Nouvelle enchère',
          message: `${data.bid.bidder.name} a enchéri ${data.bid.amount} د.م`,
          color: 'orange',
          autoClose: 3000,
        });

        // Play sound
        soundRef.current?.play().catch(() => {
          // User hasn't interacted with page yet
        });
      }
    });

    channel.bind('auction-ended', () => {
      notifications.show({
        title: 'Enchère terminée',
        message: 'Cette enchère est maintenant terminée',
        color: 'red',
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [auctionId, currentUserId]);

  return { 
    currentBid, 
    bidsCount, 
    latestBids, 
    isConnected 
  };
}

