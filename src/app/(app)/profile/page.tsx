'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  IoCamera,
  IoCheckmarkCircle,
  IoCompass,
  IoLocation,
  IoLogOut,
  IoMedal,
  IoNotifications,
  IoPencil,
  IoPersonCircleOutline,
  IoQrCode,
  IoSettings,
  IoShield,
  IoStar,
} from 'react-icons/io5';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

const LEVEL_THRESHOLDS = [0, 150, 500, 1200, 3000];

function getXpForLevel(level: number): number {
  if (level <= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[level - 1] ?? 0;
  return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (level - LEVEL_THRESHOLDS.length) * 2000;
}

function getXpForNextLevel(level: number): number {
  if (level < LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[level] ?? 0;
  return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (level - LEVEL_THRESHOLDS.length + 1) * 2000;
}

const getLevelColor = (level: number): string => {
  if (level >= 8) return '#FFD700';
  if (level >= 5) return '#C0C0C0';
  if (level >= 3) return '#CD7F32';
  return '#1a9c90';
};

const getBadgeInfo = (badge: string) => {
  const map: Record<string, { name: string; color: string }> = {
    Seeder: { name: 'Seeder', color: '#1a9c90' },
    Cultivator: { name: 'Cultivator', color: '#58A6FF' },
    'Grid Master': { name: 'Grid Master', color: '#F0A500' },
  };
  return map[badge] ?? { name: badge, color: '#8B949E' };
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    if (window.confirm('Sei sicuro di voler uscire?')) {
      logout();
      router.replace('/');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const success = await updateProfile({ name, bio });
    setSaving(false);
    if (success) setIsEditing(false);
  };

  const handlePickImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Immagine troppo grande: massimo 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const success = await updateProfile({ avatar: reader.result as string });
      if (!success) alert("Impossibile aggiornare l'immagine profilo");
    };
    reader.readAsDataURL(file);
  };

  const handleSubscribe = async () => {
    setSubscriptionLoading(true);
    try {
      const { default: api } = await import('@/lib/api');
      await api.post('/subscriptions', { durationDays: 30 });
      await refreshUser();
      alert('Abbonamento attivato con successo');
    } catch { alert('Abbonamento non disponibile al momento'); }
    finally { setSubscriptionLoading(false); }
  };

  const handleUnsubscribe = async () => {
    if (!window.confirm('Sei sicuro di voler annullare il tuo abbonamento?')) return;
    setSubscriptionLoading(true);
    try {
      const { default: api } = await import('@/lib/api');
      await api.post('/subscriptions/unsubscribe');
      await refreshUser();
      alert('Abbonamento disattivato.');
    } catch { alert("Impossibile disattivare l'abbonamento al momento."); }
    finally { setSubscriptionLoading(false); }
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <IoPersonCircleOutline size={80} className="text-text-muted" />
        <p className="text-text-secondary">Non sei connesso</p>
        <Button title="Accedi" onPress={() => router.push('/login')} />
      </div>
    );
  }

  const safeLevel = user.level ?? 1;
  const safePoints = user.points ?? 0;
  const safeBadges = user.badges ?? [];
  const displayName = user.name || user.displayName || 'Utente';
  const isSubscribed = !!(user.is_subscribed || user.subscriptionActive);
  const cityName = user.home_city_name;

  const xpCurrent = getXpForLevel(safeLevel);
  const xpNext = getXpForNextLevel(safeLevel);
  const xpProgress = xpNext > xpCurrent
    ? Math.min(((safePoints - xpCurrent) / (xpNext - xpCurrent)) * 100, 100)
    : 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6">

      {/* Card profilo */}
      <div className="mb-4 rounded-xl border border-border bg-background-card p-6">
        <div className="mb-4 flex items-start gap-4">
          <div className="relative shrink-0">
            {user.avatar ? (
              <Image src={user.avatar} alt={displayName} width={80} height={80} className="rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent">
                <span className="text-2xl font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-accent">
              <IoCamera size={14} className="text-text-primary" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
          </div>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="space-y-1">
                <Input label="" placeholder="Nome" value={name} onChange={setName} />
                <Input label="" placeholder="Bio" value={bio} onChange={setBio} multiline rows={2} />
                <div className="flex gap-2">
                  <Button title="Salva" onPress={handleSaveProfile} loading={saving} size="sm" />
                  <Button title="Annulla" onPress={() => { setIsEditing(false); setName(displayName); setBio(user.bio ?? ''); }} variant="outline" size="sm" />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-1 flex items-center gap-2">
                  <h1 className="text-xl font-bold text-text-primary">{displayName}</h1>
                  <button type="button" onClick={() => setIsEditing(true)} className="text-text-muted hover:text-accent">
                    <IoPencil size={16} />
                  </button>
                </div>
                <p className="mb-1 text-sm text-text-secondary">{user.email}</p>
                {/* Città */}
                {cityName && (
                  <div className="mb-1 flex items-center gap-1.5">
                    <IoLocation size={13} className="shrink-0 text-accent" />
                    <p className="text-sm text-text-secondary">{cityName}</p>
                  </div>
                )}
                {user.bio && <p className="text-sm text-text-secondary">{user.bio}</p>}
              </>
            )}
          </div>
        </div>

        {/* Barra XP */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="rounded-full px-2 py-0.5 text-sm font-semibold" style={{ color: getLevelColor(safeLevel), backgroundColor: `${getLevelColor(safeLevel)}25` }}>
              Livello {safeLevel}
            </span>
            <span className="text-xs text-text-muted">{safePoints} / {xpNext} pt</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${xpProgress}%` }} />
          </div>
          {safeLevel < 5 && (
            <p className="mt-1 text-xs text-text-muted">
              {xpNext - safePoints} punti al livello {safeLevel + 1}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-surface p-3">
            <p className="text-lg font-bold text-text-primary">{safePoints}</p>
            <p className="text-xs text-text-muted">Punti</p>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-lg font-bold text-text-primary">{safeLevel}</p>
            <p className="text-xs text-text-muted">Livello</p>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-lg font-bold text-text-primary">{safeBadges.length}</p>
            <p className="text-xs text-text-muted">Badge</p>
          </div>
        </div>
      </div>

      {/* Badge */}
      {safeBadges.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-background-card p-4">
          <h2 className="mb-3 font-semibold text-text-primary">Badge</h2>
          <div className="flex flex-wrap gap-2">
            {safeBadges.map((badge) => {
              const info = getBadgeInfo(badge);
              return (
                <span key={badge} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium" style={{ color: info.color, backgroundColor: `${info.color}20` }}>
                  <IoMedal size={14} />{info.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Azioni */}
      <div className="mb-4 space-y-3 rounded-xl border border-border bg-background-card p-4">

        <button type="button" onClick={() => router.push('/notifications')} className="flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-light">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-accent/15 p-2 text-accent"><IoNotifications size={18} /></div>
            <div>
              <p className="font-medium text-text-primary">Notifiche</p>
              <p className="text-xs text-text-secondary">Aggiornamenti su richieste e attività</p>
            </div>
          </div>
        </button>

        <button type="button" onClick={() => router.push('/qr-scanner')} className="flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-light">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-info/15 p-2 text-info"><IoQrCode size={18} /></div>
            <div>
              <p className="font-medium text-text-primary">QR Check-in</p>
              <p className="text-xs text-text-secondary">Scansiona o inserisci un codice evento</p>
            </div>
          </div>
        </button>

        {!isSubscribed ? (
          <button type="button" onClick={handleSubscribe} disabled={subscriptionLoading} className="flex w-full items-center justify-between rounded-xl border border-accent bg-accent/10 px-4 py-3 text-left transition-colors hover:bg-accent/15 disabled:opacity-60">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-warning/15 p-2 text-warning"><IoStar size={18} /></div>
              <div>
                <p className="font-medium text-text-primary">Abbonati — 5,00 €/mese</p>
                <p className="text-xs text-text-secondary">Accesso completo senza limiti di livello</p>
              </div>
            </div>
            {subscriptionLoading && <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />}
          </button>
        ) : (
          <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-accent/20 p-2 text-accent"><IoCheckmarkCircle size={18} /></div>
                <div>
                  <p className="font-medium text-text-primary">Abbonamento attivo</p>
                  <p className="text-xs text-text-secondary">Accesso completo a tutti i contenuti</p>
                </div>
              </div>
              <button type="button" onClick={handleUnsubscribe} disabled={subscriptionLoading} className="text-sm font-medium text-error hover:underline disabled:opacity-60">
                {subscriptionLoading ? '...' : 'Annulla'}
              </button>
            </div>
          </div>
        )}

        {(user.is_admin || user.is_city_manager) && (
          <button type="button" onClick={() => router.push('/admin')} className="flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-light">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-accent/15 p-2 text-accent">
                {user.is_admin ? <IoSettings size={18} /> : <IoShield size={18} />}
              </div>
              <div>
                <p className="font-medium text-text-primary">{user.is_admin ? 'Pannello Admin' : 'Pannello City Manager'}</p>
                <p className="text-xs text-text-secondary">Gestisci community e contenuti</p>
              </div>
            </div>
          </button>
        )}
      </div>

      <button type="button" onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-error/40 py-3 font-medium text-error transition-colors hover:bg-error/10">
        <IoLogOut size={18} />
        Esci dall&apos;account
      </button>

      <p className="mt-4 text-center text-xs text-text-muted">
        Membro dal {new Date(user.createdAt).toLocaleDateString('it-IT')}
      </p>
    </div>
  );
}
