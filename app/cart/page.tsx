'use client'

import { Container, Title, Text, Stack, Loader, Alert, Paper, Group, Button, NumberInput } from '@mantine/core'
import { useEffect, useState } from 'react'
import { IconShoppingCart, IconTrash } from '@tabler/icons-react'

interface CartItem {
  productId: number
  offerId: number
  quantity: number
  price: number
  product?: {
    title: string
  }
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/cart')
        const data = await response.json()
        
        if (response.ok) {
          setCartItems(data.items || [])
        } else {
          setError(data.error || 'Erreur lors du chargement du panier')
        }
      } catch (err) {
        setError('Erreur de connexion au serveur')
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [])

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    try {
      // In a real implementation, you would update the quantity via API
      setCartItems(cartItems.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      ))
    } catch (err) {
      setError('Erreur lors de la mise à jour de la quantité')
    }
  }

  const removeFromCart = async (productId: number) => {
    try {
      // In a real implementation, you would remove the item via API
      setCartItems(cartItems.filter(item => item.productId !== productId))
    } catch (err) {
      setError('Erreur lors de la suppression de l\'article')
    }
  }

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" justify="center" style={{ height: '400px' }}>
          <Loader size="xl" />
          <Text>Chargement de votre panier...</Text>
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
        <Title order={1}>Mon panier</Title>
        <Text c="dimmed">
          {cartItems.length > 0 
            ? `${cartItems.length} article(s) dans votre panier` 
            : 'Votre panier est vide'}
        </Text>
      </Stack>

      {cartItems.length === 0 ? (
        <Alert title="Panier vide" color="blue">
          Vous n'avez aucun article dans votre panier.
        </Alert>
      ) : (
        <>
          <Stack gap="sm">
            {cartItems.map((item) => (
              <Paper key={item.productId} shadow="sm" p="md" radius="md">
                <Group justify="space-between">
                  <div>
                    <Title order={3} size="h4">
                      {item.product?.title || `Article #${item.productId}`}
                    </Title>
                    <Text size="sm" c="dimmed" mt="xs">
                      Prix unitaire: {item.price.toFixed(2)} MAD
                    </Text>
                  </div>
                  
                  <Group gap="md">
                    <NumberInput
                      value={item.quantity}
                      onChange={(value) => updateQuantity(item.productId, Number(value))}
                      min={1}
                      max={99}
                      w={80}
                    />
                    
                    <Text fw={500}>
                      {(item.price * item.quantity).toFixed(2)} MAD
                    </Text>
                    
                    <Button 
                      variant="light" 
                      color="red" 
                      size="xs"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <IconTrash size={16} />
                    </Button>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
          
          <Paper shadow="sm" p="md" radius="md" mt="xl">
            <Group justify="space-between">
              <Title order={2} size="h3">
                Total: {total.toFixed(2)} MAD
              </Title>
              <Button size="lg">
                Procéder au paiement
              </Button>
            </Group>
          </Paper>
        </>
      )}
    </Container>
  )
}