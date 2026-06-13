'use client';

import { useEffect, useState } from 'react';
import { IoAdd, IoLayers, IoPencil, IoSave, IoTrash } from 'react-icons/io5';
import api from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/store/authStore';
import { AdminHeader } from '@/components/AdminHeader';

interface CategoryItem {
  id: number;
  type: string;
  name: string;
  icon?: string;
  protectedCategory: boolean;
  minLevelToRead: number;
  minLevelToWrite: number;
  active: boolean;
  sortOrder: number;
}

const EMPTY_FORM = { type: '', name: '', icon: '', protectedCategory: false, minLevelToRead: 1, minLevelToWrite: 1, sortOrder: 0 };

export default function AdminCategoriesPage() {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) { queueMicrotask(() => { void fetchCategories(); }); }
  }, [user?.is_admin]);

  const handleCreate = async () => {
    if (!form.type.trim() || !form.name.trim()) { window.alert('Slug tecnico e nome sono obbligatori.'); return; }
    setSaving(true);
    try {
      await api.post('/admin/categories', { type: form.type.trim().toUpperCase().replace(/\s+/g, '_'), name: form.name.trim(), icon: form.icon.trim() || undefined, protectedCategory: form.protectedCategory, minLevelToRead: form.minLevelToRead, minLevelToWrite: form.minLevelToWrite, sortOrder: form.sortOrder });
      setForm(EMPTY_FORM); setShowForm(false); await fetchCategories();
    } catch { window.alert('Errore nella creazione.'); } finally { setSaving(false); }
  };

  const handleUpdate = async (cat: CategoryItem) => {
    setSaving(true);
    try {
      await api.put(`/admin/categories/${cat.id}`, { name: cat.name, icon: cat.icon, protectedCategory: cat.protectedCategory, minLevelToRead: cat.minLevelToRead, minLevelToWrite: cat.minLevelToWrite, active: cat.active, sortOrder: cat.sortOrder });
      setEditingId(null); await fetchCategories();
    } catch { window.alert('Errore nel salvataggio.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Eliminare "${name}"?`)) return;
    try { await api.delete(`/admin/categories/${id}`); await fetchCategories(); } catch { window.alert('Impossibile eliminare.'); }
  };

  const updateLocal = (id: number, field: keyof CategoryItem, value: unknown) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  if (!user?.is_admin) return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-text-secondary">Solo gli admin possono gestire le categorie.</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <AdminHeader title="Categorie" subtitle="Gestisci categorie, nomi italiani e livelli di accesso." />
        <Button title="Nuova" onPress={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }} icon={<IoAdd size={18} />} />
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-5">
          <h2 className="mb-4 font-semibold text-text-primary">Nuova categoria</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Slug tecnico" placeholder="SCAMBI" value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v }))} />
            <Input label="Nome italiano" placeholder="Scambi e Baratti" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <Input label="Icona (opzionale)" placeholder="swap" value={form.icon} onChange={(v) => setForm((f) => ({ ...f, icon: v }))} />
            <Input label="Ordine" type="number" value={String(form.sortOrder)} onChange={(v) => setForm((f) => ({ ...f, sortOrder: Number(v) }))} />
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">Livello lettura</label>
              <input type="number" min={1} value={form.minLevelToRead} onChange={(e) => setForm((f) => ({ ...f, minLevelToRead: Number(e.target.value) }))} className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">Livello scrittura</label>
              <input type="number" min={1} value={form.minLevelToWrite} onChange={(e) => setForm((f) => ({ ...f, minLevelToWrite: Number(e.target.value) }))} className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input type="checkbox" id="protected" checked={form.protectedCategory} onChange={(e) => setForm((f) => ({ ...f, protectedCategory: e.target.checked }))} className="h-4 w-4" />
            <label htmlFor="protected" className="text-sm text-text-secondary">Categoria protetta</label>
          </div>
          <div className="mt-4 flex gap-3">
            <Button title="Crea" onPress={handleCreate} loading={saving} icon={<IoAdd size={18} />} />
            <Button title="Annulla" variant="outline" onPress={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" /></div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className={['rounded-xl border bg-background-card p-4', cat.active ? 'border-border' : 'border-border/40 opacity-60'].join(' ')}>
              {editingId === cat.id ? (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input label="Nome italiano" value={cat.name} onChange={(v) => updateLocal(cat.id, 'name', v)} />
                    <Input label="Icona" value={cat.icon ?? ''} onChange={(v) => updateLocal(cat.id, 'icon', v)} />
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-secondary">Livello lettura</label>
                      <input type="number" min={1} value={cat.minLevelToRead} onChange={(e) => updateLocal(cat.id, 'minLevelToRead', Number(e.target.value))} className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-secondary">Livello scrittura</label>
                      <input type="number" min={1} value={cat.minLevelToWrite} onChange={(e) => updateLocal(cat.id, 'minLevelToWrite', Number(e.target.value))} className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={cat.protectedCategory} onChange={(e) => updateLocal(cat.id, 'protectedCategory', e.target.checked)} className="h-4 w-4" />Protetta</label>
                    <label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={cat.active} onChange={(e) => updateLocal(cat.id, 'active', e.target.checked)} className="h-4 w-4" />Attiva</label>
                  </div>
                  <div className="flex gap-2">
                    <Button title="Salva" size="sm" onPress={() => handleUpdate(cat)} loading={saving} icon={<IoSave size={16} />} />
                    <Button title="Annulla" size="sm" variant="outline" onPress={() => setEditingId(null)} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-accent/15 p-2 text-accent"><IoLayers size={18} /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-text-primary">{cat.name}</p>
                        {!cat.active && <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs text-error">inattiva</span>}
                        {cat.protectedCategory && <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">protetta</span>}
                      </div>
                      <p className="text-xs text-text-muted">slug: {cat.type} · lettura lv.{cat.minLevelToRead} · scrittura lv.{cat.minLevelToWrite}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setEditingId(cat.id)} className="rounded-lg p-2 text-text-muted hover:bg-surface hover:text-accent"><IoPencil size={16} /></button>
                    <button type="button" onClick={() => void handleDelete(cat.id, cat.name)} className="rounded-lg p-2 text-text-muted hover:bg-surface hover:text-error"><IoTrash size={16} /></button>
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
