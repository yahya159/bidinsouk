import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSharedAdminAccount() {
  try {
    // Informations du compte administrateur partagé
    const accountData = {
      email: 'admin-trinome@bidinsouk.com',
      name: 'Équipe Admin Trinôme',
      password: 'AdminTrinome123!',
      role: 'ADMIN' as const,
    };

    // Vérifier si le compte existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: accountData.email },
    });

    if (existingUser) {
      console.log(`⚠️  Le compte administrateur partagé existe déjà : ${accountData.email}`);
      console.log('Utilisez ces identifiants pour vous connecter :');
      console.log(`Email : ${accountData.email}`);
      console.log(`Mot de passe : ${accountData.password}`);
      return;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(accountData.password, 10);

    // Créer le compte administrateur
    const user = await prisma.user.create({
      data: {
        email: accountData.email,
        name: accountData.name,
        password: hashedPassword,
        role: accountData.role,
        admin: { create: {} }
      },
    });

    console.log('✅ Compte administrateur partagé créé avec succès !');
    console.log('Utilisez ces identifiants pour vous connecter :');
    console.log(`Email : ${user.email}`);
    console.log(`Mot de passe : ${accountData.password}`);
    console.log('Partagez ces identifiants avec vos camarades.');

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte administrateur partagé :', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSharedAdminAccount();