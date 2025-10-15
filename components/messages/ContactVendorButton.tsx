'use client'

import { useState } from 'react'
import { Button } from '@mantine/core'
import { IconMessage } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'

interface ContactVendorButtonProps {
  productId: string
  vendorId: string
  disabled?: boolean
}

export function ContactVendorButton({ 
  productId, 
  vendorId,
  disabled 
}: ContactVendorButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleContact = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, vendorId })
      })

      if (!response.ok) {
        throw new Error('Failed to create thread')
      }

      const { thread } = await response.json()
      router.push(`/messages/${thread.id}`)
    } catch (error) {
      console.error('Error:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to start conversation',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      leftSection={<IconMessage size={18} />}
      onClick={handleContact}
      loading={loading}
      disabled={disabled}
      variant="light"
      fullWidth
    >
      Contact Vendor
    </Button>
  )
}
