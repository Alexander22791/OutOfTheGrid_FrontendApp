'use client';

import { useEffect, useState } from 'react';
import { IoAdd, IoPeople, IoPricetag, IoTrash } from 'react-icons/io5';
import api from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/store/authStore';
import { AdminHeader } from '@/components/AdminHeader';

interface CouponItem { id: string; code: string; discountPercent?: number; expiresAt?: string; }
const EMPTY_FORM = { code: '', discountPercent: '10', expiresAt: '' };

export default function AdminPlansPage() {
  const { user } = useAuthStore();
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [couponsRes, statsRes] = await Promise.allSettled([
        api.get('/admin/coupons'),
        api.get('/admin/stats'),
      ]);
      if (couponsRes.status === 'fulfilled') setCoupons(couponsRes.value.data ?? []);
      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data;
        setActiveSubscriptions(d.activeSubscriptions ?? d.active_subscriptions ?? 0);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user?.is_admin) queueMicrotask(() => { void fetchData(); }); }, [user?.is_admin]);

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.expiresAt.trim()) return;
    setSaving(true);
    try {
      await api.post('/admin/coupons', { code: form.code.trim(), discountPercent: Number(form.discountPercent || 0), expiresAt: form.expiresAt });
      setForm(EMPTY_FORM); await fetchData();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminare questo coupon?')) return;
    await api.delete(`/admin/coupons/${id}`); await fetchData();
  };

  if (!user?.is_admin) return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-text-secondary">Solo gli admin possono gestire piani e coupon.</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-20 md:pb-6">
      <AdminHeader title="Piani e abbonamenti" subtitle="Gestione coupon e abbonati attivi." />

      {/* Contatore abbonati */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-violet-400/30 bg-violet-400/10 px-5 py-4">
        <div className="rounded-full bg-violet-400/20 p-3 text-violet-400">
          <IoPeople size={24} />
        </div>
        <div>
          <p className="text-3xl font-bold text-text-primary">{activeSubscriptions}</p>
          <p className="text-sm text-text-secondary">Abbonamenti attivi in questo momento</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-background-card p-5">
        <h2 className="mb-4 font-semibold text-text-primary">Nuovo coupon</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Codice" value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} />
          <Input label="Sconto %" type="number" value={form.discountPercent} onChange={(v) => setForm((f) => ({ ...f, discountPercent: v }))} />
          <Input label="Scadenza (YYYY-MM-DD)" value={form.expiresAt} onChange={(v) => setForm((f) => ({ ...f, expiresAt: v }))} />
        </div>
        <div className="mt-4"><Button title="Crea coupon" onPress={handleSubmit} loading={saving} icon={<IoAdd size={18} />} /></div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" /></div>
      ) : coupons.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-6 text-center text-sm text-text-secondary">Nessun coupon creato.</div>
      ) : (
        <div className="space-y-4">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="rounded-xl border border-border bg-background-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2"><IoPricetag size={16} className="text-accent" /><h2 className="font-semibold text-text-primary">{coupon.code}</h2></div>
                  <p className="text-sm text-text-secondary">Sconto: {coupon.discountPercent ?? 0}%</p>
                  <p className="text-xs text-text-muted">Scadenza: {coupon.expiresAt ?? '-'}</p>
                </div>
                <button type="button" onClick={() => void handleDelete(coupon.id)} className="flex items-center gap-2 rounded-lg border border-error/40 px-3 py-2 text-sm text-error hover:bg-error/10">
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
