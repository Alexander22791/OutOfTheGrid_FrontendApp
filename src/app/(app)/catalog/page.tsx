'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { IoCubeOutline, IoOpenOutline } from 'react-icons/io5';
import api from '@/lib/api';

interface CatalogItem {
  id: string | number;
  title: string;
  description?: string;
  image?: string;
  price?: string;
  link?: string;
}

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await api.get('/catalog/products');
        const mappedItems: CatalogItem[] = Array.isArray(response.data)
          ? response.data.map((item: { id: string | number; name?: string; price?: number | string }) => ({
              id: item.id,
              title: item.name ?? 'Prodotto',
              price:
                item.price !== undefined && item.price !== null
                  ? `${Number(item.price).toFixed(2)}€`
                  : undefined,
            }))
          : [];

        setItems(mappedItems);
      } catch (error) {
        console.error('Error fetching catalog:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-6">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-text-primary">Prodotti e Sistemi</h1>
          <p className="text-sm text-text-secondary">Scopri i prodotti consigliati per l&apos;autosufficienza.</p>
        </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <IoCubeOutline size={64} className="text-text-muted" />
          <p className="font-medium text-text-primary">Catalogo vuoto</p>
          <p className="text-sm text-text-secondary">Nuovi prodotti in arrivo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={String(item.id)}
              className="overflow-hidden rounded-xl border border-border bg-background-card transition-colors hover:border-accent/40"
            >
              {item.image ? (
                <div className="relative h-44 w-full">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-44 w-full items-center justify-center bg-surface">
                  <IoCubeOutline size={48} className="text-accent" />
                </div>
              )}

              <div className="p-4">
                <h3 className="mb-1 line-clamp-2 font-semibold text-text-primary">{item.title}</h3>
                {item.description && <p className="mb-3 line-clamp-2 text-sm text-text-secondary">{item.description}</p>}
                {item.price && <p className="mb-3 text-lg font-bold text-accent">{item.price}</p>}
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light"
                  >
                    Scopri di piu
                    <IoOpenOutline size={16} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
