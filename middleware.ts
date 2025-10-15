import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  let response: NextResponse;
  
  // Simple redirect from root to /fr
  if (request.nextUrl.pathname === '/') {
    response = NextResponse.redirect(new URL('/fr', request.url));
  } else {
    response = NextResponse.next();
  }
  
  // Add security headers to all responses
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:;"
  );
  
  return response;
}

export const config = {
  // Apply to all routes except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};