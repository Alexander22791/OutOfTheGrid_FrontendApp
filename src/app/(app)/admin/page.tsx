'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IoCalendar, IoCard, IoCart, IoChatbox, IoChatbubbles, IoLocation, IoLockClosed,
  IoNotifications, IoPeople, IoPricetags, IoSettings, IoShield,
  IoSchool, IoTrophy, IoCheckmarkCircle,
} from 'react-icons/io5';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface CityStats { id: string; name: string; memberCount: number; }

interface DashboardData {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalCourses: number;
  activeSubscriptions: number;
  activeCities: CityStats[];
}

interface ActionItem {
  key: string;
  label: string;
  href?: string;
  colorClass: string;
  icon: typeof IoPeople;
  onClick?: () => void;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = !!user?.is_admin;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/admin/stats');
        const d = res.data;
        setDashboard({
          totalUsers: d.totalUsers ?? d.total_users ?? 0,
          totalPosts: d.totalPosts ?? d.total_posts ?? 0,
          totalComments: d.totalComments ?? d.total_comments ?? 0,
          totalCourses: d.totalCourses ?? d.total_courses ?? 0,
          activeSubscriptions: d.activeSubscriptions ?? d.active_subscriptions ?? 0,
          activeCities: d.activeCities ?? d.active_cities ?? [],
        });
      } catch {
        setDashboard({ totalUsers: 0, totalPosts: 0, totalComments: 0, totalCourses: 0, activeSubscriptions: 0, activeCities: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const actions = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [
      { key: 'users', label: 'Utenti', href: '/admin/users', colorClass: 'text-info bg-info/10', icon: IoPeople },
      { key: 'courses', label: 'Corsi', href: '/admin/courses', colorClass: 'text-success bg-success/10', icon: IoSchool },
      { key: 'events', label: 'Eventi', href: '/admin/events', colorClass: 'text-teal-400 bg-teal-400/10', icon: IoCalendar },
      { key: 'catalog', label: 'Catalogo', href: '/admin/catalog', colorClass: 'text-warning bg-warning/10', icon: IoCart },
      { key: 'settings', label: 'Impostazioni', href: '/admin/settings', colorClass: 'text-text-secondary bg-surface', icon: IoSettings },
    ];

    if (isAdmin) {
      items.splice(1, 0, { key: 'cities', label: 'Città', href: '/admin/cities', colorClass: 'text-accent bg-accent/10', icon: IoLocation });
      items.push(
        { key: 'categories', label: 'Categorie', href: '/admin/categories', colorClass: 'text-pink-400 bg-pink-400/10', icon: IoPricetags },
        { key: 'plans', label: 'Abbonamenti', href: '/admin/plans', colorClass: 'text-violet-400 bg-violet-400/10', icon: IoCard },
        { key: 'leaderboard', label: 'Classifica', href: '/leaderboard', colorClass: 'text-yellow-300 bg-yellow-400/10', icon: IoTrophy },
        { key: 'notifications', label: 'Notifiche', href: '/admin/notifications', colorClass: 'text-orange-300 bg-orange-400/10', icon: IoNotifications },
      );
    }

    return items;
  }, [isAdmin]);

  if (!user?.is_admin && !user?.is_city_manager) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <IoLockClosed size={64} className="text-error" />
        <h1 className="text-2xl font-bold text-error">Accesso negato</h1>
        <p className="text-text-secondary">Solo Admin o City Manager possono accedere.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-20 md:pb-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isAdmin ? 'Pannello Admin' : 'Pannello City Manager'}
          </h1>
          <p className="text-sm text-text-secondary">Bentornato, {user?.name || user?.displayName || 'utente'}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-sm text-accent">
          <IoShield size={16} />
          {isAdmin ? `${dashboard?.activeCities.length ?? 0} città attive` : 'Gestione locale'}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-background-card p-4">
          <IoPeople size={22} className="mb-2 text-info" />
          <p className="text-2xl font-bold text-text-primary">{dashboard?.totalUsers ?? 0}</p>
          <p className="text-xs text-text-secondary">Utenti</p>
        </div>
        <div className="rounded-xl border border-border bg-background-card p-4">
          <IoChatbubbles size={22} className="mb-2 text-accent" />
          <p className="text-2xl font-bold text-text-primary">{dashboard?.totalPosts ?? 0}</p>
          <p className="text-xs text-text-secondary">Post</p>
        </div>
        <div className="rounded-xl border border-border bg-background-card p-4">
          <IoChatbox size={22} className="mb-2 text-warning" />
          <p className="text-2xl font-bold text-text-primary">{dashboard?.totalComments ?? 0}</p>
          <p className="text-xs text-text-secondary">Commenti</p>
        </div>
        <div className="rounded-xl border border-border bg-background-card p-4">
          <IoSchool size={22} className="mb-2 text-success" />
          <p className="text-2xl font-bold text-text-primary">{dashboard?.totalCourses ?? 0}</p>
          <p className="text-xs text-text-secondary">Corsi</p>
        </div>
        <div className="rounded-xl border border-border bg-background-card p-4">
          <IoCheckmarkCircle size={22} className="mb-2 text-violet-400" />
          <p className="text-2xl font-bold text-text-primary">{dashboard?.activeSubscriptions ?? 0}</p>
          <p className="text-xs text-text-secondary">Abbonati</p>
        </div>
      </div>

      {/* Città attive */}
      {isAdmin && (dashboard?.activeCities.length ?? 0) > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-background-card p-4">
          <h2 className="mb-3 font-semibold text-text-primary">Città attive</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {dashboard?.activeCities.map((city) => (
              <div key={city.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                <div className="flex items-center gap-2">
                  <IoLocation size={14} className="text-accent" />
                  <p className="text-sm font-medium text-text-primary">{city.name}</p>
                </div>
                <span className="text-xs text-text-secondary">{city.memberCount} membri</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (dashboard?.activeCities.length ?? 0) === 0 && (
        <div className="mb-6 rounded-xl border border-border bg-background-card px-4 py-3 text-sm text-text-secondary">
          Nessuna città locale attiva. Crea una città e aggiungi utenti dalla sezione Città.
        </div>
      )}

      {/* Azioni */}
      <div className="mb-6">
        <h2 className="mb-3 font-semibold text-text-primary">Gestione</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.key} type="button"
                onClick={() => { if (action.onClick) action.onClick(); else if (action.href) router.push(action.href); }}
                className="rounded-xl border border-border bg-background-card p-4 text-left transition-colors hover:border-accent/50">
                <div className={`mb-3 inline-flex rounded-2xl p-3 ${action.colorClass}`}><Icon size={20} /></div>
                <p className="font-semibold text-text-primary">{action.label}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
