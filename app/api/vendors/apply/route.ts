import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { upgradeToVendor, getUserRoles } from '@/lib/services/role-management'
import { VendorApplicationDto } from '@/lib/validations/vendors'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les données du formulaire
    const body = await req.json()
    console.log('Corps de la requête:', body);
    
    // Valider les données
    const applicationData = VendorApplicationDto.parse(body)
    console.log('Données validées:', applicationData);

    // Get cleanup preference from body (default: true)
    const cleanupOldData = body.cleanupClientData !== false
    console.log('Cleanup old client data:', cleanupOldData);

    const userId = BigInt(session.user.id)
    
    // Check if user is already a vendor
    const currentRoles = await getUserRoles(userId)
    if (currentRoles.roles.includes('VENDOR')) {
      return NextResponse.json(
        { error: 'Vous êtes déjà un vendeur' },
        { status: 400 }
      )
    }

    // Update user information
    await prisma.user.update({
      where: { id: userId },
      data: { 
        name: applicationData.name,
        phone: applicationData.phone
      }
    })

    // Upgrade to vendor with role management service
    const result = await upgradeToVendor(userId, cleanupOldData)
    
    return NextResponse.json({
      success: true,
      message: 'Vous êtes maintenant un vendeur',
      roles: result.roles,
      primaryRole: result.primaryRole,
      dataCleanedUp: cleanupOldData
    }, { status: 201 })
  } catch (error: any) {
    console.error('Erreur dans l\'API vendors/apply:', error);
    
    // Vérifier si c'est une erreur de validation Zod
    if (error.name === 'ZodError') {
      const fieldErrors = error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return NextResponse.json({ 
        error: 'Données de formulaire invalides - Veuillez vérifier tous les champs obligatoires', 
        details: fieldErrors 
      }, { status: 400 })
    }
    
    // Vérifier si c'est une erreur d'utilisateur déjà vendeur
    if (error.message && (error.message.includes('déjà un vendeur') || error.message === 'User is already a vendor')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ error: error.message || 'Erreur lors de la demande - Veuillez réessayer plus tard' }, { status: 400 })
  }
}
