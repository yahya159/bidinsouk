'use client';

import { useState, useEffect } from 'react';
import {
  Drawer,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Badge,
  Avatar,
  Timeline,
  Button,
  NumberInput,
  Switch,
  Divider,
  ScrollArea,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  Users,
  Clock,
  TrendingUp,
  Zap,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { notifications } from '@mantine/notifications';

interface Bid {
  id: string;
  bidderId: string;
  bidderName: string;
  bidderAvatar?: string;
  amount: number;
  timestamp: string;
  isWinning: boolean;
  isAutomatic: boolean;
  maxBid?: number;
}

interface AutoBid {
  id: string;
  bidderId: string;
  bidderName: string;
  maxAmount: number;
  increment: number;
  isActive: boolean;
  createdAt: string;
}

interface AuctionBidPanelProps {
  opened: boolean;
  onClose: () => void;
  auctionId: string;
  auctionTitle: string;
  currentBid: number;
  increment: number;
  endTime: string;
}

export function AuctionBidPanel({
  opened,
  onClose,
  auctionId,
  auctionTitle,
  currentBid,
  increment,
  endTime,
}: AuctionBidPanelProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [autoBids, setAutoBids] = useState<AutoBid[]>([]);
  const [loading, setLoading] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  // Mock data
  useEffect(() => {
    setBids([
      {
        id: '1',
        bidderId: 'user-123',
        bidderName: 'Utilisateur 123',
        bidderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&auto=format',
        amount: currentBid,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        isWinning: true,
        isAutomatic: false,
      },
      {
        id: '2',
        bidderId: 'user-456',
        bidderName: 'Utilisateur 456',
        amount: currentBid - increment,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        isWinning: false,
        isAutomatic: true,
      },
      {
        id: '3',
        bidderId: 'user-789',
        bidderName: 'Utilisateur 789',
        amount: currentBid - increment * 2,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        isWinning: false,
        isAutomatic: false,
      },
    ]);

    setAutoBids([
      {
        id: '1',
        bidderId: 'user-456',
        bidderName: 'Utilisateur 456',
        maxAmount: currentBid + increment * 5,
        increment: increment,
        isActive: true,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        bidderId: 'user-789',
        bidderName: 'Utilisateur 789',
        maxAmount: currentBid + increment * 3,
        increment: increment,
        isActive: false,
        createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      },
    ]);
  }, [auctionId, currentBid, increment]);

  // Simulate real-time updates
  useEffect(() => {
    if (!realTimeEnabled || !opened) return;

    const interval = setInterval(() => {
      // Simulate new bid occasionally
      if (Math.random() < 0.1) {
        const newBid: Bid = {
          id: `bid-${Date.now()}`,
          bidderId: `user-${Math.floor(Math.random() * 1000)}`,
          bidderName: `Utilisateur ${Math.floor(Math.random() * 1000)}`,
          amount: currentBid + increment,
          timestamp: new Date().toISOString(),
          isWinning: true,
          isAutomatic: Math.random() < 0.3,
        };

        setBids(prev => {
          const updated = prev.map(bid => ({ ...bid, isWinning: false }));
          return [newBid, ...updated];
        });

        notifications.show({
          title: 'Nouvelle enchère',
          message: `${newBid.bidderName} a misé ${new Intl.NumberFormat('fr-FR').format(newBid.amount)} MAD`,
          color: 'blue',
          autoClose: 3000,
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [realTimeEnabled, opened, currentBid, increment]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Terminée';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const refreshData = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    notifications.show({
      title: 'Données actualisées',
      message: 'Les enchères ont été mises à jour',
      color: 'green',
    });
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Users size={20} />
          <div>
            <Text fw={600}>Enchérisseurs</Text>
            <Text size="sm" c="dimmed">{auctionTitle}</Text>
          </div>
        </Group>
      }
      position="right"
      size="lg"
    >
      <Stack gap="md">
        {/* Real-time Controls */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between">
            <Group gap="sm">
              <Switch
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.currentTarget.checked)}
                label="Temps réel"
                size="sm"
              />
              <Tooltip label="Actualiser">
                <ActionIcon
                  variant="light"
                  onClick={refreshData}
                  loading={loading}
                >
                  <RefreshCw size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Group gap="xs">
              <Clock size={16} />
              <Text size="sm" fw={500}>
                {getTimeRemaining()}
              </Text>
            </Group>
          </Group>
        </Card>

        {/* Current Status */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">Enchère actuelle</Text>
            <Badge color="green" variant="light">
              {bids.length} enchère(s)
            </Badge>
          </Group>
          <Group justify="space-between">
            <Text size="xl" fw={700} c="blue">
              {new Intl.NumberFormat('fr-FR').format(currentBid)} MAD
            </Text>
            <Text size="sm" c="dimmed">
              Incrément: {increment} MAD
            </Text>
          </Group>
        </Card>

        {/* Auto-bids Section */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <Zap size={16} />
              <Text fw={500}>Enchères automatiques</Text>
            </Group>
            <Badge color="orange" variant="light">
              {autoBids.filter(ab => ab.isActive).length} active(s)
            </Badge>
          </Group>
          
          <Stack gap="xs">
            {autoBids.map((autoBid) => (
              <Group key={autoBid.id} justify="space-between" p="xs" style={{ 
                backgroundColor: autoBid.isActive ? '#e7f5ff' : '#f8f9fa',
                borderRadius: 6,
                border: autoBid.isActive ? '1px solid #339af0' : '1px solid #dee2e6'
              }}>
                <div>
                  <Text size="sm" fw={500}>{autoBid.bidderName}</Text>
                  <Text size="xs" c="dimmed">
                    Max: {new Intl.NumberFormat('fr-FR').format(autoBid.maxAmount)} MAD
                  </Text>
                </div>
                <Badge 
                  color={autoBid.isActive ? 'blue' : 'gray'} 
                  variant="light"
                  size="sm"
                >
                  {autoBid.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </Group>
            ))}
          </Stack>
        </Card>

        {/* Bid History */}
        <Card shadow="sm" padding="md" radius="md" withBorder style={{ flex: 1 }}>
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <TrendingUp size={16} />
              <Text fw={500}>Historique des enchères</Text>
            </Group>
            <Text size="sm" c="dimmed">
              {bids.length} enchère(s)
            </Text>
          </Group>

          <ScrollArea style={{ height: 400 }}>
            <Timeline active={-1} bulletSize={24} lineWidth={2}>
              {bids.map((bid, index) => (
                <Timeline.Item
                  key={bid.id}
                  bullet={
                    <Avatar
                      src={bid.bidderAvatar}
                      size={20}
                      radius="xl"
                    >
                      {bid.bidderName.charAt(0)}
                    </Avatar>
                  }
                  title={
                    <Group gap="xs">
                      <Text size="sm" fw={500}>
                        {bid.bidderName}
                      </Text>
                      {bid.isWinning && (
                        <Badge color="green" size="xs">
                          Gagnant
                        </Badge>
                      )}
                      {bid.isAutomatic && (
                        <Badge color="blue" size="xs">
                          Auto
                        </Badge>
                      )}
                    </Group>
                  }
                >
                  <Group justify="space-between">
                    <Text size="lg" fw={600} c={bid.isWinning ? 'green' : undefined}>
                      {new Intl.NumberFormat('fr-FR').format(bid.amount)} MAD
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatTimeAgo(bid.timestamp)}
                    </Text>
                  </Group>
                  {bid.maxBid && (
                    <Text size="xs" c="dimmed">
                      Enchère max: {new Intl.NumberFormat('fr-FR').format(bid.maxBid)} MAD
                    </Text>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          </ScrollArea>
        </Card>

        {/* Statistics */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Text fw={500} mb="md">Statistiques</Text>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed">Enchérisseurs uniques</Text>
              <Text fw={600}>{new Set(bids.map(b => b.bidderId)).size}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Enchère moyenne</Text>
              <Text fw={600}>
                {bids.length > 0 
                  ? new Intl.NumberFormat('fr-FR').format(Math.round(bids.reduce((sum, b) => sum + b.amount, 0) / bids.length))
                  : 0
                } MAD
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Augmentation</Text>
              <Text fw={600} c="green">
                +{bids.length > 0 ? ((currentBid / (bids[bids.length - 1]?.amount || currentBid) - 1) * 100).toFixed(1) : 0}%
              </Text>
            </div>
          </Group>
        </Card>
      </Stack>
    </Drawer>
  );
}