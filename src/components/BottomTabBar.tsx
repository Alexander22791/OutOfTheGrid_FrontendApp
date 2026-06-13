'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IoCalendar,
  IoCube,
  IoNewspaper,
  IoNewspaperOutline,
  IoPerson,
  IoSchool,
  IoTrophy,
} from 'react-icons/io5';

const tabs = [
  { href: '/feed', label: 'Feed', icon: IoNewspaper },
  { href: '/catalog', label: 'Catalogo', icon: IoCube },
  { href: '/classroom', label: 'Corsi', icon: IoSchool },
  { href: '/events', label: 'Eventi', icon: IoCalendar },
  { href: '/leaderboard', label: 'Classifica', icon: IoTrophy },
  { href: '/news', label: 'News', icon: IoNewspaperOutline },
  { href: '/profile', label: 'Profilo', icon: IoPerson },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background-card md:hidden">
      <div className="grid grid-cols-7">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex flex-col items-center justify-center py-2 text-[10px] transition-colors',
                active ? 'text-accent' : 'text-text-muted',
              ].join(' ')}
            >
              <Icon size={20} />
              <span className="mt-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
