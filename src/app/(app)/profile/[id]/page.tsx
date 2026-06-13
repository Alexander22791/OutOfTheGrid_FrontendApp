'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { IoArrowBack, IoLocation, IoMedal, IoPersonRemoveOutline } from 'react-icons/io5';
import api from '@/lib/api';
import { User } from '@/types';

const getLevelColor = (level: number): string => {
  if (level >= 8) return '#FFD700';
  if (level >= 5) return '#C0C0C0';
  if (level >= 3) return '#CD7F32';
  return '#1a9c90';
};

const getBadgeInfo = (badge: string) => {
  const map: Record<string, { name: string; color: string }> = {
    newcomer: { name: 'Nuovo Arrivato', color: '#1a9c90' },
    contributor: { name: 'Contributore', color: '#58A6FF' },
    expert: { name: 'Esperto', color: '#F0A500' },
    legend: { name: 'Leggenda', color: '#FF6B6B' },
    active_poster: { name: 'Autore Attivo', color: '#1a9c90' },
    helpful: { name: 'Utile', color: '#E91E63' },
  };
  return map[badge] ?? { name: badge, color: '#8B949E' };
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/${id}`);
        setProfile(response.data);
      } catch {
        // handled in render
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <IoPersonRemoveOutline size={64} className="text-text-muted" />
        <p className="text-text-secondary">Profilo non trovato</p>
        <button onClick={() => router.back()} className="text-accent underline">
          Torna indietro
        </button>
      </div>
    );
  }

  const name = profile.name || profile.displayName || 'Utente';
  const level = profile.level ?? 1;
  const points = profile.points ?? 0;
  const badges = profile.badges ?? [];
  const postsCount = profile.posts_count ?? 0;
  const commentsCount = profile.comments_count ?? 0;
  const cityName = profile.home_city?.name;
  const levelColor = getLevelColor(level);

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-20 md:pb-4">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-secondary transition-colors hover:text-text-primary">
          <IoArrowBack size={24} />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Profilo</h1>
      </div>

      <div className="mb-4 flex flex-col items-center rounded-xl border border-border bg-background-card p-6 text-center">
        <div className="relative mb-4">
          <div className="rounded-full p-0.5" style={{ background: `conic-gradient(${levelColor}, ${levelColor}40, ${levelColor})` }}>
            {profile.avatar ? (
              <Image src={profile.avatar} alt={name} width={88} height={88} className="rounded-full border-2 border-background object-cover" />
            ) : (
              <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-background bg-accent">
                <span className="text-3xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: levelColor, color: '#000' }}>
            Lvl {level}
          </span>
        </div>

        <h2 className="text-xl font-bold text-text-primary">{name}</h2>

        {cityName && (
          <div className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
            <IoLocation size={14} />
            <span>{cityName}</span>
          </div>
        )}

        {profile.bio && <p className="mt-2 max-w-xs text-sm text-text-secondary">{profile.bio}</p>}
      </div>

      <div className="mb-4 rounded-xl border border-border bg-background-card p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-text-primary">{points}</p>
            <p className="text-xs text-text-muted">Punti</p>
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{postsCount}</p>
            <p className="text-xs text-text-muted">Post</p>
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{commentsCount}</p>
            <p className="text-xs text-text-muted">Commenti</p>
          </div>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="rounded-xl border border-border bg-background-card p-4">
          <h3 className="mb-3 font-semibold text-text-primary">Badge sbloccati</h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => {
              const info = getBadgeInfo(badge);
              return (
                <span
                  key={badge}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
                  style={{ color: info.color, backgroundColor: `${info.color}20` }}
                >
                  <IoMedal size={14} />
                  {info.name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
