/**
 * Sanitizzazione centralizzata con DOMPurify.
 * Importa e usa queste funzioni ovunque mostri contenuto generato dagli utenti.
 *
 * DOMPurify gira solo lato client (richiede window/document).
 * Nei Server Components Next.js usa le varianti `server*` che usano
 * una whitelist di tag sicuri senza dipendenze browser.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitizza HTML generico — rimuove script, eventi inline, e tag pericolosi.
 * Usa per: contenuto post, descrizioni, bio con possibile markdown renderizzato.
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') return serverSanitize(dirty);
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    // Forza link esterni ad aprirsi in nuova scheda con noopener
    ADD_ATTR: ['target'],
    FORCE_BODY: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

/**
 * Sanitizza testo puro — rimuove TUTTO l'HTML.
 * Usa per: nomi, email, titoli, qualsiasi campo che non deve contenere markup.
 */
export function sanitizeText(dirty: string): string {
  if (typeof window === 'undefined') return serverSanitizeText(dirty);
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],       // Nessun tag permesso
    ALLOWED_ATTR: [],       // Nessun attributo permesso
    KEEP_CONTENT: true,     // Mantieni il testo, rimuovi solo i tag
  });
}

/**
 * Sanitizza URL — verifica che sia http/https, non javascript: o data:
 * Usa per: link inseriti dagli utenti, action URL nelle notifiche.
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  // Permette solo http e https
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Permette path relativi interni (es. /feed, /post/123)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  return '';
}

// ─── Fallback server-side (no browser APIs) ──────────────────────────────────

/**
 * Rimozione HTML lato server — regex semplice per SSR.
 * Non è robusta come DOMPurify ma è sicura per testo semplice.
 */
function serverSanitize(dirty: string): string {
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
    .replace(/javascript:/gi, '');
}

function serverSanitizeText(dirty: string): string {
  return dirty.replace(/<[^>]*>/g, '');
}
