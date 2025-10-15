import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { activityLogger } from '@/lib/admin/activity-logger';

/**
 * Admin authentication guard for page components
 * Verifies user has ADMIN role and redirects non-admin users
 */
export async function requireAdminAuth() {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return {
      redirect: '/login',
      session: null,
    };
  }

  // Check if user has ADMIN role
  if (session.user.role !== 'ADMIN') {
    // Log unauthorized access attempt
    try {
      // We can't access the request object here, so we'll log without IP
      // The actual logging will happen in the API route middleware
      console.warn(
        `Unauthorized admin access attempt by user ${session.user.id} (${session.user.email}) with role ${session.user.role}`
      );
    } catch (error) {
      console.error('Failed to log unauthorized access:', error);
    }

    // Redirect based on user role
    if (session.user.role === 'VENDOR') {
      return {
        redirect: '/vendor-dashboard',
        session: null,
      };
    } else {
      return {
        redirect: '/unauthorized',
        session: null,
      };
    }
  }

  return {
    redirect: null,
    session,
  };
}

/**
 * Admin authentication guard for API routes
 * Returns response with appropriate status code for unauthorized access
 */
export async function requireAdminAuthApi(request: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      ),
      session: null,
    };
  }

  // Check if user has ADMIN role
  if (session.user.role !== 'ADMIN') {
    // Log unauthorized access attempt with IP address
    try {
      await activityLogger.log(
        BigInt(session.user.id),
        {
          action: 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
          entity: 'Admin',
          entityId: BigInt(session.user.id),
          metadata: {
            attemptedUrl: request.url,
            userRole: session.user.role,
          },
        },
        request
      );
    } catch (error) {
      console.error('Failed to log unauthorized access:', error);
    }

    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Admin access required',
        },
        { status: 403 }
      ),
      session: null,
    };
  }

  return {
    authorized: true,
    response: null,
    session,
  };
}
