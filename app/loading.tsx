import { Container, Center, Loader, Text } from '@mantine/core'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export default function LoadingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Center style={{ minHeight: 'calc(100vh - 200px)' }}>
          <Container size="sm" style={{ textAlign: 'center' }}>
            <Loader size="xl" mb="md" />
            <Text size="lg" c="dimmed">Chargement en cours...</Text>
          </Container>
        </Center>
      </main>
      <Footer />
    </div>
  )
}
