import type { NextConfig } from "next";

const IS_PROD = process.env.NODE_ENV === 'production';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.43.81'],

  images: {
    // Gli avatar sono base64 (data URL) — nessun dominio esterno necessario.
    // Aggiungere qui i domini solo se in futuro si caricano immagini da CDN esterno.
    remotePatterns: [],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
  },

  async headers() {
    const cspDirectives = [
      "default-src 'self'",
      // In dev Turbopack richiede unsafe-eval. In prod è rimosso automaticamente.
      IS_PROD
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",     // data: necessario per avatar base64
      `connect-src 'self' ${API_URL}`,  // Solo il backend dichiarato
      "font-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ];

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
        ],
      },
    ];
  },
};

export default nextConfig;
