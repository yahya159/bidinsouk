import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function roleGuard(request: NextRequest, allowedRoles: string[]) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  const userRole = token.role as string
  
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}