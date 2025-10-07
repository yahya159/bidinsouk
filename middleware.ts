import { NextRequest, NextResponse } from 'next/server'
import { roleGuard } from '@/lib/auth/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    return await roleGuard(request, ['ADMIN'])
  }
  
  // Protect vendor routes
  if (pathname.startsWith('/vendor')) {
    return await roleGuard(request, ['VENDOR', 'ADMIN'])
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/vendor/:path*']
}