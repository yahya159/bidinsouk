'use client'

import { Container, Title, Text, Button, Center, Stack } from '@mantine/core'
import { useRouter } from 'next/navigation'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export default function NotFoundPage() {
  const router = useRouter()
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Center style={{ minHeight: 'calc(100vh - 200px)', padding: '1rem' }}>
          <Container size="sm" style={{ textAlign: 'center' }}>
            <Stack gap="xl">
              <Title order={1} style={{ fontSize: '6rem', fontWeight: 900, color: '#1c7ed6' }}>
                404
              </Title>
              
              <div>
                <Title order={2} mb="sm">Page non trouvée</Title>
                <Text size="lg" c="dimmed">
                  Désolé, la page que vous recherchez est introuvable.
                </Text>
              </div>
              
              <div>
                <Button 
                  size="lg" 
                  onClick={() => router.push('/')}
                >
                  Retour à l'accueil
                </Button>
              </div>
            </Stack>
          </Container>
        </Center>
      </main>
      <Footer />
    </div>
  )
}
