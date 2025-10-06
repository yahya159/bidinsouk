import { Html, Head, Body, Container, Text, Heading } from '@react-email/components'

interface WelcomeEmailProps {
  name: string
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>Welcome to Bidinsouk!</Heading>
          <Text>Hello {name},</Text>
          <Text>Thank you for joining our platform. We're excited to have you!</Text>
        </Container>
      </Body>
    </Html>
  )
}