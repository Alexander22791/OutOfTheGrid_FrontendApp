'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { IoAlertCircle, IoArrowBack } from 'react-icons/io5';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const nextErrors: typeof errors = {};
        if (!email) nextErrors.email = 'Email richiesta';
        else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = 'Email non valida';
        if (!password) nextErrors.password = 'Password richiesta';
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        if (!validate()) return;
        const success = await login(email, password);
        if (success) {
            router.push('/feed');
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors"
                >
                    <IoArrowBack size={20} />
                    Indietro
                </button>

                <div className="flex flex-col items-center mb-8">
                    <Image
                        src="/icon.png"
                        alt="OutofTheGrid"
                        width={200}
                        height={60}
                        className="h-14 w-auto object-contain mb-6"
                        priority
                    />
                    <h1 className="text-2xl font-bold text-text-primary">Bentornato</h1>
                    <p className="text-text-secondary text-sm mt-1">Accedi al tuo account OutofTheGrid</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-error/10 border border-error/30 rounded-lg px-4 py-3 mb-6">
                        <IoAlertCircle size={20} className="text-error shrink-0" />
                        <p className="text-error text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-background-card rounded-xl border border-border p-6">
                    <Input
                        label="Email"
                        placeholder="nome@email.com"
                        value={email}
                        onChange={setEmail}
                        type="email"
                        autoComplete="email"
                        error={errors.email}
                    />
                    <Input
                        label="Password"
                        placeholder="La tua password"
                        value={password}
                        onChange={setPassword}
                        type="password"
                        autoComplete="current-password"
                        error={errors.password}
                    />

                    <Button title="Accedi" type="submit" onPress={() => undefined} loading={isLoading} className="w-full mt-2" />

                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-text-muted text-xs">oppure</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <p className="text-center text-text-secondary text-sm">
                        Non hai un account?{' '}
                        <button type="button" onClick={() => router.push('/register')} className="text-accent font-semibold hover:underline">
                            Registrati
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}
