'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const PUBLIC_PATHS = ['/', '/login', '/register'];
const AUTH_PATHS = ['/login', '/register'];
const ADMIN_PATHS = ['/admin'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_PATHS.includes(pathname);
    const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));
    const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path));

    if (!isAuthenticated) {
      if (!isPublic && !isAuthPath) {
        router.replace('/');
      }
      return;
    }

    if (isAdminPath && !user?.is_admin && !user?.is_city_manager) {
      router.replace('/feed');
      return;
    }

    if (isAuthPath || pathname === '/') {
      router.replace('/feed');
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="h-10 w-10 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
