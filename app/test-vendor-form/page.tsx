'use client'

import { VendorApplicationForm } from '@/components/vendor/VendorApplicationForm'
import { Container, Title } from '@mantine/core'

export default function TestVendorFormPage() {
  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="xl">Test du formulaire vendeur</Title>
      <VendorApplicationForm />
    </Container>
  )
}