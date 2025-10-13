import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Types de fichiers autorisés
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

// Taille maximale (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// POST - Upload d'une pièce jointe
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const threadId = formData.get('threadId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    if (!threadId) {
      return NextResponse.json(
        { error: 'ID du thread manquant' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est participant du thread
    const thread = await prisma.messageThread.findFirst({
      where: {
        id: threadId,
        participants: {
          some: {
            userId: session.user.id
          }
        }
      }
    });

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier le type de fichier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé' },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10MB)' },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || '';
    const filename = `${timestamp}_${randomString}.${extension}`;

    // Créer le dossier de destination s'il n'existe pas
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'messages');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Créer l'enregistrement en base de données
    const attachment = await prisma.messageAttachment.create({
      data: {
        filename: file.name,
        originalName: file.name,
        url: `/uploads/messages/${filename}`,
        size: file.size,
        mimeType: file.type,
        uploadedById: session.user.id
        // messageId sera défini lors de l'envoi du message
      }
    });

    return NextResponse.json({
      success: true,
      attachmentId: attachment.id,
      filename: attachment.filename,
      url: attachment.url,
      size: attachment.size
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST /api/messages/attachments:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    );
  }
}

// GET - Récupérer les informations d'une pièce jointe
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'ID de la pièce jointe manquant' },
        { status: 400 }
      );
    }

    // Récupérer la pièce jointe
    const attachment = await prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: {
          include: {
            thread: {
              include: {
                participants: {
                  where: {
                    userId: session.user.id
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Pièce jointe non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès à cette pièce jointe
    if (!attachment.message?.thread.participants.length && attachment.uploadedById !== session.user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: attachment.id,
      filename: attachment.filename,
      originalName: attachment.originalName,
      url: attachment.url,
      size: attachment.size,
      mimeType: attachment.mimeType,
      createdAt: attachment.createdAt
    });

  } catch (error) {
    console.error('Erreur GET /api/messages/attachments:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}