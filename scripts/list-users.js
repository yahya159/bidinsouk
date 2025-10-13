"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            include: {
                client: true,
                vendor: true,
                admin: true,
            },
        });
        console.log('=== All Users ===');
        users.forEach(user => {
            console.log(`\nID: ${user.id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Name: ${user.name}`);
            console.log(`Role: ${user.role}`);
            console.log(`Created: ${user.createdAt}`);
            if (user.client) {
                console.log(`Profile: Client (ID: ${user.client.id})`);
            }
            if (user.vendor) {
                console.log(`Profile: Vendor (ID: ${user.vendor.id})`);
            }
            if (user.admin) {
                console.log(`Profile: Admin (ID: ${user.admin.id})`);
            }
        });
        console.log(`\nTotal users: ${users.length}`);
    }
    catch (error) {
        console.error('Error listing users:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
listUsers();
