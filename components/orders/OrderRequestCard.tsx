'use client'

import { useState } from 'react'
import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  Stack,
  Image,
  Modal,
  Textarea
} from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

interface OrderRequestCardProps {
  request: {
    id: string
    quantity: number
    paymentMethod: string
    status: string
    createdAt: string
    deliveryAddress: any
    notes?: string
    product: {
      title: string
      images: string[]
      price: number
    }
    user: {
      name: string
      email: string
    }
  }
  onUpdate?: () => void
}

export function OrderRequestCard({ request, onUpdate }: OrderRequestCardProps) {
  const [loading, setLoading] = useState(false)
  const [refuseModalOpen, setRefuseModalOpen] = useState(false)
  const [refuseReason, setRefuseReason] = useState('')

  const handleAccept = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/requests/${request.id}/accept`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to accept request')

      notifications.show({
        title: 'Success',
        message: 'Order request accepted',
        color: 'green'
      })

      onUpdate?.()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to accept order request',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefuse = async () => {
    if (!refuseReason.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please provide a reason',
        color: 'red'
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/orders/requests/${request.id}/refuse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refuseReason })
      })

      if (!response.ok) throw new Error('Failed to refuse request')

      notifications.show({
        title: 'Success',
        message: 'Order request declined',
        color: 'green'
      })

      setRefuseModalOpen(false)
      onUpdate?.()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to refuse order request',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const statusColor = {
    REQUESTED: 'yellow',
    ACCEPTED: 'green',
    REFUSED: 'red',
    CANCELLED: 'gray'
  }[request.status] || 'gray'

  const total = request.product.price * request.quantity

  return (
    <>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group>
            <Image
              src={request.product.images[0]}
              alt={request.product.title}
              width={80}
              height={80}
              radius="md"
            />
            <Stack gap={4} style={{ flex: 1 }}>
              <Text fw={500}>{request.product.title}</Text>
              <Text size="sm" c="dimmed">
                Quantity: {request.quantity} × {request.product.price} MAD = {total} MAD
              </Text>
              <Badge color={statusColor} size="sm">
                {request.status}
              </Badge>
            </Stack>
          </Group>

          <Stack gap={4}>
            <Text size="sm" fw={500}>Customer</Text>
            <Text size="sm">{request.user.name}</Text>
            <Text size="sm" c="dimmed">{request.user.email}</Text>
          </Stack>

          <Stack gap={4}>
            <Text size="sm" fw={500}>Payment Method</Text>
            <Text size="sm" tt="capitalize">{request.paymentMethod.replace('_', ' ')}</Text>
          </Stack>

          <Stack gap={4}>
            <Text size="sm" fw={500}>Delivery Address</Text>
            <Text size="sm">
              {request.deliveryAddress.street}, {request.deliveryAddress.city}
              {request.deliveryAddress.state && `, ${request.deliveryAddress.state}`}
              <br />
              {request.deliveryAddress.zipCode}, {request.deliveryAddress.country}
              <br />
              Phone: {request.deliveryAddress.phone}
            </Text>
          </Stack>

          {request.notes && (
            <Stack gap={4}>
              <Text size="sm" fw={500}>Notes</Text>
              <Text size="sm">{request.notes}</Text>
            </Stack>
          )}

          {request.status === 'REQUESTED' && (
            <Group grow>
              <Button
                leftSection={<IconCheck size={18} />}
                onClick={handleAccept}
                loading={loading}
                color="green"
              >
                Accept
              </Button>
              <Button
                leftSection={<IconX size={18} />}
                onClick={() => setRefuseModalOpen(true)}
                loading={loading}
                color="red"
                variant="light"
              >
                Decline
              </Button>
            </Group>
          )}
        </Stack>
      </Card>

      <Modal
        opened={refuseModalOpen}
        onClose={() => setRefuseModalOpen(false)}
        title="Decline Order Request"
      >
        <Stack gap="md">
          <Text size="sm">
            Please provide a reason for declining this order request:
          </Text>
          <Textarea
            placeholder="e.g., Out of stock, Cannot deliver to this location..."
            value={refuseReason}
            onChange={(e) => setRefuseReason(e.target.value)}
            minRows={3}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setRefuseModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleRefuse} loading={loading}>
              Decline Request
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
