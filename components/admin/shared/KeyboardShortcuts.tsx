'use client';

import { useRouter } from 'next/navigation';
import { useHotkeys } from '@mantine/hooks';

interface KeyboardShortcutsProps {
  onShowHelp?: () => void;
}

export function KeyboardShortcuts({ onShowHelp }: KeyboardShortcutsProps) {
  const router = useRouter();

  // Global shortcuts
  useHotkeys([
    ['mod+/', () => onShowHelp?.()],
    ['mod+H', () => router.push('/admin-dashboard')],
    ['G+D', () => router.push('/admin-dashboard')],
    ['G+U', () => router.push('/admin-dashboard/users')],
    ['G+P', () => router.push('/admin-dashboard/products')],
    ['G+A', () => router.push('/admin-dashboard/auctions')],
    ['G+O', () => router.push('/admin-dashboard/orders')],
    ['G+S', () => router.push('/admin-dashboard/stores')],
  ]);

  return null;
}
