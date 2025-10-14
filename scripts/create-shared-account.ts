import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSharedAccount() {
  try {
    // Informations du compte partagé
    const accountData = {
      email: 'trinome@bidinsouk.com',
      name: 'Équipe Trinôme',
      password: 'Trinome123!',
      role: 'CLIENT' as const,
    };

    // Vérifier si le compte existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: accountData.email },
    });

    if (existingUser) {
      console.log(`⚠️  Le compte partagé existe déjà : ${accountData.email}`);
      console.log('Utilisez ces identifiants pour vous connecter :');
      console.log(`Email : ${accountData.email}`);
      console.log(`Mot de passe : ${accountData.password}`);
      return;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(accountData.password, 10);

    // Créer le compte
    const user = await prisma.user.create({
      data: {
        email: accountData.email,
        name: accountData.name,
        password: hashedPassword,
        role: accountData.role,
        client: { create: {} }
      },
    });

    console.log('✅ Compte partagé créé avec succès !');
    console.log('Utilisez ces identifiants pour vous connecter :');
    console.log(`Email : ${user.email}`);
    console.log(`Mot de passe : ${accountData.password}`);
    console.log('Partagez ces identifiants avec vos camarades.');

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte partagé :', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSharedAccount();