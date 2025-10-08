'use client'

import { useState } from 'react'
import { Button, TextInput, Card, Title, Text, Stack, Alert, Anchor, Center } from '@mantine/core'
import { useRouter } from 'next/navigation'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          locale: 'fr'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to register')
      setLoading(false)
    }
  }

  return (
    <Center style={{ minHeight: '100vh', padding: '1rem' }}>
      <Card shadow="sm" padding="xl" radius="md" withBorder style={{ width: '100%', maxWidth: '28rem' }}>
        <Stack gap="lg">
          <div>
            <Title order={2}>Register</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Create a new account
            </Text>
          </div>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {error && (
                <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert icon={<IconCheck size={16} />} title="Success" color="green">
                  Account created successfully! Redirecting to login...
                </Alert>
              )}

              <TextInput
                type="text"
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading || success}
              />

              <TextInput
                type="email"
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
              />

              <TextInput
                type="password"
                label="Password"
                placeholder="Min 4 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || success}
              />

              <TextInput
                type="password"
                label="Confirm Password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || success}
              />

              <Button type="submit" fullWidth loading={loading} disabled={success}>
                {loading ? 'Creating Account...' : success ? 'Success!' : 'Register'}
              </Button>
            </Stack>
          </form>

          <Text size="sm" ta="center">
            Already have an account?{' '}
            <Anchor href="/login" size="sm">
              Login
            </Anchor>
          </Text>
        </Stack>
      </Card>
    </Center>
  )
}