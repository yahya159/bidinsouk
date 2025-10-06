import { NextRequest, NextResponse } from 'next/server'

export function roleGuard(request: NextRequest, allowedRoles: string[]) {
  // In a real app, you'd get the user from the session
  // For now, we'll use a placeholder
  const userRole = 'CLIENT' // Placeholder - replace with actual role from session
  
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}