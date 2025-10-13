import Link from 'next/link';
import { Star, User } from 'lucide-react';
import { Button, Avatar, Text } from '@mantine/core';

interface SellerCardProps {
  seller: {
    id: string;
    name: string;
    avatarUrl?: string;
    rating?: number;
    storeSlug: string;
  };
}

export function SellerCard({ seller }: SellerCardProps) {
  return (
    <div>
      <Text fw={600} c="dark" mb="md">Magasin</Text>
      
      <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '12px', padding: '16px' }}>
        {/* Seller Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Avatar size="lg" src={seller.avatarUrl}>
            <User size={24} />
          </Avatar>
          
          <div style={{ flex: 1 }}>
            <Text fw={500} c="dark">{seller.name}</Text>
            {seller.rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ display: 'flex' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      style={{
                        color: i < Math.floor(seller.rating!) ? '#fbbf24' : '#d1d5db',
                        fill: i < Math.floor(seller.rating!) ? '#fbbf24' : 'none'
                      }}
                    />
                  ))}
                </div>
                <Text size="xs" c="dimmed">
                  ({seller.rating})
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button component={Link} href={`/magasin/${seller.storeSlug}`} variant="outline" fullWidth>
            Voir le profil du vendeur
          </Button>
          
          <Button component={Link} href="/profil" variant="subtle" size="sm" fullWidth>
            Voir mon profil client
          </Button>
        </div>
      </div>
    </div>
  );
}