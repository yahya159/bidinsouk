import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { UpdateProfileDto } from '@/lib/validations/auth'
import { updateUserProfile, getUserById } from '@/lib/services/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await getUserById(BigInt(session.user.id))

    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const data = UpdateProfileDto.parse(body)

    const user = await updateUserProfile(BigInt(session.user.id), data)

    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}
