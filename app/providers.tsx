'use client'

import { SessionProvider } from 'next-auth/react'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { theme } from '@/lib/theme'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <Notifications position="top-right" />
        {children}
      </MantineProvider>
    </SessionProvider>
  )
}

