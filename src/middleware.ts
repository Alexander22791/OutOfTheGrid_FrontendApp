import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// Route che richiedono autenticazione
const PROTECTED_PREFIXES = ['/feed', '/profile', '/admin', '/catalog', '/classroom', '/events', '/leaderboard', '/notifications', '/post', '/course'];
// Route che richiedono ruolo admin o city manager
const ADMIN_PREFIXES = ['/admin'];
// Route pubbliche (non richiedono auth)
const PUBLIC_PATHS = ['/', '/login', '/register'];

function getTokenFromRequest(req: NextRequest): string | null {
  // Cerca prima nel cookie httpOnly (produzione sicura)
  const cookieToken = req.cookies.get('auth_token')?.value;
  if (cookieToken) return cookieToken;
  return null;
}

function isTokenValid(token: string): { valid: boolean; role?: string } {
  try {
    const decoded = jwtDecode<{ exp?: number; role?: string }>(token);
    if (!decoded.exp || decoded.exp * 1000 < Date.now()) return { valid: false };
    return { valid: true, role: decoded.role };
  } catch {
    return { valid: false };
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lascia passare route pubbliche e asset Next.js
  if (PUBLIC_PATHS.includes(pathname) ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = getTokenFromRequest(req);

  // Nessun token → redirect al login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { valid, role } = isTokenValid(token);

  // Token scaduto o invalido → redirect al login
  if (!valid) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    // Rimuovi il cookie scaduto
    response.cookies.delete('auth_token');
    return response;
  }

  // Route admin → controlla il ruolo
  const isAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAdmin && role !== 'ADMIN' && role !== 'MODERATOR') {
    return NextResponse.redirect(new URL('/feed', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
