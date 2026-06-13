'use client';

import { useEffect, useState } from 'react';
import {
  IoArrowForward,
  IoDocumentText,
  IoFlash,
  IoNewspaperOutline,
  IoShareSocialOutline,
} from 'react-icons/io5';

interface Article {
  id: string;
  title: string;
  description?: string;
  source_url: string;
  published_date?: string;
  article_type: 'blog' | 'news';
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState<'blog' | 'news'>('blog');
  const [loading, setLoading] = useState(true);

  const fetchArticles = async (tab: 'blog' | 'news') => {
    setLoading(true);
    try {
      const externalResponse = await fetch(`/api/external-articles?type=${tab}`, {
        cache: 'no-store',
      });
      const externalArticles = externalResponse.ok ? ((await externalResponse.json()) as Article[]) : [];

      if (externalArticles.length > 0) {
        setArticles(externalArticles);
        return;
      }

      setArticles([
        {
          id: `${tab}-fallback`,
          title: tab === 'blog' ? 'Vai al Blog OutofTheGrid' : 'Vai alle News OutofTheGrid',
          description: 'Apri la pagina ufficiale per leggere gli ultimi contenuti.',
          source_url: tab === 'blog' ? 'https://www.outofthegrid.it/blog' : 'https://www.outofthegrid.it/news',
          article_type: tab,
        },
      ]);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([
        {
          id: `${tab}-fallback`,
          title: tab === 'blog' ? 'Vai al Blog OutofTheGrid' : 'Vai alle News OutofTheGrid',
          description: 'Apri la pagina ufficiale per leggere gli ultimi contenuti.',
          source_url: tab === 'blog' ? 'https://www.outofthegrid.it/blog' : 'https://www.outofthegrid.it/news',
          article_type: tab,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchArticles(activeTab);
    });
  }, [activeTab]);

  const handleRefresh = async () => {
    // Il refresh ricarica direttamente dalle fonti esterne tramite route interna.
    await fetchArticles(activeTab);
  };

  const handleShare = async (article: Article) => {
    if (!(typeof navigator !== 'undefined' && 'share' in navigator)) return;
    try {
      await navigator.share({
        title: article.title,
        text: article.description,
        url: article.source_url,
      });
    } catch {
      // user may cancel share dialog
    }
  };

  const isBlog = activeTab === 'blog';
  const accentColor = isBlog ? '#58A6FF' : '#F0A500';

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-4 pb-24 md:pb-4">
        <div className="mb-4 flex gap-3">
        {(['blog', 'news'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-accent/50',
            ].join(' ')}
          >
            {tab === 'blog' ? <IoDocumentText size={18} /> : <IoFlash size={18} />}
            {tab === 'blog' ? 'Blog' : 'News'}
          </button>
        ))}
        <button onClick={handleRefresh} className="ml-auto px-3 text-xs text-text-muted transition-colors hover:text-accent">
          Aggiorna
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <IoNewspaperOutline size={64} className="text-text-muted" />
          <p className="font-medium text-text-primary">Nessun articolo trovato</p>
          <p className="text-sm text-text-secondary">I nuovi contenuti appariranno qui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="flex gap-4 rounded-xl border border-border bg-background-card p-4 transition-colors hover:border-accent/40"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${accentColor}15` }}>
                {isBlog ? <IoDocumentText size={28} style={{ color: accentColor }} /> : <IoFlash size={28} style={{ color: accentColor }} />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: accentColor, backgroundColor: `${accentColor}20` }}>
                    {isBlog ? 'Blog' : 'News'}
                  </span>
                  <span className="text-xs text-text-muted">{article.published_date ?? 'Recente'}</span>
                </div>

                <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-text-primary">{article.title}</h3>

                {article.description && <p className="mb-3 line-clamp-3 text-xs text-text-secondary">{article.description}</p>}

                <div className="flex items-center gap-3">
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                  >
                    Leggi l&apos;articolo
                    <IoArrowForward size={14} />
                  </a>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button onClick={() => handleShare(article)} className="text-text-secondary transition-colors hover:text-accent">
                      <IoShareSocialOutline size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
