import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { applyToBeVendor } from '@/lib/services/vendors'
import { VendorApplicationDto } from '@/lib/validations/vendors'

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

    // Vérifier si l'utilisateur est déjà vendeur
    const userId = BigInt(session.user.id)
    
    const result = await applyToBeVendor(userId, applicationData)
    return NextResponse.json(result, { status: 201 })
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