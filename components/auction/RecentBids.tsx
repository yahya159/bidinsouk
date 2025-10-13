'use client';

import { useState } from 'react';
import { Avatar, Button, Modal, Text } from '@mantine/core';
import { User } from 'lucide-react';
import type { Bid } from '@/types/auction';

interface RecentBidsProps {
  bids: Bid[];
}

export function RecentBids({ bids }: RecentBidsProps) {
  const [showAllBids, setShowAllBids] = useState(false);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `il y a ${diffInDays}j`;
  };

  const recentBids = bids.slice(0, 5);

  return (
    <div>
      <Text fw={600} c="dark" mb="md">Dernières enchères</Text>
      
      <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '12px', padding: '16px' }}>
        {bids.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="lg">
            Aucune enchère pour le moment
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentBids.map((bid) => (
              <div key={bid.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', borderRadius: '8px', padding: '12px' }}>
                <Avatar size="sm" src={bid.bidder.avatarUrl}>
                  <User size={16} />
                </Avatar>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text size="sm" fw={500} truncate>
                      {bid.bidder.displayName}
                      {bid.bidder.isSeller && (
                        <Text component="span" size="xs" c="blue" ml="xs">(Vendeur)</Text>
                      )}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatTimeAgo(bid.placedAtISO)}
                    </Text>
                  </div>
                  <Text size="sm" fw={700} c="orange">
                    {formatPrice(bid.amountMAD)} د.م
                  </Text>
                </div>
              </div>
            ))}
            
            {bids.length > 5 && (
              <>
                <Button variant="subtle" size="sm" fullWidth onClick={() => setShowAllBids(true)}>
                  Voir toutes les enchères ({bids.length})
                </Button>
                
                <Modal opened={showAllBids} onClose={() => setShowAllBids(false)} title="Toutes les enchères" size="md">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {bids.map((bid) => (
                      <div key={bid.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }}>
                        <Avatar size="sm" src={bid.bidder.avatarUrl}>
                          <User size={16} />
                        </Avatar>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text size="sm" fw={500} truncate>
                              {bid.bidder.displayName}
                              {bid.bidder.isSeller && (
                                <Text component="span" size="xs" c="blue" ml="xs">(Vendeur)</Text>
                              )}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {formatTimeAgo(bid.placedAtISO)}
                            </Text>
                          </div>
                          <Text size="sm" fw={700} c="orange">
                            {formatPrice(bid.amountMAD)} د.م
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </Modal>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}