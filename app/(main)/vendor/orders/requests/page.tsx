'use client'

import { useEffect, useState } from 'react'
import {
  Container,
  Title,
  Stack,
  Loader,
  Center,
  Text,
  Tabs
} from '@mantine/core'
import { OrderRequestCard } from '@/components/orders/OrderRequestCard'

export default function VendorOrderRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string | null>('requested')

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const response = await fetch('/api/vendor/orders/requests')
      if (!response.ok) throw new Error('Failed to load requests')
      
      const { requests } = await response.json()
      setRequests(requests)
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    )
  }

  const requestedOrders = requests.filter(r => r.status === 'REQUESTED')
  const acceptedOrders = requests.filter(r => r.status === 'ACCEPTED')
  const refusedOrders = requests.filter(r => r.status === 'REFUSED')

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">Order Requests</Title>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="requested">
            Pending ({requestedOrders.length})
          </Tabs.Tab>
          <Tabs.Tab value="accepted">
            Accepted ({acceptedOrders.length})
          </Tabs.Tab>
          <Tabs.Tab value="refused">
            Declined ({refusedOrders.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="requested" pt="md">
          <Stack gap="md">
            {requestedOrders.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No pending order requests
              </Text>
            ) : (
              requestedOrders.map(request => (
                <OrderRequestCard
                  key={request.id}
                  request={request}
                  onUpdate={loadRequests}
                />
              ))
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="accepted" pt="md">
          <Stack gap="md">
            {acceptedOrders.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No accepted order requests
              </Text>
            ) : (
              acceptedOrders.map(request => (
                <OrderRequestCard
                  key={request.id}
                  request={request}
                  onUpdate={loadRequests}
                />
              ))
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="refused" pt="md">
          <Stack gap="md">
            {refusedOrders.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No declined order requests
              </Text>
            ) : (
              refusedOrders.map(request => (
                <OrderRequestCard
                  key={request.id}
                  request={request}
                  onUpdate={loadRequests}
                />
              ))
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}
