import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig as authOptions } from '@/lib/auth/config';
import { activityLogger, LogOptions } from '@/lib/admin/activity-logger';

/**
 * Middleware to automatically log admin actions
 * Wraps API route handlers to capture activity logs
 */
export function withActivityLogging(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  logConfig?: {
    action?: string;
    entity?: string;
    getEntityId?: (req: NextRequest, context?: any) => bigint | Promise<bigint>;
    getMetadata?: (req: NextRequest, context?: any) => Record<string, any> | Promise<Record<string, any>>;
    skipLogging?: (req: NextRequest, context?: any) => boolean | Promise<boolean>;
  }
) {
  return async (req: NextRequest, context?: any) => {
    // Execute the handler first
    const response = await handler(req, context);

    // Skip logging if configured
    if (logConfig?.skipLogging && await logConfig.skipLogging(req, context)) {
      return response;
    }

    // Only log successful operations (2xx status codes)
    if (response.status >= 200 && response.status < 300) {
      try {
        // Get session to identify the actor
        const session = await getServerSession(authOptions);
        
        if (session?.user?.id) {
          const userId = BigInt(session.user.id);

          // Determine action from HTTP method if not provided
          let action = logConfig?.action;
          if (!action) {
            const method = req.method;
            const pathSegments = req.nextUrl.pathname.split('/').filter(Boolean);
            const resource = pathSegments[pathSegments.length - 1] || 'RESOURCE';
            
            switch (method) {
              case 'POST':
                action = `${resource.toUpperCase()}_CREATED`;
                break;
              case 'PUT':
              case 'PATCH':
                action = `${resource.toUpperCase()}_UPDATED`;
                break;
              case 'DELETE':
                action = `${resource.toUpperCase()}_DELETED`;
                break;
              default:
                action = `${resource.toUpperCase()}_${method}`;
            }
          }

          // Determine entity from URL if not provided
          let entity = logConfig?.entity;
          if (!entity) {
            const pathSegments = req.nextUrl.pathname.split('/').filter(Boolean);
            // Try to extract entity from path (e.g., /api/admin/users -> User)
            const resourceIndex = pathSegments.indexOf('admin') + 1;
            if (resourceIndex < pathSegments.length) {
              const resourceName = pathSegments[resourceIndex];
              entity = resourceName.charAt(0).toUpperCase() + resourceName.slice(1, -1); // Singularize
            } else {
              entity = 'Unknown';
            }
          }

          // Get entity ID
          let entityId: bigint | undefined;
          if (logConfig?.getEntityId) {
            entityId = await logConfig.getEntityId(req, context);
          } else if (context?.params?.id) {
            entityId = BigInt(context.params.id);
          }

          // Get metadata
          let metadata: Record<string, any> | undefined;
          if (logConfig?.getMetadata) {
            metadata = await logConfig.getMetadata(req, context);
          }

          // Log the activity
          if (entityId) {
            const logOptions: LogOptions = {
              action,
              entity,
              entityId,
              metadata,
            };

            await activityLogger.log(userId, logOptions, req);
          }
        }
      } catch (error) {
        // Don't throw - logging failures shouldn't break the API
        console.error('Activity logging failed:', error);
      }
    }

    return response;
  };
}

/**
 * Helper to create a logged API handler with custom configuration
 */
export function createLoggedHandler<T = any>(
  config: {
    action: string;
    entity: string;
    getEntityId?: (req: NextRequest, context?: any) => bigint | Promise<bigint>;
    getMetadata?: (req: NextRequest, context?: any) => Record<string, any> | Promise<Record<string, any>>;
  },
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withActivityLogging(handler, config);
}

/**
 * Extract entity ID from request body
 */
export async function getEntityIdFromBody(req: NextRequest): Promise<bigint | undefined> {
  try {
    const body = await req.json();
    if (body.id) {
      return BigInt(body.id);
    }
  } catch {
    // Ignore parsing errors
  }
  return undefined;
}

/**
 * Extract entity ID from URL params
 */
export function getEntityIdFromParams(context?: any): bigint | undefined {
  if (context?.params?.id) {
    try {
      return BigInt(context.params.id);
    } catch {
      // Ignore conversion errors
    }
  }
  return undefined;
}

/**
 * Create metadata from request body
 */
export async function getMetadataFromBody(req: NextRequest): Promise<Record<string, any>> {
  try {
    const body = await req.json();
    // Remove sensitive fields
    const { password, token, ...safeData } = body;
    return safeData;
  } catch {
    return {};
  }
}
