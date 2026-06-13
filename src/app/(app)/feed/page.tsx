'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoAdd, IoChevronDown, IoDiamond, IoEarth, IoCheckmarkCircle, IoList, IoLocation, IoMap, IoTime } from 'react-icons/io5';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useCommunityStore } from '@/store/communityStore';
import ItalyMap from '@/components/ItalyMap';
import { PostCard } from '@/components/PostCard';
import { CategoryBar } from '@/components/CategoryBar';
import { Post } from '@/types';

interface CategoryItem {
  id: number;
  type: string;
  name: string;
  icon?: string;
  minLevelToRead: number;
  minLevelToWrite: number;
  protectedCategory: boolean;
}

const NATIONAL_CITY_ID = '1';

export default function FeedPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { currentCommunityId, currentCommunityName, cities, fetchCities, setCurrentCommunity, joinCommunity, requestJoinCommunity, pendingRequestCityId } = useCommunityStore();

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [modalView, setModalView] = useState<'map' | 'list'>('map');
  const [requestingCityId, setRequestingCityId] = useState<string | null>(null);
  const lastLoadedKeyRef = useRef<string>('');

  const isSubscribed = !!(user?.is_subscribed || user?.is_admin);
  const isElevated = !!(user?.is_admin || user?.is_city_manager);
  const userLevel = user?.level ?? 1;
  const selectedCat = categories.find((c) => c.type === selectedCategory);
  const isPremiumLocked = selectedCat
    ? selectedCat.protectedCategory && !isSubscribed && userLevel < selectedCat.minLevelToRead
    : false;

  const handleCategorySelect = useCallback((type: string) => {
    setSelectedCategory(type);
  }, []);

  // Carica categorie SOLO dopo che l'utente è autenticato e caricato
  useEffect(() => {
    // Aspetta che l'autenticazione sia risolta
    if (isLoading) return;
    if (!isAuthenticated) return;
    // Carica categorie una sola volta
    if (categoriesLoaded) return;

    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (Array.isArray(res.data)) {
          const cats: CategoryItem[] = res.data.map((c: CategoryItem) => ({
            id: c.id, type: c.type, name: c.name, icon: c.icon,
            minLevelToRead: c.minLevelToRead ?? 1,
            minLevelToWrite: c.minLevelToWrite ?? 1,
            protectedCategory: c.protectedCategory ?? false,
          }));
          setCategories(cats);
          setCategoriesLoaded(true);

          // Ora user è garantito caricato — calcola la categoria di default corretta
          const userIsAdmin = !!(user?.is_admin || user?.is_city_manager);
          const userIsSub = !!(user?.is_subscribed || user?.is_admin);
          const level = user?.level ?? 1;

          if (userIsAdmin) {
            setSelectedCategory('all');
          } else if (cats.length > 0) {
            // Prima categoria accessibile (non bloccata per questo utente)
            const first = cats.find((c) => !c.protectedCategory || userIsSub || level >= c.minLevelToRead);
            setSelectedCategory(first?.type ?? cats[0].type);
          }
        }
      } catch {}
    };
    void fetchCategories();
  }, [isLoading, isAuthenticated, categoriesLoaded, user]);

  useEffect(() => {
    if (cities.length === 0) void fetchCities();
  }, [cities.length, fetchCities]);

  const fetchPosts = useCallback(async (force = false) => {
    if (!selectedCategory) return;
    const fetchKey = `${currentCommunityId}|${selectedCategory}`;
    if (!force && lastLoadedKeyRef.current === fetchKey) return;
    lastLoadedKeyRef.current = fetchKey;
    setLoadingPosts(true);
    try {
      const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const postsRes = await api.get(`/posts?page=0&size=20${categoryParam}`);
      const mappedPosts: Post[] = Array.isArray(postsRes.data)
        ? postsRes.data.map((post: {
            id: string | number; title?: string; content?: string;
            category?: string; categoryName?: string; authorName?: string;
            createdAt?: string; likesCount?: number; imageUrl?: string;
          }) => ({
            id: post.id,
            title: post.title,
            content: post.content ?? '',
            category: post.category?.toUpperCase(),
            categoryName: post.categoryName,
            author_name: post.authorName,
            created_at: post.createdAt,
            createdAt: post.createdAt,
            imageUrl: post.imageUrl ?? undefined,
            image: post.imageUrl ?? undefined,
            upvotes: Array.from({ length: Number(post.likesCount ?? 0) }, (_, i) => `like-${i}`),
          }))
        : [];
      setPosts(mappedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [currentCommunityId, selectedCategory]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (!selectedCategory) return;
    if (isPremiumLocked) { setLoadingPosts(false); return; }
    const timer = setTimeout(() => void fetchPosts(), 0);
    return () => clearTimeout(timer);
  }, [fetchPosts, isAuthenticated, isLoading, isPremiumLocked, router, selectedCategory]);

  const handleUpvote = async (postId: string | number) => {
    try { await api.post(`/posts/${postId}/upvote`); await fetchPosts(true); } catch {}
  };

  const handleDelete = async (postId: string | number) => {
    if (!window.confirm('Eliminare questo post?')) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)));
    } catch {}
  };

  const handleSelectCity = async (cityId: string, cityName: string) => {
    const backendCityId = cityId === 'national' ? NATIONAL_CITY_ID : cityId;
    if (isElevated || cityId === 'national') {
      const success = await joinCommunity(backendCityId);
      if (success) {
        if (cityId === 'national') setCurrentCommunity('national', 'Hub OutofTheGrid');
        setShowCommunityModal(false);
        lastLoadedKeyRef.current = '';
        void fetchPosts(true);
      }
      return;
    }
    setRequestingCityId(cityId);
    const result = await requestJoinCommunity(cityId);
    setRequestingCityId(null);
    if (result === 'requested') {
      window.alert(`Richiesta inviata per ${cityName}! Attendi l'approvazione.`);
      setShowCommunityModal(false);
    } else if (result === 'already_pending') {
      window.alert('Hai già una richiesta pendente per questa città.');
    } else {
      window.alert("Errore nell'invio della richiesta.");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 pb-24 md:px-6 md:pb-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-background-card p-6">
          <p className="text-text-secondary">Caricamento...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-background px-4 py-4 pb-24 md:px-6 md:pb-6">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => setShowCommunityModal(true)} className="mb-4 flex w-full items-center justify-between rounded-xl border border-border bg-background-card px-4 py-3 transition-colors hover:border-accent/50">
          <div className="flex items-center gap-2">
            <IoLocation size={16} className="text-accent" />
            <span className="text-sm font-medium text-text-primary">{currentCommunityName}</span>
          </div>
          <IoChevronDown size={16} className="text-text-secondary" />
        </button>

        <CategoryBar
          categories={categories}
          selected={selectedCategory}
          isSubscribed={isSubscribed}
          isElevated={isElevated}
          userLevel={userLevel}
          onSelect={handleCategorySelect}
        />

        {isPremiumLocked && (
          <div className="mb-4 rounded-xl border border-warning/30 bg-background-card p-8 text-center">
            <IoDiamond size={48} className="mx-auto mb-3 text-warning" />
            <p className="mb-1 text-lg font-bold text-text-primary">Contenuto Premium</p>
            <p className="text-sm text-text-secondary">
              Richiesto livello {selectedCat?.minLevelToRead} o abbonamento attivo
            </p>
          </div>
        )}

        {!isPremiumLocked && (
          loadingPosts
            ? <div className="flex justify-center py-12"><span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" /></div>
            : posts.length === 0
              ? <div className="py-12 text-center"><p className="text-text-muted">Nessun post trovato</p></div>
              : posts.map((post) => (
                  <PostCard key={String(post.id)} post={post} currentUserId={String(user?.id ?? '')}
                    isAdmin={isElevated} isSubscribed={isSubscribed}
                    onPress={() => router.push(`/post/${post.id}`)}
                    onUpvote={() => handleUpvote(post.id)}
                    onComment={() => router.push(`/post/${post.id}`)}
                    onDelete={() => handleDelete(post.id)} />
                ))
        )}

        <button onClick={() => router.push('/post/create')} className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-colors hover:bg-accent-light md:bottom-6 md:right-6">
          <IoAdd size={28} />
        </button>

        {showCommunityModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center" onClick={() => setShowCommunityModal(false)}>
            <div className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background-card" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-lg font-bold text-text-primary">Scegli Community</h2>
                <p className="mt-1 text-xs text-text-muted">
                  {isElevated ? 'Seleziona una community.' : "Richiedi l'adesione a una community locale."}
                </p>
              </div>
              <div className="p-4">
                <div className="mb-4 flex rounded-xl bg-surface p-1">
                  <button type="button" onClick={() => setModalView('map')} className={['flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm', modalView === 'map' ? 'bg-background-card text-accent' : 'text-text-secondary'].join(' ')}>
                    <IoMap size={16} /> Mappa
                  </button>
                  <button type="button" onClick={() => setModalView('list')} className={['flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm', modalView === 'list' ? 'bg-background-card text-accent' : 'text-text-secondary'].join(' ')}>
                    <IoList size={16} /> Lista
                  </button>
                </div>
                {modalView === 'map' ? (
                  <ItalyMap cities={cities} currentCommunityId={currentCommunityId} onSelectCommunity={(id, name) => void handleSelectCity(id, name)} />
                ) : (
                  <div className="space-y-2">
                    <button onClick={() => void handleSelectCity('national', 'Hub OutofTheGrid')} className={['flex w-full items-center gap-3 rounded-xl border px-4 py-3 transition-colors', currentCommunityId === 'national' ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'].join(' ')}>
                      <IoEarth size={18} className="text-accent" />
                      <div className="text-left"><p className="font-medium text-text-primary">Hub OutofTheGrid</p><p className="text-xs text-text-muted">Community nazionale</p></div>
                      {currentCommunityId === 'national' && <IoCheckmarkCircle size={18} className="ml-auto text-accent" />}
                    </button>
                    {cities.map((city) => {
                      const isPending = pendingRequestCityId === String(city.id);
                      const isRequesting = requestingCityId === String(city.id);
                      const isCurrent = currentCommunityId === String(city.id);
                      return (
                        <button key={String(city.id)} onClick={() => void handleSelectCity(String(city.id), city.name)} disabled={isRequesting} className={['flex w-full items-center gap-3 rounded-xl border px-4 py-3 transition-colors disabled:opacity-60', isCurrent ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'].join(' ')}>
                          <IoLocation size={18} className="text-text-secondary" />
                          <div className="min-w-0 flex-1 text-left">
                            <p className="font-medium text-text-primary">{city.name}</p>
                            {isPending && <p className="text-xs text-warning">In attesa di approvazione</p>}
                            {!isPending && !isElevated && <p className="text-xs text-text-muted">Tocca per richiedere l'adesione</p>}
                          </div>
                          {isCurrent && <IoCheckmarkCircle size={18} className="shrink-0 text-accent" />}
                          {isPending && <IoTime size={18} className="shrink-0 text-warning" />}
                          {isRequesting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
