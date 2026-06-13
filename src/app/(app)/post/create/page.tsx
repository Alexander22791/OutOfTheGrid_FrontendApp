'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IoArrowBack, IoClose, IoImage } from 'react-icons/io5';
import api from '@/lib/api';
import { sanitizeText } from '@/lib/sanitize';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { DisclaimerModal, useDisclaimer } from '@/components/DisclaimerModal';

interface CategoryItem {
  id: number;
  type: string;
  name: string;
  protectedCategory: boolean;
  minLevelToWrite: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  GENERAL: '#8B949E', ANNOUNCEMENTS: '#F0A500', QUESTIONS: '#58A6FF',
  RESULTS: '#52B788', TRADE_MARKET: '#9C27B0', PROGETTI: '#E91E63',
  MERCATINO: '#FF6B35', AUTOSUFFICIENZA: '#4CAF50', EVENTI_LOCALI: '#2196F3',
  RICETTE: '#FF9800', ENERGIA: '#FFD700',
};

const MAX_IMAGE_SIZE_MB = 2;

export default function CreatePostPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { showDisclaimer, requireDisclaimer, handleAccept } = useDisclaimer();

  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const userLevel = user?.level ?? 1;
  const isSubscribed = user?.is_subscribed || user?.is_admin;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (Array.isArray(response.data)) {
          const cats: CategoryItem[] = response.data.map((c: CategoryItem) => ({
            id: c.id, type: c.type, name: c.name,
            protectedCategory: c.protectedCategory ?? false,
            minLevelToWrite: c.minLevelToWrite ?? 1,
          }));
          setCategories(cats);
          if (cats.length > 0) setSelectedType(cats[0].type);
        }
      } catch {}
    };
    void fetchCategories();
  }, []);

  const availableCategories = categories.filter((cat) => {
    if (isSubscribed) return true;
    if (cat.protectedCategory && userLevel < cat.minLevelToWrite) return false;
    return true;
  });

  const handlePickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(null);
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setImageError(`Immagine troppo grande: massimo ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setImageError('Formato non supportato. Usa JPG, PNG o WebP.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const doSubmit = async () => {
    const cleanContent = sanitizeText(content.trim());
    if (!cleanContent || cleanContent.length < 10) {
      alert('Il contenuto deve avere almeno 10 caratteri');
      return;
    }
    if (!selectedType) {
      alert('Seleziona una categoria');
      return;
    }
    setLoading(true);
    try {
      await api.post('/posts', {
        title: cleanContent.slice(0, 60),
        content: cleanContent,
        category: selectedType,
        imageUrl: imageBase64 ?? undefined,
      });
      router.back();
    } catch {
      alert('Impossibile creare il post');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    requireDisclaimer(() => { void doSubmit(); });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-20 md:pb-4">
      {showDisclaimer && <DisclaimerModal onAccept={handleAccept} />}

      <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-text-secondary transition-colors hover:text-text-primary">
        <IoArrowBack size={20} />
        Annulla
      </button>

      <h1 className="mb-6 text-2xl font-bold text-text-primary">Nuovo Post</h1>

      <div className="rounded-xl border border-border bg-background-card p-5">
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-text-secondary">Categoria</p>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((cat) => {
              const color = CATEGORY_COLORS[cat.type] ?? '#8B949E';
              const active = selectedType === cat.type;
              return (
                <button key={cat.type} onClick={() => setSelectedType(cat.type)}
                  className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
                  style={active
                    ? { backgroundColor: color, borderColor: color, color: '#fff' }
                    : { borderColor: '#30363D', color: '#8B949E' }}>
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          className="mb-4 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:ring-2 focus:ring-accent"
          rows={6}
          placeholder="Cosa vuoi condividere con la community?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {imageBase64 && (
          <div className="relative mb-4">
            <Image src={imageBase64} alt="Preview" width={600} height={300} className="h-48 w-full rounded-xl object-cover" />
            <button onClick={() => setImageBase64(null)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 hover:bg-black/80">
              <IoClose size={16} className="text-white" />
            </button>
          </div>
        )}

        {imageError && <p className="mb-3 text-sm text-error">{imageError}</p>}

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent">
            <IoImage size={22} />
            Aggiungi foto
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePickImage} />
          </label>
          <Button title="Pubblica" onPress={handleSubmit} loading={loading} disabled={content.trim().length < 10} className="ml-auto" />
        </div>
      </div>
    </div>
  );
}
