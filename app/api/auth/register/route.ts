import { NextRequest, NextResponse } from 'next/server'
import { RegisterDto } from '@/lib/validations/auth'
import { createUser } from '@/lib/services/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = RegisterDto.parse(body)

    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    const user = await createUser(data)

    return NextResponse.json({
      message: 'Compte créé avec succès',
      userId: user.id.toString()
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}
