'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BottomTabBar } from '@/components/BottomTabBar';
import {
  IoCalendar, IoCube, IoNewspaper, IoNewspaperOutline,
  IoNotifications, IoPerson, IoSchool, IoTrophy,
} from 'react-icons/io5';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const tabs = [
  { href: '/feed', label: 'Feed', icon: IoNewspaper },
  { href: '/catalog', label: 'Catalogo', icon: IoCube },
  { href: '/classroom', label: 'Corsi', icon: IoSchool },
  { href: '/events', label: 'Eventi', icon: IoCalendar },
  { href: '/leaderboard', label: 'Classifica', icon: IoTrophy },
  { href: '/news', label: 'News', icon: IoNewspaperOutline },
  { href: '/profile', label: 'Profilo', icon: IoPerson },
];

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

function NotificationBell() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setCount(Number(res.data.count ?? 0));
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data ?? []);
    } catch {}
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchCount();
    const interval = setInterval(() => void fetchCount(), 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await fetchNotifications();
      if (count > 0) {
        await api.patch('/notifications/read-all');
        setCount(0);
      }
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    setOpen(false);
    if (n.actionUrl) router.push(n.actionUrl);
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button type="button" onClick={() => void handleOpen()}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-border/50 hover:text-text-primary">
        <IoNotifications size={20} />
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border bg-background-card shadow-xl md:left-full md:right-auto md:top-0 md:ml-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-semibold text-text-primary">Notifiche</p>
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-accent hover:underline">
              Vedi tutte
            </Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-text-muted">Nessuna notifica</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <button key={n.id} type="button" onClick={() => handleNotificationClick(n)}
                  className={['flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-surface', !n.read ? 'bg-accent/5' : ''].join(' ')}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-text-primary">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                  </div>
                  <p className="text-xs text-text-secondary">{n.message}</p>
                  <p className="text-xs text-text-muted">
                    {format(new Date(n.createdAt), "dd MMM 'alle' HH:mm", { locale: it })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileTopBar() {
  const { user } = useAuthStore();
  if (!user) return null;
  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-border bg-background-card px-4 py-2 md:hidden">
      <Image
        src="/icon.png"
        alt="OutofTheGrid"
        width={120}
        height={36}
        className="h-9 w-auto object-contain"
        priority
      />
      <NotificationBell />
    </header>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-60 flex-col border-r border-border bg-background-card md:flex">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <Image
          src="/icon.png"
          alt="OutofTheGrid"
          width={140}
          height={40}
          className="h-10 w-auto object-contain"
          priority
        />
        <NotificationBell />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href}
              className={['flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors', active ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:bg-border/50 hover:text-text-primary'].join(' ')}>
              <Icon size={20} />{label}
            </Link>
          );
        })}
        {(user?.is_admin || user?.is_city_manager) && (
          <>
            <div className="my-2 border-t border-border" />
            <Link href="/admin" className={['flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors', pathname.startsWith('/admin') ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:bg-border/50 hover:text-text-primary'].join(' ')}>
              Admin
            </Link>
            <Link href="/admin/join-requests" className={['flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors', pathname === '/admin/join-requests' ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:bg-border/50 hover:text-text-primary'].join(' ')}>
              Richieste join
            </Link>
            {user?.is_admin && (
              <Link href="/admin/pending" className={['flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors', pathname === '/admin/pending' ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:bg-border/50 hover:text-text-primary'].join(' ')}>
                Contenuti pending
              </Link>
            )}
          </>
        )}
      </nav>
      <div className="border-t border-border px-6 py-4">
        <p className="text-xs text-text-muted">© 2025 OutofTheGrid</p>
      </div>
    </aside>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <MobileTopBar />
      <Sidebar />
      <div className="pb-20 pt-14 md:ml-60 md:pb-0 md:pt-0">
        {children}
      </div>
      <BottomTabBar />
    </div>
  );
}
