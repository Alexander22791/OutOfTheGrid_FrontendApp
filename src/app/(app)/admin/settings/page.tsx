'use client';

import { useEffect, useState } from 'react';
import {
  IoCardOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline,
  IoKey, IoQrCodeOutline, IoSave, IoSettings, IoTrashOutline,
} from 'react-icons/io5';
import api, { getApiErrorMessage } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/store/authStore';
import { AdminHeader } from '@/components/AdminHeader';

interface SettingsResponse {
  platformName?: string; supportEmail?: string; maintenanceMode?: boolean;
  stripeEnabled?: boolean; stripePublicKey?: string; stripeConfigured?: boolean;
}
interface TwoFactorSetupResponse { secret: string; otpauth_url?: string; }

export default function AdminSettingsPage() {
  const { user, refreshUser, isLoading: authLoading } = useAuthStore();
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsApiAvailable, setSettingsApiAvailable] = useState(true);
  const [twoFactorApiAvailable, setTwoFactorApiAvailable] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingStripe, setSavingStripe] = useState(false);
  const [settingUpTwoFactor, setSettingUpTwoFactor] = useState(false);
  const [verifyingTwoFactor, setVerifyingTwoFactor] = useState(false);
  const [disablingTwoFactor, setDisablingTwoFactor] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [stripePublicKey, setStripePublicKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(Boolean(user?.is_2fa_enabled));
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorOtpAuthUrl, setTwoFactorOtpAuthUrl] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [disableTwoFactorCode, setDisableTwoFactorCode] = useState('');

  const canAccess = Boolean(user?.is_admin || user?.is_city_manager);

  const fetchSettings = async () => {
    setLoading(true); setSettingsError(null);
    try {
      const [sr, mr] = await Promise.allSettled([api.get<SettingsResponse>('/admin/settings'), api.get('/api/me')]);
      if (sr.status === 'fulfilled') { const p = sr.value.data ?? {}; setSettings(p); setPlatformName(p.platformName ?? ''); setSupportEmail(p.supportEmail ?? ''); setSettingsApiAvailable(true); }
      else { setSettingsApiAvailable(false); setSettings({}); setSettingsError('Endpoint impostazioni non ancora disponibile nel backend.'); }
      if (mr.status === 'fulfilled') setIsTwoFactorEnabled(Boolean(mr.value.data?.is_2fa_enabled));
    } catch { setSettingsApiAvailable(false); setSettingsError('Impossibile leggere le impostazioni dal backend.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!canAccess) { setLoading(false); return; }
    queueMicrotask(() => { void fetchSettings(); });
  }, [authLoading, canAccess]);

  const handlePasswordChange = async () => {
    if (!settingsApiAvailable) { window.alert('Endpoint non disponibile.'); return; }
    if (!currentPassword || !newPassword || !confirmPassword) { window.alert('Compila tutti i campi password.'); return; }
    if (newPassword.length < 8) { window.alert('La nuova password deve contenere almeno 8 caratteri.'); return; }
    if (newPassword !== confirmPassword) { window.alert('Le password non coincidono.'); return; }
    setChangingPassword(true);
    try { await api.put('/admin/settings/password', { currentPassword, newPassword }); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); await refreshUser(); window.alert('Password aggiornata.'); }
    catch (e: unknown) { window.alert(getApiErrorMessage(e, 'Errore cambio password.')); }
    finally { setChangingPassword(false); }
  };

  const handleSaveSettings = async () => {
    if (!settingsApiAvailable) { window.alert('Endpoint non disponibile.'); return; }
    setSavingSettings(true);
    try { await api.put('/admin/settings', { platformName: platformName.trim() || undefined, supportEmail: supportEmail.trim() || undefined }); await fetchSettings(); window.alert('Impostazioni salvate.'); }
    catch (e: unknown) { window.alert(getApiErrorMessage(e, 'Errore salvataggio.')); }
    finally { setSavingSettings(false); }
  };

  const handleSaveStripe = async () => {
    if (!settingsApiAvailable) { window.alert('Endpoint non disponibile.'); return; }
    if (!stripePublicKey || !stripeSecretKey) { window.alert('Inserisci entrambe le chiavi Stripe.'); return; }
    setSavingStripe(true);
    try { await api.put('/admin/settings/stripe', { publicKey: stripePublicKey, secretKey: stripeSecretKey }); setStripePublicKey(''); setStripeSecretKey(''); setShowStripeForm(false); await fetchSettings(); window.alert('Stripe aggiornato.'); }
    catch (e: unknown) { window.alert(getApiErrorMessage(e, 'Errore Stripe.')); }
    finally { setSavingStripe(false); }
  };

  const handleDeleteStripe = async () => {
    if (!settingsApiAvailable || !window.confirm('Eliminare configurazione Stripe?')) return;
    setSavingStripe(true);
    try { await api.delete('/admin/settings/stripe'); setShowStripeForm(false); await fetchSettings(); window.alert('Configurazione Stripe eliminata.'); }
    catch (e: unknown) { window.alert(getApiErrorMessage(e, 'Errore eliminazione Stripe.')); }
    finally { setSavingStripe(false); }
  };

  const handleSetupTwoFactor = async () => {
    setSettingUpTwoFactor(true);
    try { const r = await api.post<TwoFactorSetupResponse>('/auth/2fa/setup'); setTwoFactorSecret(r.data.secret); setTwoFactorOtpAuthUrl(r.data.otpauth_url ?? ''); setTwoFactorCode(''); setShowTwoFactorSetup(true); }
    catch (e: unknown) { setTwoFactorApiAvailable(false); window.alert(getApiErrorMessage(e, 'Errore attivazione 2FA.')); }
    finally { setSettingUpTwoFactor(false); }
  };

  const handleVerifyTwoFactor = async () => {
    if (!twoFactorCode) { window.alert('Inserisci il codice 2FA.'); return; }
    setVerifyingTwoFactor(true);
    try { await api.post('/auth/2fa/verify', { code: twoFactorCode }); await refreshUser(); setIsTwoFactorEnabled(true); setShowTwoFactorSetup(false); setTwoFactorSecret(''); setTwoFactorOtpAuthUrl(''); setTwoFactorCode(''); window.alert('2FA attivato.'); }
    catch (e: unknown) { window.alert(getApiErrorMessage(e, 'Codice 2FA non valido.')); }
    finally { setVerifyingTwoFactor(false); }
  };

  const handleDisableTwoFactor = async () => {
    if (!disableTwoFactorCode) { window.alert('Inserisci il codice 2FA.'); return; }
    setDisablingTwoFactor(true);
    try { await api.post('/auth/2fa/disable', { code: disableTwoFactorCode }); await refreshUser(); setIsTwoFactorEnabled(false); setDisableTwoFactorCode(''); window.alert('2FA disattivato.'); }
    catch (e: unknown) { window.alert(getApiErrorMessage(e, 'Codice 2FA non valido.')); }
    finally { setDisablingTwoFactor(false); }
  };

  if (!canAccess) return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-text-secondary">Solo admin e city manager possono accedere.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-20 md:pb-6">
      <AdminHeader title="Impostazioni" subtitle="Gestisci credenziali, sicurezza e configurazioni." />

      {settingsError && <div className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-text-primary">{settingsError}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" /></div>
      ) : (
        <div className="space-y-6">
          {/* Password */}
          <div className="rounded-xl border border-border bg-background-card p-5">
            <div className="mb-4 flex items-center gap-2"><IoKey size={18} className="text-warning" /><h2 className="font-semibold text-text-primary">Cambio password</h2></div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Password attuale" type="password" value={currentPassword} onChange={setCurrentPassword} />
              <Input label="Nuova password" type="password" value={newPassword} onChange={setNewPassword} />
            </div>
            <Input label="Conferma nuova password" type="password" value={confirmPassword} onChange={setConfirmPassword} />
            <Button title="Aggiorna password" onPress={handlePasswordChange} loading={changingPassword} disabled={!settingsApiAvailable} />
          </div>

          {/* 2FA */}
          <div className="rounded-xl border border-border bg-background-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><IoQrCodeOutline size={18} className="text-accent" /><h2 className="font-semibold text-text-primary">Autenticazione a due fattori</h2></div>
              <span className="text-sm text-text-secondary">{isTwoFactorEnabled ? 'Attiva' : 'Disattivata'}</span>
            </div>
            {!isTwoFactorEnabled && !showTwoFactorSetup && <Button title="Attiva 2FA" onPress={handleSetupTwoFactor} loading={settingUpTwoFactor} disabled={!twoFactorApiAvailable} icon={<IoCheckmarkCircleOutline size={18} />} />}
            {!twoFactorApiAvailable && <p className="text-sm text-text-secondary">API 2FA non ancora disponibile sul backend.</p>}
            {showTwoFactorSetup && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-surface px-4 py-3"><p className="mb-1 text-xs uppercase tracking-wide text-text-muted">Secret</p><p className="break-all text-sm text-text-primary">{twoFactorSecret}</p></div>
                {twoFactorOtpAuthUrl && <div className="rounded-lg border border-border bg-surface px-4 py-3"><p className="mb-1 text-xs uppercase tracking-wide text-text-muted">OTP Auth URL</p><p className="break-all text-sm text-text-primary">{twoFactorOtpAuthUrl}</p></div>}
                <Input label="Codice 2FA" value={twoFactorCode} onChange={setTwoFactorCode} placeholder="123456" />
                <div className="flex flex-wrap gap-3">
                  <Button title="Conferma attivazione" onPress={handleVerifyTwoFactor} loading={verifyingTwoFactor} icon={<IoCheckmarkCircleOutline size={18} />} />
                  <Button title="Annulla" variant="outline" onPress={() => { setShowTwoFactorSetup(false); setTwoFactorSecret(''); setTwoFactorOtpAuthUrl(''); setTwoFactorCode(''); }} />
                </div>
              </div>
            )}
            {isTwoFactorEnabled && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-secondary">Inserisci il codice dalla tua app per disattivare.</div>
                <Input label="Codice 2FA" value={disableTwoFactorCode} onChange={setDisableTwoFactorCode} placeholder="123456" />
                <Button title="Disattiva 2FA" variant="outline" onPress={handleDisableTwoFactor} loading={disablingTwoFactor} icon={<IoCloseCircleOutline size={18} />} />
              </div>
            )}
          </div>

          {/* Impostazioni piattaforma — solo admin */}
          {user?.is_admin && (
            <>
              <div className="rounded-xl border border-border bg-background-card p-5">
                <div className="mb-4 flex items-center gap-2"><IoSettings size={18} className="text-accent" /><h2 className="font-semibold text-text-primary">Impostazioni piattaforma</h2></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Nome piattaforma" value={platformName} onChange={setPlatformName} placeholder="OutOfTheGrid" />
                  <Input label="Email supporto" value={supportEmail} onChange={setSupportEmail} placeholder="support@example.com" />
                </div>
                <p className="mb-4 text-xs text-text-muted">Modalità manutenzione: {settings?.maintenanceMode ? 'Attiva' : 'Disattiva'}</p>
                <Button title="Salva impostazioni" onPress={handleSaveSettings} loading={savingSettings} disabled={!settingsApiAvailable} icon={<IoSave size={18} />} />
              </div>

              <div className="rounded-xl border border-border bg-background-card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2"><IoCardOutline size={18} className="text-accent" /><h2 className="font-semibold text-text-primary">Configurazione Stripe</h2></div>
                  {!showStripeForm && <Button title="Modifica" variant="outline" onPress={() => setShowStripeForm(true)} />}
                </div>
                <div className="mb-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-secondary">
                  <p>Stripe configurato: <span className="text-text-primary">{settings?.stripeConfigured ? 'Sì' : 'No'}</span></p>
                  <p>Stripe attivo: <span className="text-text-primary">{settings?.stripeEnabled ? 'Sì' : 'No'}</span></p>
                  {settings?.stripePublicKey && <p className="mt-1 break-all text-xs text-text-muted">Public key: {settings.stripePublicKey}</p>}
                </div>
                {showStripeForm && (
                  <div className="space-y-4">
                    <Input label="Public key" value={stripePublicKey} onChange={setStripePublicKey} placeholder="pk_live_..." />
                    <Input label="Secret key" value={stripeSecretKey} onChange={setStripeSecretKey} placeholder="sk_live_..." />
                    <div className="flex flex-wrap gap-3">
                      <Button title="Salva chiavi Stripe" onPress={handleSaveStripe} loading={savingStripe} disabled={!settingsApiAvailable} icon={<IoSave size={18} />} />
                      <Button title="Elimina configurazione" variant="outline" onPress={handleDeleteStripe} loading={savingStripe} disabled={!settingsApiAvailable} icon={<IoTrashOutline size={18} />} />
                      <Button title="Annulla" variant="outline" onPress={() => { setShowStripeForm(false); setStripePublicKey(''); setStripeSecretKey(''); }} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
