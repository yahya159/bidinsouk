/**
 * BigInt serialization utilities for JSON responses
 */

/**
 * Serialize an object with BigInt values to JSON-safe object
 * Converts all BigInt values to strings recursively
 * 
 * @param obj - Object to serialize
 * @returns Object with BigInt values converted to strings
 */
export function serializeBigInt<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeBigInt((obj as any)[key]);
      }
    }
    return result;
  }
  
  return obj;
}

/**
 * JSON.stringify replacer function for BigInt
 * Use with: JSON.stringify(data, bigIntReplacer)
 */
export function bigIntReplacer(key: string, value: any): any {
  return typeof value === 'bigint' ? value.toString() : value;
}

/**
 * Parse BigInt from string in request body
 * Useful for converting string IDs back to BigInt for database queries
 */
export function parseBigInt(value: string | number): bigint {
  if (typeof value === 'bigint') {
    return value;
  }
  return BigInt(value);
}

/**
 * Safely convert BigInt to number (for small values)
 * Throws error if value is too large for JavaScript number
 */
export function bigIntToNumber(value: bigint): number {
  if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
    throw new Error(`BigInt value ${value} is too large to convert to number`);
  }
  return Number(value);
}

