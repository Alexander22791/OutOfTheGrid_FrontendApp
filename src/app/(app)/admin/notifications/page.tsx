'use client';

import { IoNotifications } from 'react-icons/io5';
import { useAuthStore } from '@/store/authStore';
import { AdminHeader } from '@/components/AdminHeader';

export default function AdminNotificationsPage() {
  const { user } = useAuthStore();

  if (!user?.is_admin) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-text-secondary">Solo gli admin possono accedere a questa sezione.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-20 md:pb-6">
      <AdminHeader title="Notifiche" subtitle="Gestione notifiche di sistema." />
      <div className="rounded-xl border border-warning/40 bg-warning/10 p-5">
        <div className="mb-2 flex items-center gap-2 text-text-primary">
          <IoNotifications size={18} />
          <p className="font-semibold">Funzionalità in attesa backend</p>
        </div>
        <p className="text-sm text-text-secondary">
          Invio push e storico notifiche verranno riattivati quando saranno disponibili endpoint admin ufficiali.
        </p>
      </div>
    </div>
  );
}
