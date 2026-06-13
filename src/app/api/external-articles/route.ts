import { NextRequest, NextResponse } from 'next/server';

interface ExternalArticle {
  id: string;
  title: string;
  description?: string;
  source_url: string;
  published_date?: string;
  article_type: 'blog' | 'news';
}

const SOURCES: Record<'blog' | 'news', string> = {
  blog: 'https://www.outofthegrid.it/blog',
  news: 'https://www.outofthegrid.it/news',
};

const normalizeText = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toAbsoluteUrl = (href: string) => {
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (!href.startsWith('/')) return `https://www.outofthegrid.it/${href}`;
  return `https://www.outofthegrid.it${href}`;
};

const extractArticles = (html: string, type: 'blog' | 'news'): ExternalArticle[] => {
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  const results: ExternalArticle[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const label = normalizeText(match[2] ?? '');
    if (!href || !label) continue;

    const absoluteUrl = toAbsoluteUrl(href);
    if (!absoluteUrl.includes('/blog') && !absoluteUrl.includes('/news')) continue;
    if (absoluteUrl.endsWith('/blog') || absoluteUrl.endsWith('/news')) continue;
    if (seen.has(absoluteUrl)) continue;

    seen.add(absoluteUrl);
    results.push({
      id: `${type}-${results.length + 1}`,
      title: label,
      source_url: absoluteUrl,
      article_type: type,
    });

    if (results.length >= 20) break;
  }

  return results;
};

export async function GET(request: NextRequest) {
  const typeParam = request.nextUrl.searchParams.get('type');
  const articleType: 'blog' | 'news' = typeParam === 'news' ? 'news' : 'blog';
  const sourceUrl = SOURCES[articleType];

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OutofTheGridWeb/1.0)',
        Accept: 'text/html',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const html = await response.text();
    const articles = extractArticles(html, articleType);
    return NextResponse.json(articles, { status: 200 });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
