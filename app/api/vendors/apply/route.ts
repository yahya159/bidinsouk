import { NextRequest, NextResponse } from 'next/server'
import { applyToBeVendor } from '@/lib/services/vendors'

function getCurrentUser(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const role = req.headers.get('x-user-role')
  if (!userId) return null
  return { userId: BigInt(userId), role }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (user.role === 'VENDOR') {
      return NextResponse.json({ error: 'Already a vendor' }, { status: 400 })
    }

    const result = await applyToBeVendor(user.userId)
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
