'use client'

import { useState } from 'react'
import {
  Modal,
  Stack,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Button,
  Group,
  Text,
  Paper
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'

interface CreateOrderRequestFormProps {
  opened: boolean
  onClose: () => void
  threadId: string
  productId: string
  productTitle: string
  productPrice: number
  onSuccess?: () => void
}

export function CreateOrderRequestForm({
  opened,
  onClose,
  threadId,
  productId,
  productTitle,
  productPrice,
  onSuccess
}: CreateOrderRequestFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: {
      quantity: 1,
      paymentMethod: 'bank',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Morocco',
      phone: '',
      notes: ''
    },
    validate: {
      quantity: (value) => value < 1 ? 'Quantity must be at least 1' : null,
      street: (value) => !value ? 'Street address is required' : null,
      city: (value) => !value ? 'City is required' : null,
      zipCode: (value) => !value ? 'Zip code is required' : null,
      phone: (value) => !value ? 'Phone number is required' : null
    }
  })

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true)

      const response = await fetch('/api/orders/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          productId,
          quantity: values.quantity,
          paymentMethod: values.paymentMethod,
          deliveryAddress: {
            street: values.street,
            city: values.city,
            state: values.state,
            zipCode: values.zipCode,
            country: values.country,
            phone: values.phone
          },
          notes: values.notes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create order request')
      }

      notifications.show({
        title: 'Success',
        message: 'Order request sent to vendor',
        color: 'green'
      })

      form.reset()
      onClose()
      onSuccess?.()
    } catch (error) {
      console.error('Error:', error)
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create order request',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = productPrice * form.values.quantity

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create Order Request"
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Paper p="sm" bg="gray.0">
            <Text size="sm" fw={500}>{productTitle}</Text>
            <Text size="sm" c="dimmed">
              Price: {productPrice} MAD × {form.values.quantity} = {totalPrice} MAD
            </Text>
          </Paper>

          <NumberInput
            label="Quantity"
            required
            min={1}
            {...form.getInputProps('quantity')}
          />

          <Select
            label="Payment Method"
            required
            data={[
              { value: 'bank', label: 'Bank Transfer' },
              { value: 'cod', label: 'Cash on Delivery' },
              { value: 'inperson', label: 'In-Person Payment' }
            ]}
            {...form.getInputProps('paymentMethod')}
          />

          <Text size="sm" fw={500} mt="md">Delivery Address</Text>

          <TextInput
            label="Street Address"
            required
            {...form.getInputProps('street')}
          />

          <Group grow>
            <TextInput
              label="City"
              required
              {...form.getInputProps('city')}
            />
            <TextInput
              label="State/Province"
              {...form.getInputProps('state')}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Zip Code"
              required
              {...form.getInputProps('zipCode')}
            />
            <TextInput
              label="Country"
              required
              {...form.getInputProps('country')}
            />
          </Group>

          <TextInput
            label="Phone Number"
            required
            {...form.getInputProps('phone')}
          />

          <Textarea
            label="Notes (Optional)"
            placeholder="Any special instructions..."
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Send Order Request
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
