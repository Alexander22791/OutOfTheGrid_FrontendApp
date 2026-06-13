'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { IoSearch, IoTrash, IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AdminHeader } from '@/components/AdminHeader';

interface UserItem {
  id: string;
  name: string;
  email: string;
  cityName?: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  level: number;
  isSubscribed: boolean;
  createdAt?: string;
}

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingSubId, setTogglingSubId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      const mapped: UserItem[] = Array.isArray(res.data)
        ? res.data.map((item: {
            id?: string | number;
            displayName?: string;
            email?: string;
            cityName?: string;
            role?: 'USER' | 'MODERATOR' | 'ADMIN';
            level?: number;
            subscriptionActive?: boolean;
            createdAt?: string;
          }) => ({
            id: String(item.id ?? ''),
            name: item.displayName ?? 'Utente',
            email: item.email ?? '',
            cityName: item.cityName,
            role: item.role ?? 'USER',
            level: item.level ?? 1,
            isSubscribed: Boolean(item.subscriptionActive),
            createdAt: item.createdAt,
          }))
        : [];
      setUsers(mapped);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin || user?.is_city_manager) {
      queueMicrotask(() => { void fetchData(); });
    }
  }, [user?.is_admin, user?.is_city_manager]);

  const handleRoleChange = async (target: UserItem, role: 'USER' | 'MODERATOR' | 'ADMIN') => {
    if (!user?.is_admin || target.role === role) return;
    setUpdatingRoleId(target.id);
    try {
      await api.patch(`/admin/users/${target.id}/role`, { role });
      await fetchData();
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleDelete = async (target: UserItem) => {
    if (!window.confirm(`Eliminare l'utente ${target.name}? L'operazione è irreversibile.`)) return;
    setDeletingId(target.id);
    try {
      await api.delete(`/admin/users/${target.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
    } catch {
      window.alert('Impossibile eliminare questo utente.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleSubscription = async (target: UserItem) => {
    if (!user?.is_admin) return;
    const action = target.isSubscribed ? 'deactivate' : 'activate';
    const msg = target.isSubscribed
      ? `Revocare l'abbonamento di ${target.name}?`
      : `Attivare l'abbonamento di ${target.name} per 30 giorni?`;
    if (!window.confirm(msg)) return;
    setTogglingSubId(target.id);
    try {
      if (target.isSubscribed) {
        await api.post(`/admin/users/${target.id}/deactivate-subscription`);
      } else {
        await api.post(`/admin/users/${target.id}/activate-subscription?durationDays=30`);
      }
      await fetchData();
    } catch {
      window.alert(`Impossibile ${action === 'deactivate' ? 'revocare' : 'attivare'} l'abbonamento.`);
    } finally {
      setTogglingSubId(null);
    }
  };

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.cityName ?? '').toLowerCase().includes(q)
    );
  });

  if (!user?.is_admin && !user?.is_city_manager) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-text-secondary">Accesso riservato.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-20 md:pb-6">
      <AdminHeader title="Gestione utenti" subtitle={`${users.length} utenti registrati`} />

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5">
        <IoSearch size={18} className="shrink-0 text-text-muted" />
        <input
          type="text"
          placeholder="Cerca per nome, email o città..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-text-muted hover:text-text-primary">
            Cancella
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-8 text-center text-sm text-text-secondary">
          {search ? 'Nessun utente trovato per questa ricerca.' : 'Nessun utente registrato.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-background-card p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-text-primary">{item.name}</h2>
                    {item.role === 'ADMIN' && (
                      <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">Admin</span>
                    )}
                    {item.role === 'MODERATOR' && (
                      <span className="rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">City Manager</span>
                    )}
                    {item.isSubscribed && (
                      <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-xs font-medium text-violet-400">Abbonato</span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">{item.email}</p>
                  <p className="text-xs text-text-muted">
                    {item.cityName ? `Città: ${item.cityName}` : 'Nessuna città'}
                    {' · '}Livello {item.level}
                    {item.createdAt && (
                      <> · iscritto il {format(new Date(item.createdAt), 'dd MMM yyyy', { locale: it })}</>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Cambio ruolo */}
                  {user?.is_admin && (
                    <select
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary disabled:opacity-50"
                      value={item.role}
                      disabled={updatingRoleId === item.id}
                      onChange={(e) => void handleRoleChange(item, e.target.value as 'USER' | 'MODERATOR' | 'ADMIN')}
                    >
                      <option value="USER">Utente</option>
                      <option value="MODERATOR">City Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  )}

                  {/* Toggle abbonamento */}
                  {user?.is_admin && item.role !== 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => void handleToggleSubscription(item)}
                      disabled={togglingSubId === item.id}
                      title={item.isSubscribed ? 'Revoca abbonamento' : 'Attiva abbonamento 30gg'}
                      className={[
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:opacity-40',
                        item.isSubscribed
                          ? 'border-violet-400/40 text-violet-400 hover:bg-violet-400/10'
                          : 'border-success/40 text-success hover:bg-success/10',
                      ].join(' ')}
                    >
                      {togglingSubId === item.id
                        ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                        : item.isSubscribed
                          ? <IoCloseCircle size={16} />
                          : <IoCheckmarkCircle size={16} />}
                    </button>
                  )}

                  {/* Elimina utente */}
                  {user?.is_admin && item.role !== 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-error/40 text-error transition-colors hover:bg-error/10 disabled:opacity-40"
                    >
                      {deletingId === item.id
                        ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-error/30 border-t-error" />
                        : <IoTrash size={16} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
