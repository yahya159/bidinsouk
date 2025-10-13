import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestYoussefUsers() {
  try {
    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Youssef Admin
    const adminYoussefData = {
      email: 'youssef.admin@bidinsouk.com',
      name: 'Youssef Admin',
      password: hashedPassword,
      role: 'ADMIN' as const,
    };

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminYoussefData.email },
    });

    if (!existingAdmin) {
      const adminUser = await prisma.user.create({
        data: adminYoussefData,
      });
      console.log(`Created admin user: ${adminUser.email} (${adminUser.role})`);
      
      // Create admin profile
      await prisma.admin.create({
        data: {
          userId: adminUser.id,
        },
      });
      console.log(`Created admin profile for: ${adminUser.email}`);
    } else {
      console.log(`Admin user already exists: ${adminYoussefData.email}`);
    }

    // Create Youssef Vendor
    const vendorYoussefData = {
      email: 'youssef.vendor@bidinsouk.com',
      name: 'Youssef Vendor',
      password: hashedPassword,
      role: 'VENDOR' as const,
    };

    const existingVendor = await prisma.user.findUnique({
      where: { email: vendorYoussefData.email },
    });

    if (!existingVendor) {
      const vendorUser = await prisma.user.create({
        data: vendorYoussefData,
      });
      console.log(`Created vendor user: ${vendorUser.email} (${vendorUser.role})`);
      
      // Create vendor profile
      const vendor = await prisma.vendor.create({
        data: {
          userId: vendorUser.id,
        },
      });
      console.log(`Created vendor profile for: ${vendorUser.email}`);
      
      // Create a default store for the vendor
      const store = await prisma.store.create({
        data: {
          sellerId: vendor.id,
          name: "Youssef's Boutique",
          slug: 'youssef-boutique',
          email: vendorUser.email,
        },
      });
      console.log(`Created store for vendor: ${store.name}`);
    } else {
      console.log(`Vendor user already exists: ${vendorYoussefData.email}`);
    }

    // Create Youssef Client
    const clientYoussefData = {
      email: 'youssef.client@bidinsouk.com',
      name: 'Youssef Client',
      password: hashedPassword,
      role: 'CLIENT' as const,
    };

    const existingClient = await prisma.user.findUnique({
      where: { email: clientYoussefData.email },
    });

    if (!existingClient) {
      const clientUser = await prisma.user.create({
        data: clientYoussefData,
      });
      console.log(`Created client user: ${clientUser.email} (${clientUser.role})`);
      
      // Create client profile
      await prisma.client.create({
        data: {
          userId: clientUser.id,
        },
      });
      console.log(`Created client profile for: ${clientUser.email}`);
    } else {
      console.log(`Client user already exists: ${clientYoussefData.email}`);
    }

    console.log('\n=== Test Youssef Users Created Successfully! ===');
    console.log('\nLogin credentials:');
    console.log('Admin Youssef: youssef.admin@bidinsouk.com / password123');
    console.log('Vendor Youssef: youssef.vendor@bidinsouk.com / password123');
    console.log('Client Youssef: youssef.client@bidinsouk.com / password123');

  } catch (error) {
    console.error('Error creating test Youssef users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestYoussefUsers();