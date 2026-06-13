'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoArrowBack, IoCamera, IoCheckmarkCircle, IoKeypad, IoQrCodeOutline } from 'react-icons/io5';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface CheckInResult {
  message?: string;
  eventName?: string;
  event_name?: string;
  pointsEarned?: number;
  points_earned?: number;
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Avvia la fotocamera
  const startCamera = async () => {
    if (scanning) return;
    setError(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // fotocamera posteriore
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Codice scansionato con successo
          void stopCamera();
          void processCode(decodedText);
        },
        () => {} // errori di frame — ignorati
      );
    } catch (err) {
      setScanning(false);
      setError('Impossibile accedere alla fotocamera. Prova il codice manuale.');
      console.error('Camera error:', err);
    }
  };

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

  // Ferma la fotocamera quando si cambia modalità o si smonta il componente
  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, []);

  useEffect(() => {
    if (mode === 'camera' && !result) {
      void startCamera();
    } else {
      void stopCamera();
    }
  }, [mode]);

  const processCode = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/checkin', { code: code.trim().toUpperCase() });
      setResult(response.data);
      await refreshUser();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string; detail?: string } } })
          ?.response?.data?.message ||
        (err as { response?: { data?: { message?: string; detail?: string } } })
          ?.response?.data?.detail ||
        'Codice non valido o già utilizzato';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      setError('Inserisci un codice.');
      return;
    }
    await processCode(manualCode);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setManualCode('');
    setMode('camera');
  };

  // Risultato check-in riuscito
  if (result) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-2xl flex-col items-center justify-center px-4 py-6">
        <div className="w-full rounded-2xl border border-accent/30 bg-accent/10 p-8 text-center">
          <div className="mb-4 flex justify-center text-accent">
            <IoCheckmarkCircle size={72} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">
            {result.message || 'Check-in completato!'}
          </h2>
          <p className="mt-2 text-text-secondary">
            {result.eventName ?? result.event_name ?? 'Evento community'}
          </p>
          <div className="mt-6">
            <p className="text-5xl font-black text-accent">
              +{result.pointsEarned ?? result.points_earned ?? 50}
            </p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-accent">
              punti guadagnati
            </p>
          </div>
          <Button title="Continua" onPress={handleReset} className="mx-auto mt-8" />
        </div>
      </div>
    );
  }

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
          <p className="text-sm text-text-secondary">Scansiona il QR o inserisci il codice</p>
        </div>
      </div>

      {/* Toggle fotocamera / manuale */}
      <div className="mb-4 flex rounded-xl bg-surface p-1">
        <button
          type="button"
          onClick={() => setMode('camera')}
          className={['flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', mode === 'camera' ? 'bg-background-card text-accent' : 'text-text-secondary'].join(' ')}
        >
          <IoCamera size={18} /> Fotocamera
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={['flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', mode === 'manual' ? 'bg-background-card text-accent' : 'text-text-secondary'].join(' ')}
        >
          <IoKeypad size={18} /> Codice manuale
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {mode === 'camera' ? (
        <div className="rounded-2xl border border-border bg-background-card p-4">
          <div className="mb-3 flex flex-col items-center text-center">
            <IoQrCodeOutline size={32} className="mb-2 text-accent" />
            <p className="text-sm text-text-secondary">
              Inquadra il QR code dell&apos;evento con la fotocamera
            </p>
          </div>
          {/* Container della fotocamera — html5-qrcode lo usa per renderizzare */}
          <div
            id="qr-reader"
            ref={containerRef}
            className="overflow-hidden rounded-xl"
            style={{ width: '100%' }}
          />
          {scanning && (
            <p className="mt-3 text-center text-xs text-text-muted">
              Fotocamera attiva — avvicina il QR code al centro
            </p>
          )}
          {!scanning && !error && (
            <div className="flex justify-center py-4">
              <span className="h-6 w-6 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-background-card p-6">
          <div className="mb-4 flex flex-col items-center text-center">
            <IoQrCodeOutline size={40} className="mb-2 text-accent" />
            <p className="text-sm text-text-secondary">
              Inserisci il codice stampato sull&apos;evento
            </p>
          </div>
          <Input
            label="Codice evento"
            placeholder="es. CAGLIARI-2026-01"
            value={manualCode}
            onChange={setManualCode}
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
