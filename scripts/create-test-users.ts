import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test users
    const users = [
      {
        email: 'admin@bidinsouk.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN' as const,
      },
      {
        email: 'vendor@bidinsouk.com',
        name: 'Vendor User',
        password: hashedPassword,
        role: 'VENDOR' as const,
      },
      {
        email: 'client@bidinsouk.com',
        name: 'Client User',
        password: hashedPassword,
        role: 'CLIENT' as const,
      },
    ];

    for (const userData of users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const user = await prisma.user.create({
          data: userData,
        });
        console.log(`Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }

    console.log('Test users created successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@bidinsouk.com / password123');
    console.log('Vendor: vendor@bidinsouk.com / password123');
    console.log('Client: client@bidinsouk.com / password123');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();