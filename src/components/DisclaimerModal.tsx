'use client';

import { useEffect, useState } from 'react';
import { IoClose, IoShieldCheckmark } from 'react-icons/io5';

const STORAGE_KEY = 'ootg_disclaimer_accepted';

const REGOLE = [
  'Rispetta tutti i membri della community — niente insulti, discriminazioni o linguaggio offensivo.',
  'Niente spam, pubblicità non autorizzata o contenuti fuori tema.',
  'Condividi solo informazioni veritiere e verificate.',
  'Proteggi la privacy altrui — non pubblicare dati personali di altri senza consenso.',
  'I contenuti commerciali vanno nella sezione apposita (Mercatino/Catalogo).',
  'Segnala contenuti inappropriati usando la funzione di segnalazione.',
  'Il mancato rispetto delle regole può portare alla sospensione dell\'account.',
];

interface DisclaimerModalProps {
  onAccept: () => void;
}

export function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background-card">
        <div className="border-b border-border px-6 py-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-full bg-accent/20 p-2 text-accent">
              <IoShieldCheckmark size={24} />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Regole della Community</h2>
          </div>
          <p className="text-sm text-text-secondary">
            Prima di pubblicare, leggi e accetta le regole della nostra community.
          </p>
        </div>

        <div className="px-6 py-4">
          <ul className="space-y-3">
            {REGOLE.map((regola, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-primary">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                  {i + 1}
                </span>
                {regola}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onAccept}
            className="w-full rounded-xl bg-accent py-3 font-semibold text-white transition-colors hover:bg-accent-light"
          >
            Ho letto e accetto le regole
          </button>
          <p className="mt-2 text-center text-xs text-text-muted">
            Accettando le regole puoi iniziare a pubblicare nella community.
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook per gestire il disclaimer
export function useDisclaimer() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Controlla se già accettato
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      // Non mostrare subito — aspetta che l'utente premi "crea post"
    }
  }, []);

  const requireDisclaimer = (action: () => void) => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (accepted) {
      action();
    } else {
      setPendingAction(() => action);
      setShowDisclaimer(true);
    }
  };

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowDisclaimer(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  return { showDisclaimer, requireDisclaimer, handleAccept };
}
