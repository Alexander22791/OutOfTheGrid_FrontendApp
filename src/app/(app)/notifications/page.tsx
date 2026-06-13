'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoArrowBack, IoCheckmarkDone, IoNotifications, IoTrash } from 'react-icons/io5';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import api from '@/lib/api';

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  JOIN_REQUEST: '#58A6FF',
  PRODUCT_PENDING: '#F0A500',
  PRODUCT_APPROVED: '#52B788',
  PRODUCT_REJECTED: '#FF6B6B',
  default: '#8B949E',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data ?? []);
        await api.patch('/notifications/read-all');
      } finally {
        setLoading(false);
      }
    };
    queueMicrotask(() => { void fetch(); });
  }, []);

  const handleDeleteOne = async (id: number) => {
    setDeletingId(id);
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      window.alert('Impossibile eliminare la notifica.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Eliminare tutte le notifiche?')) return;
    setDeletingAll(true);
    try {
      await api.delete('/notifications');
      setNotifications([]);
    } catch {
      window.alert('Impossibile eliminare le notifiche.');
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-20 md:pb-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary">
            <IoArrowBack size={22} />
          </button>
          <h1 className="text-xl font-bold text-text-primary">Notifiche</h1>
        </div>
        {notifications.length > 0 && (
          <button type="button" onClick={() => void handleDeleteAll()} disabled={deletingAll}
            className="flex items-center gap-1.5 rounded-lg border border-error/40 px-3 py-1.5 text-sm text-error transition-colors hover:bg-error/10 disabled:opacity-50">
            <IoTrash size={15} />
            {deletingAll ? 'Eliminazione...' : 'Elimina tutte'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-10 text-center">
          <IoNotifications size={48} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary">Nessuna notifica</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const color = TYPE_COLORS[n.type] ?? TYPE_COLORS['default'];
            return (
              <div key={n.id} className={['flex items-start gap-3 rounded-xl border px-4 py-3', !n.read ? 'border-accent/30 bg-accent/5' : 'border-border bg-background-card'].join(' ')}>
                <button type="button" onClick={() => n.actionUrl && router.push(n.actionUrl)} className="flex flex-1 items-start gap-3 text-left">
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-text-primary">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    </div>
                    <p className="mt-0.5 text-sm text-text-secondary">{n.message}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {format(new Date(n.createdAt), "dd MMM yyyy 'alle' HH:mm", { locale: it })}
                    </p>
                  </div>
                </button>
                <button type="button" onClick={() => void handleDeleteOne(n.id)} disabled={deletingId === n.id}
                  className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-40">
                  {deletingId === n.id
                    ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-error/30 border-t-error" />
                    : <IoTrash size={16} />}
                </button>
              </div>
            );
          })}
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-text-muted">
            <IoCheckmarkDone size={14} />
            Tutte le notifiche sono state lette
          </div>
        </div>
      )}
    </div>
  );
}
