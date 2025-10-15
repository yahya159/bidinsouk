import { NextResponse } from 'next/server';

// Add BigInt serialization support globally
if (typeof BigInt.prototype.toJSON === 'undefined') {
  (BigInt.prototype as any).toJSON = function() {
    return this.toString();
  };
}

/**
 * Standardized API error response
 * @param error - Error message to display
 * @param errorCode - Machine-readable error code (e.g., 'UNAUTHORIZED', 'VALIDATION_ERROR')
 * @param status - HTTP status code (default: 400)
 * @param details - Optional additional error details (only in development)
 */
export function errorResponse(
  error: string,
  errorCode: string,
  status: number = 400,
  details?: any
) {
  const response: any = {
    success: false,
    error,
    errorCode
  };

  // Only include details in development mode
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Standardized API success response
 * @param data - Data to return
 * @param status - HTTP status code (default: 200)
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(
    { success: true, ...data },
    { status }
  );
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  unauthorized: () => errorResponse('Non autorisé', 'UNAUTHORIZED', 401),
  forbidden: (message = 'Accès refusé') => errorResponse(message, 'FORBIDDEN', 403),
  notFound: (resource = 'Ressource') => errorResponse(`${resource} introuvable`, 'NOT_FOUND', 404),
  badRequest: (message = 'Requête invalide') => errorResponse(message, 'BAD_REQUEST', 400),
  validationError: (message: string, details?: any) => errorResponse(message, 'VALIDATION_ERROR', 422, details),
  serverError: (message = 'Erreur serveur', details?: any) => errorResponse(message, 'SERVER_ERROR', 500, details),
  conflict: (message: string) => errorResponse(message, 'CONFLICT', 409),
  tooManyRequests: () => errorResponse('Trop de requêtes', 'TOO_MANY_REQUESTS', 429),
};

