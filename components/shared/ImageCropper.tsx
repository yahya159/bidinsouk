'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Text,
  ActionIcon,
  FileInput,
  SegmentedControl,
  Slider,
} from '@mantine/core';
import {
  Upload,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import Cropper from 'react-cropper';

interface ImageCropperProps {
  opened: boolean;
  onClose: () => void;
  onCrop: (croppedImage: string) => void;
  aspectRatio?: number;
  title?: string;
}

const aspectRatios = [
  { label: '4:3', value: 4/3 },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16/9 },
  { label: 'Libre', value: NaN },
];

export function ImageCropper({ 
  opened, 
  onClose, 
  onCrop, 
  aspectRatio = 1, 
  title = "Recadrer l'image" 
}: ImageCropperProps) {
  const [image, setImage] = useState<string>('');
  const [currentAspectRatio, setCurrentAspectRatio] = useState<number>(aspectRatio);
  const [zoom, setZoom] = useState<number>(0);
  const cropperRef = useRef<HTMLImageElement>(null);

  const handleFileChange = useCallback((file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const getCropper = () => {
    const imageElement = cropperRef?.current;
    // @ts-ignore
    const cropper = imageElement?.cropper;
    return cropper;
  };

  const handleRotateLeft = () => {
    const cropper = getCropper();
    if (cropper) {
      cropper.rotate(-90);
    }
  };

  const handleRotateRight = () => {
    const cropper = getCropper();
    if (cropper) {
      cropper.rotate(90);
    }
  };

  const handleZoomChange = (value: number) => {
    setZoom(value);
    const cropper = getCropper();
    if (cropper) {
      cropper.zoomTo(value / 100);
    }
  };

  const handleReset = () => {
    const cropper = getCropper();
    if (cropper) {
      cropper.reset();
      setZoom(0);
    }
  };

  const handleCrop = () => {
    const cropper = getCropper();
    if (cropper) {
      const canvas = cropper.getCroppedCanvas({
        width: 800,
        height: 800 / currentAspectRatio,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
      
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            onCrop(reader.result as string);
            handleClose();
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleClose = () => {
    setImage('');
    setZoom(0);
    onClose();
  };

  const handleAspectRatioChange = (value: string) => {
    const ratio = aspectRatios.find(r => r.label === value)?.value || NaN;
    setCurrentAspectRatio(ratio);
    
    const cropper = getCropper();
    if (cropper) {
      cropper.setAspectRatio(ratio);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      size="xl"
      centered
    >
      <Stack gap="md">
        {!image ? (
          <Stack align="center" gap="md" py="xl">
            <Text size="lg" fw={500}>Choisir une image</Text>
            <FileInput
              placeholder="Browse..."
              accept="image/*"
              onChange={handleFileChange}
              leftSection={<Upload size={16} />}
              size="lg"
              style={{ width: '100%', maxWidth: 300 }}
            />
          </Stack>
        ) : (
          <>
            {/* Cropper */}
            <div style={{ 
              width: '100%', 
              height: 400, 
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: 8,
              overflow: 'hidden'
            }}>
              <Cropper
                ref={cropperRef}
                src={image}
                style={{ height: 400, width: '100%' }}
                aspectRatio={currentAspectRatio}
                guides={true}
                background={false}
                responsive={true}
                autoCropArea={1}
                checkOrientation={false}
                viewMode={1}
                dragMode="move"
                cropBoxMovable={true}
                cropBoxResizable={true}
                toggleDragModeOnDblclick={false}
              />
            </div>

            {/* Controls */}
            <Group justify="center" gap="xs">
              {/* Aspect Ratio */}
              <SegmentedControl
                data={aspectRatios.map(r => ({ label: r.label, value: r.label }))}
                value={aspectRatios.find(r => r.value === currentAspectRatio)?.label || 'Libre'}
                onChange={handleAspectRatioChange}
                size="sm"
              />

              {/* Rotation */}
              <ActionIcon
                variant="light"
                onClick={handleRotateLeft}
                title="Rotation 90° gauche"
              >
                <RotateCcw size={16} />
              </ActionIcon>

              <ActionIcon
                variant="light"
                onClick={handleRotateRight}
                title="Rotation 90° droite"
              >
                <RotateCw size={16} />
              </ActionIcon>

              {/* Reset */}
              <ActionIcon
                variant="light"
                onClick={handleReset}
                title="Réinitialiser"
              >
                <RefreshCw size={16} />
              </ActionIcon>
            </Group>

            {/* Zoom */}
            <Group gap="md">
              <ZoomOut size={16} />
              <Slider
                value={zoom}
                onChange={handleZoomChange}
                min={-100}
                max={200}
                step={10}
                style={{ flex: 1 }}
                marks={[
                  { value: -100, label: 'Zoom-' },
                  { value: 0, label: '100%' },
                  { value: 200, label: 'Zoom+' },
                ]}
              />
              <ZoomIn size={16} />
            </Group>

            {/* Actions */}
            <Group justify="flex-end" gap="sm">
              <Button
                variant="outline"
                leftSection={<X size={16} />}
                onClick={handleClose}
              >
                Annuler
              </Button>
              <Button
                leftSection={<Check size={16} />}
                onClick={handleCrop}
                color="green"
              >
                Utiliser l'image recadrée
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}