import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple redirect from root to /fr
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/fr', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  // Only match the root path
  matcher: ['/']
};