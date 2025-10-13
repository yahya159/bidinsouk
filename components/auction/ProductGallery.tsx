'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { ActionIcon } from '@mantine/core';

interface ProductGalleryProps {
  images: { url: string; alt: string }[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images.length) return null;

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden group">
        <Image
          src={images[selectedIndex].url}
          alt={images[selectedIndex].alt}
          fill
          className={`object-cover transition-transform duration-300 ${
            isZoomed ? 'scale-150' : 'scale-100'
          }`}
          priority
        />
        
        {/* Zoom Button */}
        <ActionIcon
          variant="light"
          size="lg"
          style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0 }}
          className="group-hover:opacity-100 transition-opacity"
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <ZoomIn size={16} />
        </ActionIcon>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <ActionIcon
              variant="light"
              size="lg"
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0 }}
              className="group-hover:opacity-100 transition-opacity"
              onClick={prevImage}
            >
              <ChevronLeft size={16} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              size="lg"
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0 }}
              className="group-hover:opacity-100 transition-opacity"
              onClick={nextImage}
            >
              <ChevronRight size={16} />
            </ActionIcon>
          </>
        )}
      </div>

      {/* Thumbnail Rail */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                index === selectedIndex
                  ? 'border-amber-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}