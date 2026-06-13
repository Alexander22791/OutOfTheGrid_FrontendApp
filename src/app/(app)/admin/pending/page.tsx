'use client';

import { useEffect, useState } from 'react';
import { IoCheckmark, IoClose, IoStorefront } from 'react-icons/io5';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AdminHeader } from '@/components/AdminHeader';

interface PendingProduct {
  id: number;
  name: string;
  price: number;
  minLevel: number;
}

export default function AdminPendingPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<number, string>>({});

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/products/pending');
      setProducts(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      queueMicrotask(() => { void fetchPending(); });
    }
  }, [user?.is_admin]);

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      await api.post(`/admin/products/${id}/approve`);
      await fetchPending();
    } catch {
      window.alert('Errore durante l\'approvazione.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessing(id);
    try {
      await api.post(`/admin/products/${id}/reject`, { note: rejectNote[id] ?? '' });
      await fetchPending();
    } catch {
      window.alert('Errore durante il rifiuto.');
    } finally {
      setProcessing(null);
    }
  };

  if (!user?.is_admin) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-text-secondary">Solo gli admin possono approvare contenuti.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-20 md:pb-6">
      <AdminHeader title="Contenuti in attesa" subtitle="Prodotti inseriti dai city manager in attesa di approvazione." />

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-8 text-center">
          <IoStorefront size={40} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary">Nessun contenuto in attesa di approvazione.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-xl border border-border bg-background-card p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{product.name}</p>
                  <p className="text-sm text-text-secondary">
                    Prezzo: €{Number(product.price).toFixed(2)}
                    {product.minLevel > 0 && ` · Livello minimo: ${product.minLevel}`}
                  </p>
                </div>
                <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">PENDING</span>
              </div>
              <div className="mb-3">
                <input type="text" placeholder="Nota opzionale (visibile al city manager se rifiutato)"
                  value={rejectNote[product.id] ?? ''}
                  onChange={(e) => setRejectNote((prev) => ({ ...prev, [product.id]: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => void handleApprove(product.id)} disabled={processing === product.id}
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50">
                  <IoCheckmark size={16} /> Approva
                </button>
                <button type="button" onClick={() => void handleReject(product.id)} disabled={processing === product.id}
                  className="flex items-center gap-2 rounded-lg border border-error/40 px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-50">
                  <IoClose size={16} /> Rifiuta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
