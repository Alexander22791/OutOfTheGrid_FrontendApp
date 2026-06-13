'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { IoAdd, IoCalendar, IoTrash } from 'react-icons/io5';
import api from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/store/authStore';
import { AdminHeader } from '@/components/AdminHeader';

interface EventItem {
  id: string;
  title: string;
  description?: string;
  startsAt?: string;
  rewardPoints?: number;
}
interface CityOption { id: string; name: string; }

const EMPTY_FORM = { title: '', description: '', startsAt: '', cityId: '', rewardPoints: '10' };

export default function AdminEventsPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evRes, ciRes] = await Promise.allSettled([
        api.get('/admin/events'),
        api.get('/admin/cities'),
      ]);
      if (evRes.status === 'fulfilled') setEvents(evRes.value.data ?? []);
      if (ciRes.status === 'fulfilled') setCities(ciRes.value.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin || user?.is_city_manager) {
      queueMicrotask(() => { void fetchData(); });
    }
  }, [user?.is_admin, user?.is_city_manager]);

  const handleSubmit = async () => {
    setError('');
    if (!form.title.trim()) { setError('Il titolo è obbligatorio.'); return; }
    if (!form.description.trim()) { setError('La descrizione è obbligatoria.'); return; }
    if (!form.cityId) { setError('Seleziona una città.'); return; }
    if (!form.startsAt) { setError('Inserisci data e ora di inizio.'); return; }
    if (new Date(form.startsAt) <= new Date()) {
      setError('La data di inizio deve essere nel futuro.');
      return;
    }

    const startsAtInstant = new Date(form.startsAt).toISOString();
    setSaving(true);
    try {
      await api.post('/admin/events', {
        title: form.title.trim(),
        description: form.description.trim(),
        startsAt: startsAtInstant,
        cityId: Number(form.cityId),
        rewardPoints: Number(form.rewardPoints || 10),
      });
      setForm(EMPTY_FORM);
      await fetchData();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Errore nella creazione dell'evento.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminare questo evento?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/events/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      window.alert("Impossibile eliminare l'evento.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!user?.is_admin && !user?.is_city_manager) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-text-secondary">Accesso riservato.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-20 md:pb-6">
      <AdminHeader title="Gestione eventi" subtitle={`${events.length} eventi creati`} />

      <div className="mb-6 rounded-xl border border-border bg-background-card p-5">
        <h2 className="mb-4 font-semibold text-text-primary">Nuovo evento</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Titolo" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="es. Seminario compostaggio" />
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Città</label>
            <select className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary" value={form.cityId} onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))}>
              <option value="">Seleziona città</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <Input label="Descrizione" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Descrivi l'evento..." multiline rows={3} />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Data e ora inizio</label>
            <input type="datetime-local" className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
          </div>
          <Input label="Punti reward" type="number" value={form.rewardPoints} onChange={(v) => setForm((f) => ({ ...f, rewardPoints: v }))} />
        </div>

        {error && <p className="mt-2 text-sm text-error">{error}</p>}

        <div className="mt-4">
          <Button title="Crea evento" onPress={handleSubmit} loading={saving} icon={<IoAdd size={18} />} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" /></div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-8 text-center text-sm text-text-secondary">Nessun evento creato.</div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="rounded-xl border border-border bg-background-card p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <IoCalendar size={16} className="shrink-0 text-accent" />
                    <h2 className="font-semibold text-text-primary">{ev.title}</h2>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">+{ev.rewardPoints ?? 10} pt</span>
                  </div>
                  {ev.description && <p className="mb-1 text-sm text-text-secondary line-clamp-2">{ev.description}</p>}
                  {ev.startsAt && <p className="text-xs text-text-muted">{format(new Date(ev.startsAt), "d MMM yyyy 'alle' HH:mm", { locale: it })}</p>}
                </div>
                <button type="button" onClick={() => void handleDelete(ev.id)} disabled={deletingId === ev.id} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-error/40 text-error transition-colors hover:bg-error/10 disabled:opacity-40">
                  {deletingId === ev.id ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-error/30 border-t-error" /> : <IoTrash size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
