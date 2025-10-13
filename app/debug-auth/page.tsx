'use client'

import { useEffect, useState } from 'react'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'

export default function DebugAuthPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // This won't work in a client component, but let's try to get session info
        const response = await fetch('/api/debug-session')
        const data = await response.json()
        setSessionInfo(data)
      } catch (error) {
        console.error('Error fetching session:', error)
        setSessionInfo({ error: error.message })
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Debug Authentication</h1>
      <pre>{JSON.stringify(sessionInfo, null, 2)}</pre>
    </div>
  )
}