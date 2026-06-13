'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IoArrowBack, IoCamera, IoCheckmarkCircle,
  IoKeypad, IoQrCodeOutline, IoWarning,
} from 'react-icons/io5';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface CheckInResult {
  code: string;
  alreadyCheckedIn: boolean;
  pointsAwarded: number;
  eventName?: string;
  message?: string;
}

export default function QrScannerPage() {
  const router = useRouter();
  const { refreshUser } = useAuthStore();

  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);

  // ─── Camera ─────────────────────────────────────────────────────────────────
  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    if (scanning) return;
    setError(null);
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          void stopCamera();
          void processCode(decodedText);
        },
        () => {}
      );
    } catch {
      setScanning(false);
      setError('Impossibile accedere alla fotocamera. Usa il codice manuale.');
    }
  };

  useEffect(() => {
    return () => { void stopCamera(); };
  }, []);

  useEffect(() => {
    if (mode === 'camera' && !result) void startCamera();
    else void stopCamera();
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Check-in ────────────────────────────────────────────────────────────────
  const processCode = async (code: string) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/checkin', { code: code.trim().toUpperCase() });
      const data = response.data as CheckInResult;
      setResult(data);
      // Aggiorna i punti nel profilo
      await refreshUser();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Codice non valido o errore di rete. Riprova.';
      setError(msg);
      // Se il check-in fallisce in camera mode, riavvia la fotocamera
      if (mode === 'camera') {
        setTimeout(() => { void startCamera(); }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) { setError('Inserisci un codice.'); return; }
    await processCode(manualCode);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setManualCode('');
    setMode('camera');
  };

  // ─── Schermata risultato ─────────────────────────────────────────────────────
  if (result) {
    const alreadyDone = result.alreadyCheckedIn;
    return (
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col items-center justify-center px-4 py-6">
        <div className={[
          'w-full rounded-2xl border p-8 text-center',
          alreadyDone
            ? 'border-warning/30 bg-warning/10'
            : 'border-accent/30 bg-accent/10',
        ].join(' ')}>

          <div className="mb-4 flex justify-center">
            {alreadyDone
              ? <IoWarning size={72} className="text-warning" />
              : <IoCheckmarkCircle size={72} className="text-accent" />}
          </div>

          <h2 className="text-2xl font-bold text-text-primary">
            {alreadyDone ? 'Già effettuato' : 'Check-in riuscito!'}
          </h2>

          {result.eventName && (
            <p className="mt-2 font-medium text-text-secondary">{result.eventName}</p>
          )}

          {result.message && (
            <p className="mt-1 text-sm text-text-muted">{result.message}</p>
          )}

          {!alreadyDone && result.pointsAwarded > 0 && (
            <div className="mt-6">
              <p className="text-5xl font-black text-accent">+{result.pointsAwarded}</p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-accent">
                punti guadagnati
              </p>
            </div>
          )}

          {alreadyDone && (
            <p className="mt-4 text-sm text-text-muted">
              Hai già effettuato il check-in per questo evento. I punti si guadagnano una sola volta.
            </p>
          )}

          <Button
            title={alreadyDone ? 'Chiudi' : 'Fantastico!'}
            onPress={handleReset}
            className="mx-auto mt-8"
          />
        </div>
      </div>
    );
  }

  // ─── Schermata scanner ───────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-border bg-surface p-2 text-text-primary transition-colors hover:bg-surface-light"
        >
          <IoArrowBack size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Check-in evento</h1>
          <p className="text-sm text-text-secondary">
            Scansiona il QR code dell&apos;evento o inserisci il codice manualmente
          </p>
        </div>
      </div>

      {/* Istruzione */}
      <div className="mb-4 rounded-xl border border-border bg-background-card px-4 py-3 text-sm text-text-secondary">
        <p className="font-medium text-text-primary mb-0.5">Come funziona</p>
        Premi <strong>Partecipa</strong> sull&apos;evento, poi scansiona il QR code mostrato dall&apos;organizzatore per guadagnare i punti reward.
      </div>

      {/* Toggle */}
      <div className="mb-4 flex rounded-xl bg-surface p-1">
        <button
          type="button"
          onClick={() => setMode('camera')}
          className={['flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            mode === 'camera' ? 'bg-background-card text-accent' : 'text-text-secondary'].join(' ')}
        >
          <IoCamera size={18} /> Fotocamera
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={['flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            mode === 'manual' ? 'bg-background-card text-accent' : 'text-text-secondary'].join(' ')}
        >
          <IoKeypad size={18} /> Codice manuale
        </button>
      </div>

      {/* Errore */}
      {error && (
        <div className="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Modalità fotocamera */}
      {mode === 'camera' && (
        <div className="rounded-2xl border border-border bg-background-card p-4">
          <div className="mb-3 flex flex-col items-center text-center">
            <IoQrCodeOutline size={32} className="mb-2 text-accent" />
            <p className="text-sm text-text-secondary">
              Inquadra il QR code che l&apos;organizzatore mostra all&apos;evento
            </p>
          </div>
          <div id="qr-reader" className="overflow-hidden rounded-xl" style={{ width: '100%' }} />
          {loading && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-text-secondary">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
              Verifica in corso...
            </div>
          )}
          {scanning && !loading && (
            <p className="mt-3 text-center text-xs text-text-muted">
              Fotocamera attiva — avvicina il QR code
            </p>
          )}
          {!scanning && !loading && !error && (
            <div className="flex justify-center py-4">
              <span className="h-6 w-6 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
            </div>
          )}
        </div>
      )}

      {/* Modalità manuale */}
      {mode === 'manual' && (
        <div className="rounded-2xl border border-border bg-background-card p-6">
          <div className="mb-4 flex flex-col items-center text-center">
            <IoQrCodeOutline size={40} className="mb-2 text-accent" />
            <p className="text-sm text-text-secondary">
              Inserisci il codice stampato o mostrato dall&apos;organizzatore
            </p>
          </div>
          <Input
            label="Codice evento"
            placeholder="es. EVENT-ABC123DEF456"
            value={manualCode}
            onChange={(v) => setManualCode(v.toUpperCase())}
          />
          <Button
            title="Verifica codice"
            onPress={handleManualSubmit}
            loading={loading}
            className="mt-2 w-full"
          />
        </div>
      )}
    </div>
  );
}
