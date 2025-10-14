'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from '@mantine/form'
import { 
  Container, 
  Title, 
  Text, 
  TextInput, 
  PasswordInput, 
  Checkbox, 
  Button, 
  Anchor, 
  Group, 
  Divider,
  Card,
  Stack,
  Center,
  Alert
} from '@mantine/core'
import { IconAlertCircle, IconBrandGoogle, IconBrandFacebook } from '@tabler/icons-react'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
    },
  })
  
  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })
      
      if (result?.error) {
        setError('Invalid email or password')
      } else {
        // Rediriger l'administrateur directement vers le dashboard admin
        router.push('/workspace/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSocialLogin = (provider: string) => {
    setLoading(true)
    signIn(provider, { callbackUrl: '/workspace/dashboard' })
  }
  
  return (
    <Center style={{ minHeight: '100vh', padding: '1rem' }}>
      <Container size="xs">
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Stack gap="lg">
            <div style={{ textAlign: 'center' }}>
              <Title order={1} mb="xs">Login</Title>
              <Text c="dimmed">Welcome back! Please login to your account</Text>
            </div>
            
            {error && (
              <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                {error}
              </Alert>
            )}
            
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  placeholder="your@email.com"
                  type="email"
                  required
                  {...form.getInputProps('email')}
                />
                
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  required
                  {...form.getInputProps('password')}
                />
                
                <Group justify="space-between">
                  <Checkbox 
                    label="Remember me" 
                    {...form.getInputProps('rememberMe', { type: 'checkbox' })}
                  />
                  <Anchor href="/forgot-password" size="sm">
                    Forgot password?
                  </Anchor>
                </Group>
                
                <Button 
                  type="submit" 
                  fullWidth 
                  loading={loading}
                  disabled={loading}
                >
                  Login
                </Button>
              </Stack>
            </form>
            
            <Divider label="or continue with" labelPosition="center" />
            
            <Group grow>
              <Button
                variant="default"
                leftSection={<IconBrandGoogle size={16} />}
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
              >
                Google
              </Button>
              <Button
                variant="default"
                leftSection={<IconBrandFacebook size={16} />}
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
              >
                Facebook
              </Button>
            </Group>
            
            <Text ta="center" size="sm">
              Don't have an account?{' '}
              <Anchor href="/register">Register</Anchor>
            </Text>
          </Stack>
        </Card>
      </Container>
    </Center>
  )
}