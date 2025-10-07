import { resend } from './resend'
import WelcomeEmail from '@/emails/WelcomeEmail'

export async function sendSystemEmail(
  to: string,
  subject: string,
  reactNode: React.ReactNode
) {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev', // Replace with your verified sender
      to,
      subject,
      react: reactNode as any,
    })
    
    return result
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendSystemEmail(to, 'Welcome to Bidinsouk!', <WelcomeEmail name={name} />)
}