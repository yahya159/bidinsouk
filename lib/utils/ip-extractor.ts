/**
 * Extract client IP address from Next.js request headers
 * Handles various proxy headers and both IPv4 and IPv6 formats
 */
export function getClientIp(request: Request): string {
  // Check x-forwarded-for header (most common for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
    // The first IP is the original client
    const ips = forwarded.split(',').map(ip => ip.trim());
    if (ips[0]) {
      return normalizeIp(ips[0]);
    }
  }

  // Check x-real-ip header (used by nginx and others)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return normalizeIp(realIp);
  }

  // Check cf-connecting-ip header (Cloudflare)
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return normalizeIp(cfConnectingIp);
  }

  // Check true-client-ip header (Akamai, Cloudflare)
  const trueClientIp = request.headers.get('true-client-ip');
  if (trueClientIp) {
    return normalizeIp(trueClientIp);
  }

  // Check x-client-ip header
  const xClientIp = request.headers.get('x-client-ip');
  if (xClientIp) {
    return normalizeIp(xClientIp);
  }

  // Fallback to unknown if no IP found
  return 'unknown';
}

/**
 * Normalize IP address format
 * Handles IPv4, IPv6, and IPv4-mapped IPv6 addresses
 */
function normalizeIp(ip: string): string {
  // Remove port if present
  const ipWithoutPort = ip.split(':').length > 2 
    ? ip // IPv6 address
    : ip.split(':')[0]; // IPv4 with port or just IPv4

  // Handle IPv4-mapped IPv6 addresses (::ffff:192.168.1.1)
  if (ipWithoutPort.startsWith('::ffff:')) {
    return ipWithoutPort.substring(7);
  }

  // Handle localhost variations
  if (ipWithoutPort === '::1' || ipWithoutPort === '127.0.0.1') {
    return 'localhost';
  }

  return ipWithoutPort;
}

/**
 * Validate if a string is a valid IP address (IPv4 or IPv6)
 */
export function isValidIp(ip: string): boolean {
  if (ip === 'unknown' || ip === 'localhost') {
    return true;
  }

  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip);
}
