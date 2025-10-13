'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Avatar,
  Group,
  Badge,
  Box,
  Stack,
  ActionIcon,
} from '@mantine/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { uiIcons } from '@/lib/iconMap';
import { getVerifiedReviews } from '@/lib/homeData';

export function VerifiedReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    getVerifiedReviews().then(setReviews);
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoPlaying || reviews.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, reviews.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const StarIcon = uiIcons.star;

  if (reviews.length === 0) return null;

  return (
    <Container size="lg" py={40}>
      <Box style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title order={2} size="1.8rem" fw={600} mb="sm">
          Avis vérifiés
        </Title>
        <Text c="dimmed" size="md" maw={500} mx="auto">
          Découvrez ce que nos utilisateurs pensent de Bidinsouk
        </Text>
      </Box>

      <Box
        style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Review Cards */}
        <Box style={{ overflow: 'hidden', borderRadius: 16 }}>
          <Box
            style={{
              display: 'flex',
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: 'transform 0.5s ease',
            }}
          >
            {reviews.map((review, index) => (
              <Card
                key={review.id}
                shadow="sm"
                padding="md"
                radius="md"
                withBorder
                style={{
                  minWidth: '100%',
                  minHeight: '180px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Stack gap="sm" style={{ height: '100%' }}>
                  <Group justify="space-between" align="flex-start">
                    <Group gap="sm" align="flex-start">
                      <Avatar 
                        src={review.avatar} 
                        size={40} 
                        radius="xl"
                        style={{ minWidth: 40, minHeight: 40 }}
                      />
                      <Box style={{ flex: 1 }}>
                        <Group gap="xs" mb={4} wrap="nowrap">
                          <Text fw={600} size="sm" style={{ lineHeight: 1.2 }}>
                            {review.author}
                          </Text>
                          {review.verified && (
                            <Badge
                              color="teal"
                              variant="light"
                              size="xs"
                              leftSection={<uiIcons.star size={10} />}
                            >
                              Vérifié
                            </Badge>
                          )}
                        </Group>
                        <Group gap={2}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              size={14}
                              color={i < review.rating ? '#ffd43b' : '#e9ecef'}
                              fill={i < review.rating ? '#ffd43b' : '#e9ecef'}
                            />
                          ))}
                        </Group>
                      </Box>
                    </Group>
                    <Text size="xs" c="dimmed" style={{ minWidth: 'fit-content' }}>
                      {new Date(review.date).toLocaleDateString('fr-FR')}
                    </Text>
                  </Group>

                  <Box style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Text
                      size="sm"
                      style={{
                        lineHeight: 1.4,
                        fontStyle: 'italic',
                        textAlign: 'center',
                        width: '100%',
                      }}
                    >
                      "{review.content}"
                    </Text>
                  </Box>
                </Stack>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Navigation Arrows */}
        <ActionIcon
          variant="filled"
          color="blue"
          size={36}
          radius="xl"
          onClick={handlePrevious}
          style={{
            position: 'absolute',
            left: -18,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'white',
            color: '#228be6',
            border: '1px solid #228be6',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            zIndex: 10,
          }}
        >
          <ChevronLeft size={18} />
        </ActionIcon>

        <ActionIcon
          variant="filled"
          color="blue"
          size={36}
          radius="xl"
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: -18,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'white',
            color: '#228be6',
            border: '1px solid #228be6',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            zIndex: 10,
          }}
        >
          <ChevronRight size={18} />
        </ActionIcon>

        {/* Dots Indicator */}
        <Group justify="center" gap="xs" mt="md">
          {reviews.map((_, index) => (
            <Box
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: index === currentIndex ? '#228be6' : '#e9ecef',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: index === currentIndex ? 'scale(1.1)' : 'scale(1)',
              }}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </Group>
      </Box>
    </Container>
  );
}