import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { Session } from 'next-auth';

/**
 * Check if a user has admin role
 * @param session - NextAuth session object
 * @returns true if user is an admin
 */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === 'ADMIN';
}

/**
 * Check if a user has vendor role
 * @param session - NextAuth session object
 * @returns true if user is a vendor
 */
export function isVendor(session: Session | null): boolean {
  return session?.user?.role === 'VENDOR';
}

/**
 * Check if a user has client role
 * @param session - NextAuth session object
 * @returns true if user is a client
 */
export function isClient(session: Session | null): boolean {
  return session?.user?.role === 'CLIENT';
}

/**
 * Get current session and check if user is admin
 * @returns Object with session and isAdmin flag
 */
export async function checkAdminSession() {
  const session = await getServerSession(authConfig);
  return {
    session,
    isAdmin: isAdmin(session),
  };
}

/**
 * Middleware wrapper for API routes that require admin access
 * Usage: Wrap your API route handler with this function
 * 
 * @example
 * export const GET = requireAdmin(async (request, session) => {
 *   // Your admin-only logic here
 *   return NextResponse.json({ data: 'admin data' });
 * });
 */
export function requireAdmin<T extends any[]>(
  handler: (request: Request, session: Session, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!isAdmin(session)) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Admin access required',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return handler(request, session, ...args);
  };
}

/**
 * Session timeout configuration (in milliseconds)
 */
export const SESSION_TIMEOUT = parseInt(
  process.env.ADMIN_SESSION_TIMEOUT || '3600000' // Default: 1 hour
);

/**
 * Check if session is expired based on last activity
 * @param lastActivity - Timestamp of last activity
 * @returns true if session has expired
 */
export function isSessionExpired(lastActivity: number): boolean {
  const now = Date.now();
  return now - lastActivity > SESSION_TIMEOUT;
}

/**
 * Session timeout handler for client-side
 * Stores last activity timestamp in sessionStorage
 */
export class SessionTimeoutHandler {
  private static STORAGE_KEY = 'admin_last_activity';
  private static WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before timeout

  /**
   * Update last activity timestamp
   */
  static updateActivity(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        this.STORAGE_KEY,
        Date.now().toString()
      );
    }
  }

  /**
   * Get last activity timestamp
   */
  static getLastActivity(): number {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? parseInt(stored, 10) : Date.now();
    }
    return Date.now();
  }

  /**
   * Check if session is about to expire
   */
  static isNearExpiry(): boolean {
    const lastActivity = this.getLastActivity();
    const timeRemaining = SESSION_TIMEOUT - (Date.now() - lastActivity);
    return timeRemaining <= this.WARNING_THRESHOLD && timeRemaining > 0;
  }

  /**
   * Check if session has expired
   */
  static isExpired(): boolean {
    return isSessionExpired(this.getLastActivity());
  }

  /**
   * Clear session data
   */
  static clear(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Initialize activity tracking
   * Call this in your admin layout or root component
   */
  static initialize(): void {
    if (typeof window !== 'undefined') {
      // Update activity on user interactions
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      
      const updateHandler = () => this.updateActivity();
      
      events.forEach((event) => {
        window.addEventListener(event, updateHandler, { passive: true });
      });

      // Initial activity timestamp
      this.updateActivity();

      // Check for expiry periodically
      const checkInterval = setInterval(() => {
        if (this.isExpired()) {
          clearInterval(checkInterval);
          // Trigger logout or show expiry modal
          window.location.href = '/login?reason=session_expired';
        }
      }, 60000); // Check every minute

      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        clearInterval(checkInterval);
      });
    }
  }
}
