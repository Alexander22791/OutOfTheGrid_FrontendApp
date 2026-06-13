'use client';

import { useEffect, useState } from 'react';
import { IoCheckmark, IoClose, IoPeople } from 'react-icons/io5';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AdminHeader } from '@/components/AdminHeader';

interface JoinRequest {
  id: number;
  userId: number;
  displayName: string;
  email: string;
  cityId: number;
  cityName: string;
  status: string;
  note?: string;
  createdAt: string;
}

export default function AdminJoinRequestsPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<number, string>>({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/join-requests');
      setRequests(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin || user?.is_city_manager) {
      queueMicrotask(() => { void fetchRequests(); });
    }
  }, [user?.is_admin, user?.is_city_manager]);

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      await api.post(`/admin/join-requests/${id}/approve`);
      await fetchRequests();
    } catch {
      window.alert('Errore durante l\'approvazione.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessing(id);
    try {
      await api.post(`/admin/join-requests/${id}/reject`, { note: rejectNote[id] ?? '' });
      await fetchRequests();
    } catch {
      window.alert('Errore durante il rifiuto.');
    } finally {
      setProcessing(null);
    }
  };

  if (!user?.is_admin && !user?.is_city_manager) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-text-secondary">Accesso non autorizzato.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-20 md:pb-6">
      <AdminHeader title="Richieste di adesione" subtitle="Approva o rifiuta le richieste di ingresso nelle community." />

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-8 text-center">
          <IoPeople size={40} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary">Nessuna richiesta pendente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="rounded-xl border border-border bg-background-card p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{req.displayName}</p>
                  <p className="text-sm text-text-secondary">{req.email}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Vuole unirsi a <span className="font-medium text-accent">{req.cityName}</span>
                  </p>
                  <p className="text-xs text-text-muted">
                    {format(new Date(req.createdAt), "dd MMM yyyy 'alle' HH:mm", { locale: it })}
                  </p>
                </div>
                <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                  {req.status}
                </span>
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Nota opzionale (visibile all'utente se rifiutato)"
                  value={rejectNote[req.id] ?? ''}
                  onChange={(e) => setRejectNote((prev) => ({ ...prev, [req.id]: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => void handleApprove(req.id)} disabled={processing === req.id}
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50">
                  <IoCheckmark size={16} /> Approva
                </button>
                <button type="button" onClick={() => void handleReject(req.id)} disabled={processing === req.id}
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
