'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoAlertCircle, IoArrowBack } from 'react-icons/io5';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!name) nextErrors.name = 'Nome richiesto';
    else if (name.length < 2) nextErrors.name = 'Nome troppo corto';
    if (!email) nextErrors.email = 'Email richiesta';
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = 'Email non valida';
    if (!password) nextErrors.password = 'Password richiesta';
    else if (password.length < 8) nextErrors.password = 'Minimo 8 caratteri';
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Le password non corrispondono';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;
    const success = await register(email, password, name);
    if (success) router.push('/feed');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-text-secondary transition-colors hover:text-text-primary"
        >
          <IoArrowBack size={20} />
          Indietro
        </button>

        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/icon.png"
            alt="OutofTheGrid"
            width={200}
            height={60}
            className="h-14 w-auto object-contain mb-6"
            priority
          />
          <h1 className="text-2xl font-bold text-text-primary">Crea Account</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Unisciti alla community OutofTheGrid
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Entrerai nell&apos;Hub Nazionale — potrai richiedere l&apos;accesso alla tua città dopo la registrazione.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-3">
            <IoAlertCircle size={20} className="shrink-0 text-error" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-background-card p-6">
          <Input label="Nome" placeholder="Il tuo nome" value={name} onChange={setName} error={errors.name} />
          <Input label="Email" placeholder="nome@email.com" value={email} onChange={setEmail} type="email" autoComplete="email" error={errors.email} />
          <Input label="Password" placeholder="Minimo 8 caratteri" value={password} onChange={setPassword} type="password" autoComplete="new-password" error={errors.password} />
          <Input label="Conferma Password" placeholder="Ripeti la password" value={confirmPassword} onChange={setConfirmPassword} type="password" autoComplete="new-password" error={errors.confirmPassword} />

          <Button title="Crea Account" onPress={handleRegister} loading={isLoading} className="mt-2 w-full" />

          <p className="mt-4 text-center text-sm text-text-secondary">
            Hai già un account?{' '}
            <button onClick={() => router.push('/login')} className="font-semibold text-accent hover:underline">
              Accedi
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
