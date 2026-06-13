'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IoChatbubble, IoLocation, IoPeople, IoTrophy } from 'react-icons/io5';
import api from '@/lib/api';
import { User } from '@/types';

interface CityScore {
  cityId: number;
  cityName: string;
  totalPoints: number;
  postCount: number;
  memberCount: number;
  position: number;
}

interface LeaderboardEntry {
  userId: number;
  displayName: string;
  points: number;
  position: number;
}

const getLevelColor = (level: number): string => {
  if (level >= 8) return '#FFD700';
  if (level >= 5) return '#C0C0C0';
  if (level >= 3) return '#CD7F32';
  return '#1a9c90';
};

const RankIcon = ({ index }: { index: number }) => {
  if (index === 0) return <IoTrophy size={24} className="text-yellow-400" />;
  if (index === 1) return <IoTrophy size={24} className="text-gray-300" />;
  if (index === 2) return <IoTrophy size={24} style={{ color: '#CD7F32' }} />;
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-bold text-text-secondary">
      {index + 1}
    </span>
  );
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'cities'>('users');
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [cities, setCities] = useState<CityScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const [usersRes, citiesRes] = await Promise.allSettled([
          api.get('/leaderboard/monthly'),
          api.get('/leaderboard/cities'),
        ]);

        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)) {
          setUsers(usersRes.value.data.map((e: LeaderboardEntry) => ({
            userId: e.userId,
            displayName: e.displayName ?? 'Utente',
            points: e.points ?? 0,
            position: e.position ?? 0,
          })));
        }

        if (citiesRes.status === 'fulfilled' && Array.isArray(citiesRes.value.data)) {
          setCities(citiesRes.value.data);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchLeaderboard();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-24 md:pb-4">
      <h1 className="mb-4 text-2xl font-bold text-text-primary">Classifica</h1>

      <div className="mb-6 flex gap-2">
        {(['users', 'cities'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-secondary hover:border-accent/50',
            ].join(' ')}
          >
            {tab === 'users' ? 'Utenti' : 'Città'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
        </div>
      ) : (
        <div className="space-y-2">
          {activeTab === 'users' ? (
            users.length === 0 ? (
              <div className="rounded-xl border border-border bg-background-card px-4 py-8 text-center text-sm text-text-secondary">
                Nessun dato disponibile per questo mese.
              </div>
            ) : (
              users.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={[
                    'flex items-center gap-3 rounded-xl border px-4 py-3',
                    index < 3 ? 'border-accent/30 bg-accent/5' : 'border-border bg-background-card',
                  ].join(' ')}
                >
                  <RankIcon index={index} />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
                    <span className="text-sm font-bold text-white">
                      {(entry.displayName ?? 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text-primary">{entry.displayName}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-text-primary">{entry.points}</p>
                    <p className="text-xs text-text-muted">punti</p>
                  </div>
                </div>
              ))
            )
          ) : (
            cities.length === 0 ? (
              <div className="rounded-xl border border-border bg-background-card px-4 py-8 text-center text-sm text-text-secondary">
                Nessun dato disponibile per questo mese. Le community devono essere attive per apparire in classifica.
              </div>
            ) : (
              cities.map((city, index) => (
                <div
                  key={city.cityId}
                  className={[
                    'flex items-center gap-3 rounded-xl border px-4 py-3',
                    index < 3 ? 'border-accent/30 bg-accent/5' : 'border-border bg-background-card',
                  ].join(' ')}
                >
                  <RankIcon index={index} />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info/20">
                    <IoLocation size={22} className="text-info" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text-primary">{city.cityName}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <IoChatbubble size={11} /> {city.postCount} post
                      </span>
                      <span className="flex items-center gap-1">
                        <IoPeople size={11} /> {city.memberCount} membri
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-text-primary">{city.totalPoints}</p>
                    <p className="text-xs text-text-muted">punti</p>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      )}
    </div>
  );
}
