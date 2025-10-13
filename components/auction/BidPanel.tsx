'use client';

import { useState } from 'react';
import { Button, TextInput, Badge, Text, Grid } from '@mantine/core';
import { Plus } from 'lucide-react';
import { notifications } from '@mantine/notifications';
import type { AuctionProduct } from '@/types/auction';

interface BidPanelProps {
  product: AuctionProduct;
  currentBid: number;
  minIncrement: number;
  reserveMet: boolean;
}

export function BidPanel({ product, currentBid, minIncrement, reserveMet }: BidPanelProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minAllowedBid = currentBid + minIncrement;
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleQuickBid = (increment: number) => {
    const amount = currentBid + increment;
    setBidAmount(amount.toString());
  };

  const handleSubmitBid = async () => {
    const amount = parseFloat(bidAmount);
    
    // Validation
    if (!amount || amount < minAllowedBid) {
      notifications.show({
        title: "Enchère invalide",
        message: `Votre enchère doit être d'au moins ${formatPrice(minAllowedBid)} د.م`,
        color: "red"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, call: await fetch('/api/bids', { method: 'POST', body: JSON.stringify({ productId: product.id, amountMAD: amount }) })
      
      notifications.show({
        title: "Enchère placée !",
        message: `Votre enchère de ${formatPrice(amount)} د.م a été enregistrée.`,
        color: "green"
      });
      
      setBidAmount('');
    } catch (error) {
      notifications.show({
        title: "Erreur",
        message: "Impossible de placer votre enchère. Veuillez réessayer.",
        color: "red"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if auction has ended
  const hasEnded = new Date(product.endsAtISO) <= new Date();

  return (
    <div>
      <Text fw={600} c="dark" mb="md">Enchère personnalisée</Text>
      
      <div style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '12px', padding: '16px' }}>
        {/* Reserve Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Text size="sm" c="dimmed">Statut de réserve:</Text>
          <Badge color={reserveMet ? "green" : "gray"}>
            {reserveMet ? "Prix de réserve atteint" : "Réserve non atteinte"}
          </Badge>
        </div>

        {/* Current Bid Display */}
        <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--mantine-color-gray-3)', marginBottom: '16px' }}>
          <Text size="sm" c="dimmed">Enchère actuelle</Text>
          <Text size="xl" fw={700} c="orange">
            {formatPrice(currentBid)} د.م
          </Text>
        </div>

        {!hasEnded ? (
          <>
            {/* Quick Bid Buttons */}
            <Grid gutter="xs" mb="md">
              <Grid.Col span={6}>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleQuickBid(minIncrement)}
                  fullWidth
                  leftSection={<Plus size={12} />}
                >
                  +{formatPrice(minIncrement)} د.م
                </Button>
              </Grid.Col>
              <Grid.Col span={6}>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleQuickBid(minIncrement * 2)}
                  fullWidth
                  leftSection={<Plus size={12} />}
                >
                  +{formatPrice(minIncrement * 2)} د.م
                </Button>
              </Grid.Col>
            </Grid>

            {/* Custom Bid Input */}
            <div style={{ marginBottom: '16px' }}>
              <TextInput
                type="number"
                placeholder={`≥ ${formatPrice(minAllowedBid)}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.currentTarget.value)}
                min={minAllowedBid}
                step={minIncrement}
                rightSection={<Text size="sm" c="dimmed">د.م</Text>}
              />
              
              <Text size="xs" c="dimmed" mt="xs">
                (Saisir plus que ou égal à : {formatPrice(minAllowedBid)} د.م)
              </Text>
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmitBid}
              disabled={isSubmitting || !bidAmount}
              fullWidth
            >
              {isSubmitting ? 'Enchère en cours...' : 'Enchère personnalisée'}
            </Button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Text c="red" fw={500}>Enchères terminées</Text>
            <Text size="sm" c="dimmed" mt="xs">
              Cette enchère s'est terminée
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}