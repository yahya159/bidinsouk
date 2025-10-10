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

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  
  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
    
    validate: {
      name: (value) => (value.length > 0 ? null : 'Name is required'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => {
        if (value.length < 8) return 'Password must be at least 8 characters'
        if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter'
        if (!/[a-z]/.test(value)) return 'Password must contain lowercase letter'
        if (!/[0-9]/.test(value)) return 'Password must contain number'
        if (!/[^A-Za-z0-9]/.test(value)) return 'Password must contain special character'
        return null
      },
      confirmPassword: (value, values) => 
        value !== values.password ? 'Passwords do not match' : null,
      terms: (value) => (value ? null : 'You must accept the terms and conditions'),
    },
  })
  
  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }
      
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSocialLogin = (provider: string) => {
    setLoading(true)
    // For registration, we'll redirect to the provider's signup page
    // This would typically be handled by NextAuth
  }
  
  return (
    <Center style={{ minHeight: '100vh', padding: '1rem' }}>
      <Container size="xs">
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Stack gap="lg">
            <div style={{ textAlign: 'center' }}>
              <Title order={1} mb="xs">Register</Title>
              <Text c="dimmed">Create a new account</Text>
            </div>
            
            {error && (
              <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert icon={<IconAlertCircle size={16} />} title="Success" color="green">
                Account created successfully! Redirecting to login...
              </Alert>
            )}
            
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Full Name"
                  placeholder="Your full name"
                  required
                  {...form.getInputProps('name')}
                  disabled={loading || success}
                />
                
                <TextInput
                  label="Email"
                  placeholder="your@email.com"
                  type="email"
                  required
                  {...form.getInputProps('email')}
                  disabled={loading || success}
                />
                
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  required
                  {...form.getInputProps('password')}
                  disabled={loading || success}
                />
                
                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  required
                  {...form.getInputProps('confirmPassword')}
                  disabled={loading || success}
                />
                
                <Checkbox 
                  label={
                    <Text size="sm">
                      I agree to the{' '}
                      <Anchor href="/terms" target="_blank">Terms and Conditions</Anchor>
                    </Text>
                  }
                  {...form.getInputProps('terms', { type: 'checkbox' })}
                  disabled={loading || success}
                />
                
                <Button 
                  type="submit" 
                  fullWidth 
                  loading={loading}
                  disabled={loading || success}
                >
                  Register
                </Button>
              </Stack>
            </form>
            
            <Divider label="or continue with" labelPosition="center" />
            
            <Group grow>
              <Button
                variant="default"
                leftSection={<IconBrandGoogle size={16} />}
                onClick={() => handleSocialLogin('google')}
                disabled={loading || success}
              >
                Google
              </Button>
              <Button
                variant="default"
                leftSection={<IconBrandFacebook size={16} />}
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading || success}
              >
                Facebook
              </Button>
            </Group>
            
            <Text ta="center" size="sm">
              Already have an account?{' '}
              <Anchor href="/login">Login</Anchor>
            </Text>
          </Stack>
        </Card>
      </Container>
    </Center>
  )
}