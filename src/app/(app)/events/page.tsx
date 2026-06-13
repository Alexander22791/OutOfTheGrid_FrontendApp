'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IoAdd, IoCalendar, IoCheckmarkCircle, IoClose,
  IoDownload, IoLocation, IoPeople, IoQrCode, IoTrashOutline,
} from 'react-icons/io5';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useCommunityStore } from '@/store/communityStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface EventItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  attendees: number;           // conteggio dal backend
  reward_points?: number;
  qrCode?: string;
  isParticipating: boolean;    // dal backend — valore reale
}

const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`;
}

function isPastEvent(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d < new Date();
}

// ─── QR Modal ────────────────────────────────────────────────────────────────
function QrModal({ qrCode, title, onClose }: { qrCode: string; title: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQr = async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, qrCode, {
            width: 280,
            margin: 2,
            color: { dark: '#0d1117', light: '#ffffff' },
          });
        }
      } catch (err) {
        console.error('QR generation error:', err);
      }
    };
    void generateQr();
  }, [qrCode]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${qrCode}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background-card p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-left">
            <p className="font-bold text-text-primary">{title}</p>
            <p className="text-xs text-text-muted font-mono mt-0.5">{qrCode}</p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <IoClose size={22} />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <canvas ref={canvasRef} className="rounded-xl" />
        </div>

        <p className="mb-4 text-xs text-text-secondary">
          Mostra o stampa questo QR code all'evento. Gli utenti lo scansionano con il QR Scanner per guadagnare punti.
        </p>

        <button
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-light"
        >
          <IoDownload size={18} /> Scarica PNG
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const { user } = useAuthStore();
  const { currentCommunityId, syncUserCity } = useCommunityStore();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [qrEvent, setQrEvent] = useState<{ code: string; title: string } | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [rewardPoints, setRewardPoints] = useState('10');

  const canCreateEvents = user?.is_admin || user?.is_city_manager;

  const fetchEvents = useCallback(async () => {
    try {
      const response = await api.get('/events');
      const mapped: EventItem[] = Array.isArray(response.data)
        ? response.data.map((item: {
            id: string | number; title?: string; description?: string;
            startsAt?: string; rewardPoints?: number; qrCode?: string;
            participantCount?: number; isParticipating?: boolean;
          }) => {
            const startsAt = item.startsAt ? new Date(item.startsAt) : null;
            return {
              id: String(item.id),
              title: item.title ?? 'Evento',
              description: item.description,
              date: startsAt ? startsAt.toISOString().slice(0, 10) : '',
              time: startsAt
                ? `${String(startsAt.getHours()).padStart(2, '0')}:${String(startsAt.getMinutes()).padStart(2, '0')}`
                : undefined,
              attendees: item.participantCount ?? 0,
              reward_points: item.rewardPoints,
              qrCode: item.qrCode,
              isParticipating: item.isParticipating ?? false,
            };
          })
        : [];
      setEvents(mapped);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { syncUserCity(user); }, [syncUserCity, user]);
  useEffect(() => { queueMicrotask(() => { void fetchEvents(); }); }, [fetchEvents]);

  const filteredEvents = events.filter((e) =>
    filter === 'upcoming' ? !isPastEvent(e.date) : isPastEvent(e.date)
  );

  const handleCreateEvent = async () => {
    if (!title.trim() || !date.trim()) { alert('Titolo e data sono obbligatori'); return; }
    if (currentCommunityId === 'national' || !currentCommunityId) {
      alert('Seleziona una community locale dal feed prima di creare un evento');
      return;
    }
    const cityId = Number(currentCommunityId);
    if (!cityId || Number.isNaN(cityId)) { alert('Community locale non valida'); return; }
    setSaving(true);
    try {
      await api.post('/admin/events', {
        title, description: description || title,
        startsAt: new Date(`${date}T${time || '09:00'}:00`).toISOString(),
        cityId, rewardPoints: Number(rewardPoints || 10),
      });
      setShowCreateModal(false);
      setTitle(''); setDescription(''); setDate(''); setTime(''); setLocation(''); setRewardPoints('10');
      await fetchEvents();
    } catch { alert("Impossibile creare l'evento"); }
    finally { setSaving(false); }
  };

  const handleJoin = async (eventId: string) => {
    setActioningId(eventId);
    try {
      await api.post(`/events/${eventId}/join`);
      setEvents((prev) => prev.map((e) => e.id === eventId
        ? { ...e, isParticipating: true, attendees: e.attendees + 1 }
        : e));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? "Impossibile partecipare all'evento");
    } finally { setActioningId(null); }
  };

  const handleLeave = async (eventId: string) => {
    if (!window.confirm('Annullare la partecipazione a questo evento?')) return;
    setActioningId(eventId);
    try {
      await api.delete(`/events/${eventId}/leave`);
      setEvents((prev) => prev.map((e) => e.id === eventId
        ? { ...e, isParticipating: false, attendees: Math.max(0, e.attendees - 1) }
        : e));
    } catch {
      alert('Impossibile annullare la partecipazione');
    } finally { setActioningId(null); }
  };

  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!window.confirm(`Eliminare "${eventTitle}"?`)) return;
    try {
      await api.delete(`/admin/events/${eventId}`);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch { alert('Impossibile eliminare'); }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-24 md:pb-4">
      {qrEvent && (
        <QrModal qrCode={qrEvent.code} title={qrEvent.title} onClose={() => setQrEvent(null)} />
      )}

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Eventi</h1>
        {canCreateEvents && (
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light">
            <IoAdd size={18} /> Crea Evento
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {(['upcoming', 'past'] as const).map((item) => (
          <button key={item} onClick={() => setFilter(item)}
            className={['rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
              filter === item ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary'].join(' ')}>
            {item === 'upcoming' ? 'Prossimi' : 'Passati'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-12 text-center">
          <IoCalendar size={64} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary">Nessun evento trovato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const isPast = isPastEvent(event.date);
            const isActioning = actioningId === event.id;
            return (
              <div key={event.id}
                className={['rounded-xl border bg-background-card p-4 transition-colors',
                  isPast ? 'border-border opacity-60' : 'border-border hover:border-accent/30'].join(' ')}>

                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="flex-1 font-semibold text-text-primary">{event.title}</h3>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {event.isParticipating && <IoCheckmarkCircle size={18} className="text-accent" />}
                    {/* QR code — visibile solo ad admin/city manager */}
                    {canCreateEvents && event.qrCode && (
                      <button
                        onClick={() => setQrEvent({ code: event.qrCode!, title: event.title })}
                        className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
                        title="Mostra QR code">
                        <IoQrCode size={18} />
                      </button>
                    )}
                    {canCreateEvents && (
                      <button onClick={() => void handleDelete(event.id, event.title)}
                        className="rounded-lg p-1.5 text-error transition-colors hover:bg-error/10">
                        <IoTrashOutline size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {event.description && (
                  <p className="mb-2 text-sm text-text-secondary">{event.description}</p>
                )}

                <div className="mb-3 flex flex-wrap gap-3 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <IoCalendar size={13} />
                    {formatDate(event.date)}{event.time && ` — ${event.time}`}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1"><IoLocation size={13} />{event.location}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <IoPeople size={13} />{event.attendees} partecipanti
                  </span>
                  {!!event.reward_points && (
                    <span className="font-medium text-warning">+{event.reward_points} pt</span>
                  )}
                </div>

                {!isPast && (
                  <div className="flex gap-2">
                    {!event.isParticipating ? (
                      <button
                        onClick={() => void handleJoin(event.id)}
                        disabled={isActioning}
                        className="flex items-center gap-2 rounded-lg border border-accent bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-60">
                        {isActioning
                          ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                          : 'Partecipa'}
                      </button>
                    ) : (
                      <button
                        onClick={() => void handleLeave(event.id)}
                        disabled={isActioning}
                        className="flex items-center gap-2 rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:border-error hover:text-error disabled:opacity-60">
                        {isActioning
                          ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                          : 'Annulla partecipazione'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-bold text-text-primary">Crea Evento</h2>
                {(currentCommunityId === 'national' || !currentCommunityId) && (
                  <p className="mt-0.5 text-xs text-warning">⚠ Seleziona prima una city community dal feed</p>
                )}
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-text-secondary"><IoClose size={22} /></button>
            </div>
            <div className="p-5 space-y-1">
              <Input label="Titolo *" placeholder="Nome evento" value={title} onChange={setTitle} />
              <Input label="Descrizione" placeholder="Descrizione" value={description} onChange={setDescription} multiline rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Data *" placeholder="YYYY-MM-DD" value={date} onChange={setDate} />
                <Input label="Ora" placeholder="HH:MM" value={time} onChange={setTime} />
              </div>
              <Input label="Luogo" placeholder="Indirizzo o link" value={location} onChange={setLocation} />
              <Input label="Punti reward" placeholder="10" value={rewardPoints} onChange={setRewardPoints} type="number" />
              <div className="pt-2">
                <Button title="Crea Evento" onPress={() => void handleCreateEvent()} loading={saving} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
