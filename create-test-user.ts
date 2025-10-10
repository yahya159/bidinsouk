import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating test user...')
  
  // Hash the password
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      role: 'CLIENT',
      client: {
        create: {}
      }
    }
  })
  
  console.log('✅ Test user created successfully!')
  console.log('Email: test@example.com')
  console.log('Password: password123')
  console.log('User ID:', user.id)
}

main()
  .catch((e) => {
    console.error('❌ Error creating test user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })