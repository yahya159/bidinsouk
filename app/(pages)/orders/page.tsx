'use client'

import { Container, Title, Text, Stack, Loader, Alert, Paper, Table, Badge } from '@mantine/core'
import { useEffect, useState } from 'react'

interface Order {
  id: number
  number: string
  total: number
  status: string
  fulfillStatus: string
  createdAt: string
  store: {
    name: string
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/orders')
        const data = await response.json()
        
        if (response.ok) {
          setOrders(data)
        } else {
          setError(data.error || 'Erreur lors du chargement des commandes')
        }
      } catch (err) {
        setError('Erreur de connexion au serveur')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'green'
      case 'REFUSED': return 'red'
      case 'CANCELED_AFTER_CONFIRM': return 'gray'
      default: return 'blue'
    }
  }

  const getFulfillStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'yellow'
      case 'PREPARING': return 'blue'
      case 'READY_FOR_PICKUP': return 'indigo'
      case 'SHIPPED': return 'cyan'
      case 'DELIVERED': return 'green'
      case 'CANCELED': return 'red'
      default: return 'gray'
    }
  }

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" style={{ height: '400px' }}>
          <Loader size="xl" />
          <Text>Chargement des commandes...</Text>
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert title="Erreur" color="red">
          {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="md" mb="md">
        <Title order={1}>Mes commandes</Title>
        <Text c="dimmed">Historique de toutes vos commandes</Text>
      </Stack>

      {orders.length === 0 ? (
        <Alert title="Aucune commande trouvée" color="blue">
          Vous n'avez pas encore passé de commande.
        </Alert>
      ) : (
        <Paper shadow="sm" p="md">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Numéro</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Boutique</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Statut</Table.Th>
                <Table.Th>Expédition</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {orders.map((order) => (
                <Table.Tr key={order.id}>
                  <Table.Td>{order.number}</Table.Td>
                  <Table.Td>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</Table.Td>
                  <Table.Td>{order.store.name}</Table.Td>
                  <Table.Td>{order.total.toFixed(2)} MAD</Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getFulfillStatusColor(order.fulfillStatus)}>
                      {order.fulfillStatus}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Container>
  )
}