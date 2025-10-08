/**
 * This hook has been replaced by Mantine's notifications system.
 * Use `import { notifications } from '@mantine/notifications'` instead.
 * 
 * Example:
 * notifications.show({
 *   title: 'Success',
 *   message: 'Your action was successful',
 *   color: 'green',
 * })
 */

import { notifications } from '@mantine/notifications'

export function useToast() {
  return {
    toast: (options: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => {
      notifications.show({
        title: options.title || '',
        message: options.description || '',
        color: options.variant === 'destructive' ? 'red' : 'blue',
      })
    },
  }
}

export const toast = (options: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => {
  notifications.show({
    title: options.title || '',
    message: options.description || '',
    color: options.variant === 'destructive' ? 'red' : 'blue',
  })
}