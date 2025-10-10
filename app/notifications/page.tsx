'use client'

import { Container, Title, Text, Stack, Loader, Alert, Paper, Group, Button, Badge } from '@mantine/core'
import { useEffect, useState } from 'react'
import { IconBell, IconCheck, IconX } from '@tabler/icons-react'

interface Notification {
  id: number
  title: string
  body: string
  type: string
  readAt: string | null
  createdAt: string
  payload: any
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/notifications')
        const data = await response.json()
        
        if (response.ok) {
          setNotifications(data.notifications || [])
        } else {
          setError(data.error || 'Erreur lors du chargement des notifications')
        }
      } catch (err) {
        setError('Erreur de connexion au serveur')
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      
      if (response.ok) {
        setNotifications(notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, readAt: new Date().toISOString() } 
            : notification
        ))
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
      })
      
      if (response.ok) {
        setNotifications(notifications.map(notification => 
          notification.readAt ? notification : { ...notification, readAt: new Date().toISOString() }
        ))
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ORDER': return 'blue'
      case 'AUCTION': return 'orange'
      case 'MESSAGE': return 'green'
      case 'SYSTEM': return 'gray'
      default: return 'gray'
    }
  }

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" style={{ height: '400px' }}>
          <Loader size="xl" />
          <Text>Chargement des notifications...</Text>
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

  const unreadCount = notifications.filter(n => !n.readAt).length

  return (
    <Container size="xl" py="xl">
      <Stack gap="md" mb="md">
        <Group justify="space-between">
          <div>
            <Title order={1}>Notifications</Title>
            <Text c="dimmed">
              {unreadCount > 0 
                ? `${unreadCount} notification(s) non lue(s)` 
                : 'Aucune notification non lue'}
            </Text>
          </div>
          {unreadCount > 0 && (
            <Button 
              leftSection={<IconCheck size={16} />} 
              onClick={markAllAsRead}
            >
              Tout marquer comme lu
            </Button>
          )}
        </Group>
      </Stack>

      {notifications.length === 0 ? (
        <Alert title="Aucune notification" color="blue">
          Vous n'avez aucune notification pour le moment.
        </Alert>
      ) : (
        <Stack gap="sm">
          {notifications.map((notification) => (
            <Paper 
              key={notification.id} 
              shadow="sm" 
              p="md" 
              radius="md"
              style={{ 
                borderLeft: notification.readAt ? 'none' : '4px solid #1c7ed6',
                backgroundColor: notification.readAt ? 'white' : '#f1f3f5'
              }}
            >
              <Group justify="space-between">
                <div>
                  <Group gap="xs" mb="xs">
                    <Badge color={getTypeColor(notification.type)}>
                      {notification.type}
                    </Badge>
                    {!notification.readAt && (
                      <Badge color="blue" size="xs">
                        Nouveau
                      </Badge>
                    )}
                  </Group>
                  <Title order={3} size="h4">{notification.title}</Title>
                  <Text>{notification.body}</Text>
                  <Text size="sm" c="dimmed" mt="xs">
                    {new Date(notification.createdAt).toLocaleString('fr-FR')}
                  </Text>
                </div>
                {!notification.readAt && (
                  <Button 
                    variant="light" 
                    size="xs" 
                    onClick={() => markAsRead(notification.id)}
                  >
                    Marquer comme lu
                  </Button>
                )}
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Container>
  )
}