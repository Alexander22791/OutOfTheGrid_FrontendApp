'use client';

import { useRouter } from 'next/navigation';
import { IoArrowBack } from 'react-icons/io5';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
}

export function AdminHeader({ title, subtitle, backHref = '/admin' }: AdminHeaderProps) {
  const router = useRouter();
  return (
    <div className="mb-6 flex items-center gap-3">
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-accent/50 hover:text-accent"
      >
        <IoArrowBack size={18} />
      </button>
      <div>
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
      </div>
    </div>
  );
}
