'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function AuthStatus() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="text-sm text-gray-500">Loading...</div>
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex gap-2">
        <Link href="/login">
          <Button variant="outline" size="sm">Login</Button>
        </Link>
        <Link href="/register">
          <Button size="sm">Register</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">
        <div className="font-medium">{session?.user?.name}</div>
        <div className="text-xs text-gray-500">{session?.user?.role}</div>
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => signOut({ callbackUrl: '/login' })}
      >
        Sign Out
      </Button>
    </div>
  )
}
