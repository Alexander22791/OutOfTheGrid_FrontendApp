'use client';

import { useEffect, useState } from 'react';
import { IoAdd, IoLocation, IoPencil, IoPersonAdd, IoPersonRemove, IoTrash } from 'react-icons/io5';
import api from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/store/authStore';
import { AdminHeader } from '@/components/AdminHeader';

interface CityItem { id: string; name: string; }

export default function AdminCitiesPage() {
  const { user } = useAuthStore();
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cityName, setCityName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [managerCityId, setManagerCityId] = useState<string | null>(null);
  const [managerUserId, setManagerUserId] = useState('');
  const [managerAction, setManagerAction] = useState<'assign' | 'remove'>('assign');
  const [savingManager, setSavingManager] = useState(false);

  const fetchCities = async () => {
    setLoading(true);
    try { const r = await api.get('/admin/cities'); setCities(r.data ?? []); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.is_admin) queueMicrotask(() => { void fetchCities(); }); }, [user?.is_admin]);

  const handleCreateCity = async () => {
    if (!cityName.trim()) return;
    setSubmitting(true);
    try { await api.post('/admin/cities', { name: cityName.trim() }); setCityName(''); await fetchCities(); }
    finally { setSubmitting(false); }
  };

  const handleUpdateCity = async (id: string) => {
    if (!editingName.trim()) return;
    setSavingEditId(id);
    try { await api.put(`/admin/cities/${id}`, { name: editingName.trim() }); setEditingId(null); setEditingName(''); await fetchCities(); }
    catch { window.alert('Errore aggiornamento città.'); } finally { setSavingEditId(null); }
  };

  const handleDeleteCity = async (id: string, name: string) => {
    if (!window.confirm(`Eliminare "${name}"?`)) return;
    try { await api.delete(`/admin/cities/${id}`); await fetchCities(); }
    catch { window.alert('Impossibile eliminare la città.'); }
  };

  const handleManagerAction = async () => {
    if (!managerCityId || !managerUserId.trim()) return;
    setSavingManager(true);
    try {
      if (managerAction === 'assign') await api.post(`/admin/cities/${managerCityId}/assign-manager/${managerUserId.trim()}`);
      else await api.delete(`/admin/cities/${managerCityId}/remove-manager/${managerUserId.trim()}`);
      setManagerCityId(null); setManagerUserId('');
    } catch { window.alert('Errore gestione manager.'); } finally { setSavingManager(false); }
  };

  if (!user?.is_admin) return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-text-secondary">Solo gli admin possono gestire le città.</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-20 md:pb-6">
      <AdminHeader title="Gestione città" subtitle="Crea, modifica, elimina città e gestisci i city manager." />

      <div className="mb-6 rounded-xl border border-border bg-background-card p-5">
        <h2 className="mb-4 font-semibold text-text-primary">Nuova città</h2>
        <div className="flex flex-col gap-3 md:flex-row">
          <Input label="Nome città" value={cityName} onChange={setCityName} />
          <div className="md:pt-7"><Button title="Crea" onPress={handleCreateCity} loading={submitting} icon={<IoAdd size={18} />} /></div>
        </div>
      </div>

      {managerCityId && (
        <div className="mb-6 rounded-xl border border-accent/40 bg-accent/5 p-5">
          <h2 className="mb-3 font-semibold text-text-primary">{managerAction === 'assign' ? 'Assegna manager' : 'Rimuovi manager'} — città ID {managerCityId}</h2>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <Input label="ID utente" value={managerUserId} onChange={setManagerUserId} placeholder="es. 42" />
            <div className="flex gap-2">
              <Button title={managerAction === 'assign' ? 'Assegna' : 'Rimuovi'} onPress={handleManagerAction} loading={savingManager} />
              <Button title="Annulla" variant="outline" onPress={() => { setManagerCityId(null); setManagerUserId(''); }} />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" /></div>
      ) : cities.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-6 text-sm text-text-secondary">Nessuna città configurata.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cities.map((city) => (
            <div key={city.id} className="rounded-xl border border-border bg-background-card p-4">
              {editingId === city.id ? (
                <div className="flex flex-col gap-2">
                  <Input label="Nome città" value={editingName} onChange={setEditingName} />
                  <div className="flex gap-2">
                    <Button title="Salva" size="sm" onPress={() => handleUpdateCity(city.id)} loading={savingEditId === city.id} />
                    <Button title="Annulla" size="sm" variant="outline" onPress={() => { setEditingId(null); setEditingName(''); }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-accent/15 p-2 text-accent"><IoLocation size={18} /></div>
                    <div><p className="font-semibold text-text-primary">{city.name}</p><p className="text-xs text-text-muted">ID: {city.id}</p></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => { setEditingId(city.id); setEditingName(city.name); }} className="rounded-lg p-2 text-text-muted hover:bg-surface hover:text-accent"><IoPencil size={16} /></button>
                    <button type="button" onClick={() => { setManagerCityId(city.id); setManagerUserId(''); setManagerAction('assign'); }} className="rounded-lg p-2 text-text-muted hover:bg-surface hover:text-info"><IoPersonAdd size={16} /></button>
                    <button type="button" onClick={() => { setManagerCityId(city.id); setManagerUserId(''); setManagerAction('remove'); }} className="rounded-lg p-2 text-text-muted hover:bg-surface hover:text-warning"><IoPersonRemove size={16} /></button>
                    <button type="button" onClick={() => void handleDeleteCity(city.id, city.name)} className="rounded-lg p-2 text-text-muted hover:bg-surface hover:text-error"><IoTrash size={16} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
