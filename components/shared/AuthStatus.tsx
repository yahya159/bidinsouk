'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button, Group, Text, Loader } from '@mantine/core'
import Link from 'next/link'

export function AuthStatus() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <Loader size="sm" />
  }

  if (status === 'unauthenticated') {
    return (
      <Group gap="xs">
        <Button component={Link} href="/login" variant="outline" size="sm">
          Login
        </Button>
        <Button component={Link} href="/register" size="sm">
          Register
        </Button>
      </Group>
    )
  }

  return (
    <Group gap="md">
      <div>
        <Text size="sm" fw={500}>{session?.user?.name}</Text>
        <Text size="xs" c="dimmed">{session?.user?.role}</Text>
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => signOut({ callbackUrl: '/login' })}
      >
        Sign Out
      </Button>
    </Group>
  )
}
