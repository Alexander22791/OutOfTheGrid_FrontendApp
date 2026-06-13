'use client';

import { useEffect, useState } from 'react';
import { IoAdd, IoCart, IoTrash } from 'react-icons/io5';
import api from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/store/authStore';
import { AdminHeader } from '@/components/AdminHeader';

interface ProductItem { id: string; name: string; price?: number; }
interface CityOption { id: string; name: string; }

const EMPTY_FORM = { name: '', price: '0', cityId: '' };

export default function AdminCatalogPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<ProductItem[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [pr, cr] = await Promise.all([api.get('/admin/products'), api.get('/admin/cities')]);
      setItems(pr.data ?? []); setCities(cr.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user?.is_admin || user?.is_city_manager) queueMicrotask(() => { void fetchItems(); }); }, [user?.is_admin, user?.is_city_manager]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.cityId) return;
    setSaving(true);
    try { await api.post('/admin/products', { name: form.name.trim(), price: Number(form.price || 0), cityId: Number(form.cityId) }); setForm(EMPTY_FORM); await fetchItems(); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminare questo prodotto?')) return;
    await api.delete(`/admin/products/${id}`); await fetchItems();
  };

  if (!user?.is_admin && !user?.is_city_manager) return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-text-secondary">Accesso riservato.</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-20 md:pb-6">
      <AdminHeader title="Catalogo prodotti" subtitle="Gestione prodotti tramite endpoint admin." />

      <div className="mb-6 rounded-xl border border-border bg-background-card p-5">
        <h2 className="mb-4 font-semibold text-text-primary">Nuovo prodotto</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Nome" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Input label="Prezzo" type="number" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v }))} />
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Città</label>
            <select className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary" value={form.cityId} onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))}>
              <option value="">Seleziona città</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4"><Button title="Crea prodotto" onPress={handleSubmit} loading={saving} icon={<IoAdd size={18} />} /></div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-8 text-center">
          <IoCart size={40} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary">Nessun prodotto.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-background-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-text-primary">{item.name}</h2>
                  <p className="text-xs text-text-muted">Prezzo: €{item.price ?? 0}</p>
                </div>
                <button type="button" onClick={() => void handleDelete(item.id)} className="flex items-center gap-2 rounded-lg border border-error/40 px-3 py-2 text-sm text-error hover:bg-error/10">
                  <IoTrash size={16} /> Elimina
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
