import { requireAdmin } from '@/lib/admin/permissions';
import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify admin authentication
 * This demonstrates how to use the requireAdmin middleware
 */
export const GET = requireAdmin(async (request, session) => {
  // This code only runs if user is authenticated and has ADMIN role
  return NextResponse.json({
    message: 'Admin access granted',
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  });
});
