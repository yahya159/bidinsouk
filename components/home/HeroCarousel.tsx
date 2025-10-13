'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Title,
  Text,
  Button,
  Group,
  ActionIcon,
  Indicator,
} from '@mantine/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { mockHeroSlides } from '@/lib/homeData';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function HeroCarousel() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mockHeroSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + mockHeroSlides.length) % mockHeroSlides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % mockHeroSlides.length);
  };

  const handleSlideClick = (index: number) => {
    setCurrentSlide(index);
  };

  const handleCTAClick = () => {
    const slide = mockHeroSlides[currentSlide];
    router.push(slide.link);
  };

  return (
    <Box
      style={{
        position: 'relative',
        height: 500,
        overflow: 'hidden',
        borderRadius: 0,
      }}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Images */}
      {mockHeroSlides.map((slide, index) => (
        <Box
          key={slide.id}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: index === currentSlide ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
          }}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            style={{ objectFit: 'cover' }}
            priority={index === 0}
            sizes="100vw"
          />
          {/* Dark gradient overlay */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%)',
            }}
          />
        </Box>
      ))}

      {/* Content */}
      <Container size="xl" style={{ position: 'relative', height: '100%', zIndex: 2 }}>
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            maxWidth: 600,
          }}
        >
          <Box>
            <Title
              order={1}
              size="3.5rem"
              fw={700}
              c="white"
              mb="md"
              style={{
                lineHeight: 1.1,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {mockHeroSlides[currentSlide].title}
            </Title>
            <Text
              size="xl"
              c="white"
              mb="xl"
              style={{
                opacity: 0.9,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {mockHeroSlides[currentSlide].subtitle}
            </Text>
            <Button
              size="xl"
              radius="md"
              gradient={{ from: 'orange', to: 'red' }}
              onClick={handleCTAClick}
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                padding: '16px 32px',
                boxShadow: '0 4px 16px rgba(255, 107, 0, 0.4)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(255, 107, 0, 0.5)',
                },
              }}
            >
              {mockHeroSlides[currentSlide].cta}
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Navigation Arrows */}
      <ActionIcon
        variant="filled"
        color="white"
        size="xl"
        radius="xl"
        onClick={handlePrevious}
        style={{
          position: 'absolute',
          left: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 3,
          backgroundColor: 'rgba(255,255,255,0.9)',
          color: '#333',
          '&:hover': {
            backgroundColor: 'white',
          },
        }}
      >
        <ChevronLeft size={24} />
      </ActionIcon>

      <ActionIcon
        variant="filled"
        color="white"
        size="xl"
        radius="xl"
        onClick={handleNext}
        style={{
          position: 'absolute',
          right: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 3,
          backgroundColor: 'rgba(255,255,255,0.9)',
          color: '#333',
          '&:hover': {
            backgroundColor: 'white',
          },
        }}
      >
        <ChevronRight size={24} />
      </ActionIcon>

      {/* Dots Indicator */}
      <Group
        justify="center"
        gap="xs"
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
        }}
      >
        {mockHeroSlides.map((_, index) => (
          <Indicator
            key={index}
            size={12}
            color={index === currentSlide ? 'orange' : 'gray'}
            style={{
              cursor: 'pointer',
              opacity: index === currentSlide ? 1 : 0.6,
              transition: 'all 0.2s ease',
            }}
            onClick={() => handleSlideClick(index)}
          />
        ))}
      </Group>
    </Box>
  );
}