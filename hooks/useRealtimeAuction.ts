'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import PusherClient from 'pusher-js';

// Initialize Pusher client (singleton)
let pusherClient: PusherClient | null = null;

function getPusherClient(): PusherClient {
  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
      forceTLS: true,
    });
  }
  return pusherClient;
}

interface BidEvent {
  auctionId: number;
  currentBid: number;
  bidderName: string;
  bidCount: number;
  timestamp: string;
  extendedEndTime?: string;
}

interface AuctionStatusEvent {
  status: string;
  timestamp: string;
}

interface AuctionEndEvent {
  winnerId?: number;
  winningBid?: number;
  timestamp: string;
}

interface UseRealtimeAuctionOptions {
  auctionId: number;
  onBidUpdate?: (data: BidEvent) => void;
  onAuctionExtend?: (newEndTime: string) => void;
  onAuctionEnd?: (data: AuctionEndEvent) => void;
  onStatusChange?: (status: string) => void;
  enableNotifications?: boolean;
  enablePollingFallback?: boolean;
  pollingInterval?: number;
}

export function useRealtimeAuction({
  auctionId,
  onBidUpdate,
  onAuctionExtend,
  onAuctionEnd,
  onStatusChange,
  enableNotifications = true,
  enablePollingFallback = true,
  pollingInterval = 5000,
}: UseRealtimeAuctionOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('initialized');
  const [lastBidTime, setLastBidTime] = useState<string | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Polling fallback function
  const startPolling = useCallback(async () => {
    if (!enablePollingFallback) return;

    const poll = async () => {
      try {
        const response = await fetch(`/api/auctions/${auctionId}`);
        if (response.ok) {
          const data = await response.json();
          
          // Check if there's a new bid
          if (data.updatedAt !== lastBidTime) {
            onBidUpdate?.({
              auctionId: data.id,
              currentBid: data.currentBid,
              bidderName: 'Anonymous', // Polling doesn't provide bidder name
              bidCount: data.bidsCount,
              timestamp: data.updatedAt,
            });
            setLastBidTime(data.updatedAt);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll
    await poll();

    // Set up interval
    pollingIntervalRef.current = setInterval(poll, pollingInterval);
  }, [auctionId, enablePollingFallback, lastBidTime, onBidUpdate, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Catch up on missed bids after reconnection
  const catchUpMissedBids = useCallback(async () => {
    if (!lastBidTime) return;

    try {
      const response = await fetch(
        `/api/auctions/${auctionId}/bids?since=${lastBidTime}`
      );
      
      if (response.ok) {
        const missedBids = await response.json();
        
        if (missedBids.length > 0) {
          // Apply the latest bid
          const latestBid = missedBids[missedBids.length - 1];
          onBidUpdate?.({
            auctionId,
            currentBid: latestBid.amount,
            bidderName: latestBid.bidder?.name || 'Anonymous',
            bidCount: missedBids.length,
            timestamp: latestBid.createdAt,
          });
          
          if (enableNotifications) {
            notifications.show({
              title: 'Reconnected',
              message: `Caught up on ${missedBids.length} missed bid(s)`,
              color: 'blue',
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to catch up on missed bids:', error);
    }
  }, [auctionId, lastBidTime, onBidUpdate, enableNotifications]);

  useEffect(() => {
    const client = getPusherClient();
    const channelName = `auction-${auctionId}`;

    // Subscribe to channel
    const channel = client.subscribe(channelName);
    channelRef.current = channel;

    // Handle new bids
    const handleNewBid = (data: BidEvent) => {
      // Validate event data
      if (!data.currentBid || !data.timestamp) {
        console.error('Invalid bid event:', data);
        return;
      }

      // Validate timestamp (prevent replay attacks)
      const eventTime = new Date(data.timestamp).getTime();
      const now = Date.now();
      const timeDiff = now - eventTime;

      if (timeDiff > 10000) {
        console.warn('Stale bid event ignored:', data);
        return;
      }

      // Update last bid time
      setLastBidTime(data.timestamp);

      // Call callback
      onBidUpdate?.(data);

      // Show notification
      if (enableNotifications) {
        notifications.show({
          title: 'New Bid!',
          message: `${data.bidderName} bid ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(data.currentBid)}`,
          color: 'green',
          autoClose: 3000,
        });
      }

      // Handle auction extension
      if (data.extendedEndTime) {
        onAuctionExtend?.(data.extendedEndTime);
        
        if (enableNotifications) {
          notifications.show({
            title: 'Auction Extended',
            message: 'The auction has been extended due to last-minute bidding',
            color: 'orange',
            autoClose: 5000,
          });
        }
      }
    };

    // Handle auction status changes
    const handleStatusChange = (data: AuctionStatusEvent) => {
      onStatusChange?.(data.status);
      
      if (enableNotifications && data.status === 'ENDING_SOON') {
        notifications.show({
          title: 'Auction Ending Soon',
          message: 'Less than 5 minutes remaining!',
          color: 'orange',
          autoClose: 5000,
        });
      }
    };

    // Handle auction end
    const handleAuctionEnd = (data: AuctionEndEvent) => {
      onAuctionEnd?.(data);
      
      if (enableNotifications) {
        notifications.show({
          title: 'Auction Ended',
          message: data.winnerId 
            ? `Winning bid: ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(data.winningBid || 0)}`
            : 'No winner',
          color: 'blue',
          autoClose: 10000,
        });
      }
    };

    // Bind events
    channel.bind('bid:new', handleNewBid);
    channel.bind('auction:status', handleStatusChange);
    channel.bind('auction:end', handleAuctionEnd);

    // Handle connection state changes
    const handleStateChange = (states: { previous: string; current: string }) => {
      setConnectionState(states.current);
      setIsConnected(states.current === 'connected');

      if (states.current === 'connected') {
        console.log('Pusher connected');
        stopPolling();
        
        // Catch up on missed bids if reconnecting
        if (states.previous === 'disconnected' || states.previous === 'unavailable') {
          catchUpMissedBids();
        }
      } else if (states.current === 'unavailable' || states.current === 'failed') {
        console.warn('Pusher unavailable, falling back to polling');
        startPolling();
      }
    };

    client.connection.bind('state_change', handleStateChange);

    // Set initial connection state
    setConnectionState(client.connection.state);
    setIsConnected(client.connection.state === 'connected');

    // Cleanup
    return () => {
      channel.unbind('bid:new', handleNewBid);
      channel.unbind('auction:status', handleStatusChange);
      channel.unbind('auction:end', handleAuctionEnd);
      channel.unsubscribe();
      client.connection.unbind('state_change', handleStateChange);
      stopPolling();
    };
  }, [
    auctionId,
    onBidUpdate,
    onAuctionExtend,
    onAuctionEnd,
    onStatusChange,
    enableNotifications,
    catchUpMissedBids,
    startPolling,
    stopPolling,
  ]);

  return {
    isConnected,
    connectionState,
    channel: channelRef.current,
  };
}
