'use client'

import { Carousel } from '@mantine/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { useRef } from 'react'
import { Button, Container, Title, Text, Overlay, Box } from '@mantine/core'

interface SlideItem {
  imageUrl: string
  title?: string
  subtitle?: string
  ctaHref?: string
  ctaLabel?: string
}

interface ImageCarouselProps {
  items: SlideItem[]
}

export default function ImageCarousel({ items }: ImageCarouselProps) {
  const autoplay = useRef(Autoplay({ delay: 4000 }))

  return (
    <Carousel
      withIndicators
      height={360}
      loop
      plugins={[autoplay.current]}
      onMouseEnter={autoplay.current.stop}
      onMouseLeave={autoplay.current.reset}
      styles={{ indicator: { width: 8, height: 8 } }}
    >
      {items.map((item, idx) => (
        <Carousel.Slide key={idx}>
          <Box style={{ position: 'relative', height: '100%', width: '100%' }}>
            <img
              src={item.imageUrl}
              alt={item.title || `slide-${idx}`}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
            <Overlay gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.35) 40%, rgba(0,0,0,0) 100%)" opacity={0.55} />
            <Container size="xl" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', color: 'white' }}>
              {item.title && (
                <Title order={1} c="white" mb="sm">
                  {item.title}
                </Title>
              )}
              {item.subtitle && (
                <Text size="lg" mb="lg" style={{ opacity: 0.9 }}>
                  {item.subtitle}
                </Text>
              )}
              {item.ctaHref && item.ctaLabel && (
                <Button component="a" href={item.ctaHref} size="md" color="orange">
                  {item.ctaLabel}
                </Button>
              )}
            </Container>
          </Box>
        </Carousel.Slide>
      ))}
    </Carousel>
  )
}
