'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button, TextInput, Card, Title, Text, Stack, Alert, Anchor, Center } from '@mantine/core'
import { useRouter } from 'next/navigation'
import { IconAlertCircle } from '@tabler/icons-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // Redirect to home page after successful login
      router.push('/')
      router.refresh()
    } catch (err) {
      setError('Failed to log in. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Center style={{ minHeight: '100vh', padding: '1rem' }}>
      <Card shadow="sm" padding="xl" radius="md" withBorder style={{ width: '100%', maxWidth: '28rem' }}>
        <Stack gap="lg">
          <div>
            <Title order={2}>Login</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Enter your credentials to access your account
            </Text>
          </div>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {error && (
                <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                  {error}
                </Alert>
              )}

              <TextInput
                type="email"
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />

              <TextInput
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />

              <Button type="submit" fullWidth loading={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </Stack>
          </form>

          <Text size="sm" ta="center">
            Don't have an account?{' '}
            <Anchor href="/register" size="sm">
              Register
            </Anchor>
          </Text>
        </Stack>
      </Card>
    </Center>
  )
}