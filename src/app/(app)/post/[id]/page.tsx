'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  IoArrowBack, IoArrowUpCircle, IoArrowUpCircleOutline,
  IoChatbubbleOutline, IoClose, IoPencil, IoSend, IoTrashOutline,
} from 'react-icons/io5';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import api from '@/lib/api';
import { sanitizeText } from '@/lib/sanitize';
import { useAuthStore } from '@/store/authStore';
import { Comment, Post } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  GENERAL: '#8B949E', ANNOUNCEMENTS: '#F0A500', QUESTIONS: '#58A6FF',
  RESULTS: '#52B788', TRADE_MARKET: '#9C27B0', PROGETTI: '#E91E63',
  MERCATINO: '#FF6B35', AUTOSUFFICIENZA: '#4CAF50', EVENTI_LOCALI: '#2196F3',
  RICETTE: '#FF9800', ENERGIA: '#FFD700',
};

function isValidImageSrc(src: string | null | undefined): src is string {
  if (!src) return false;
  return src.startsWith('http://') || src.startsWith('https://') ||
    src.startsWith('data:image/') || src.startsWith('/');
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState('');

  const isAdmin = !!(user?.is_admin || user?.is_city_manager);

  const formatRelativeDate = (value?: string) =>
    value ? formatDistanceToNow(new Date(value), { addSuffix: true, locale: it }) : '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, commentsRes] = await Promise.all([
          api.get('/posts?page=0&size=100'),
          api.get(`/posts/${id}/comments`),
        ]);

        const raw = Array.isArray(postsRes.data)
          ? postsRes.data.find((item: { id: string | number }) => String(item.id) === String(id))
          : null;

        if (raw) {
          setPost({
            id: raw.id,
            title: raw.title,
            content: raw.content ?? '',
            category: String(raw.category ?? '').toUpperCase(),
            categoryName: raw.categoryName,
            author_name: raw.authorName,
            created_at: raw.createdAt,
            createdAt: raw.createdAt,
            imageUrl: raw.imageUrl ?? undefined,
            image: raw.imageUrl ?? undefined,
            upvotes: Array.from({ length: Number(raw.likesCount ?? 0) }, (_, i) => `like-${i}`),
            comment_count: raw.commentCount ?? 0,
          });
        }

        const mappedComments: Comment[] = Array.isArray(commentsRes.data)
          ? commentsRes.data.map((c: { id: string | number; postId?: string | number; content?: string; authorName?: string; createdAt?: string; }) => ({
              id: c.id, postId: c.postId, content: c.content ?? '',
              author_name: c.authorName, created_at: c.createdAt, createdAt: c.createdAt,
            }))
          : [];

        setComments(mappedComments);
      } catch {
        alert('Impossibile caricare il post');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [id]);

  const handleUpvote = async () => {
    if (!post) return;
    try {
      await api.post(`/posts/${post.id}/upvote`);
      setPost((prev) => prev ? {
        ...prev,
        upvotes: prev.upvotes?.length
          ? prev.upvotes.filter((u) => u !== String(user?.id))
          : [...(prev.upvotes ?? []), String(user?.id)],
      } : prev);
    } catch {}
  };

  const handleSubmitComment = async () => {
    const clean = sanitizeText(newComment.trim());
    if (!clean) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${id}/comments`, { content: clean });
      setComments((prev) => [...prev, res.data as Comment]);
      setNewComment('');
      if (post) setPost({ ...post, comment_count: (post.comment_count ?? 0) + 1 });
    } catch {
      alert('Impossibile inviare il commento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Eliminare questo post?')) return;
    try { await api.delete(`/posts/${id}`); router.back(); }
    catch { alert('Impossibile eliminare il post'); }
  };

  const handleSaveEdit = async () => {
    if (!post) return;
    const clean = sanitizeText(editContent.trim());
    if (!clean) return;
    try {
      const res = await api.patch(`/posts/${id}`, { content: clean });
      setPost({ ...post, content: (res.data as Post).content });
      setShowEditModal(false);
    } catch { alert('Impossibile modificare il post'); }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
      </div>
    );
  }

  if (!post) return null;

  const upvotes = post.upvotes ?? [];
  const hasUpvoted = upvotes.includes(String(user?.id ?? ''));
  const categoryType = post.category ?? 'GENERAL';
  const categoryLabel = (post as { categoryName?: string }).categoryName ?? categoryType;
  const catColor = CATEGORY_COLORS[categoryType] ?? '#8B949E';
  const authorName = post.author_name ?? 'Utente';
  const postImage = isValidImageSrc(post.imageUrl) ? post.imageUrl : isValidImageSrc(post.image) ? post.image : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-20 md:pb-4">
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-text-secondary transition-colors hover:text-text-primary">
        <IoArrowBack size={20} /> Indietro
      </button>

      <div className="mb-4 rounded-xl border border-border bg-background-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
              <span className="font-bold text-white">{authorName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-text-primary">{authorName}</p>
              <p className="text-xs text-text-muted">{formatRelativeDate(post.created_at ?? post.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: catColor, backgroundColor: `${catColor}20` }}>
              {categoryLabel}
            </span>
            {isAdmin && (
              <>
                <button onClick={() => { setEditContent(post.content); setShowEditModal(true); }} className="p-1 text-text-secondary hover:text-accent">
                  <IoPencil size={16} />
                </button>
                <button onClick={handleDeletePost} className="p-1 text-error"><IoTrashOutline size={16} /></button>
              </>
            )}
          </div>
        </div>

        {post.title && <h1 className="mb-2 text-lg font-bold text-text-primary">{post.title}</h1>}
        <p className="mb-4 text-base leading-relaxed text-text-primary">{post.content}</p>

        {postImage && (
          <div className="relative mb-4 h-56 w-full overflow-hidden rounded-lg">
            <Image src={postImage} alt="Immagine post" fill className="object-cover" />
          </div>
        )}

        <div className="flex items-center gap-4 border-t border-border pt-3">
          <button onClick={handleUpvote} className="flex items-center gap-1.5 text-sm">
            {hasUpvoted
              ? <IoArrowUpCircle size={24} className="text-accent" />
              : <IoArrowUpCircleOutline size={24} className="text-text-secondary" />}
            <span className={hasUpvoted ? 'text-accent' : 'text-text-secondary'}>{upvotes.length}</span>
          </button>
          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <IoChatbubbleOutline size={22} />
            <span>{post.comment_count ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        {comments.map((comment) => {
          const commentAuthor = comment.author_name ?? 'Utente';
          return (
            <div key={String(comment.id)} className="rounded-xl border border-border bg-background-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/70">
                  <span className="text-xs font-bold text-white">{commentAuthor.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{commentAuthor}</p>
                  <p className="text-xs text-text-muted">{formatRelativeDate(comment.created_at ?? comment.createdAt)}</p>
                </div>
              </div>
              <p className="text-sm text-text-primary">{comment.content}</p>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-20 flex gap-2 bg-background pt-2 md:bottom-4">
        <input
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:ring-2 focus:ring-accent"
          placeholder="Scrivi un commento..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSubmitComment()}
        />
        <button onClick={() => void handleSubmitComment()} disabled={submitting || !newComment.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent transition-colors hover:bg-accent-light disabled:opacity-50">
          {submitting
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            : <IoSend size={18} className="text-white" />}
        </button>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-background-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-bold text-text-primary">Modifica Post</h2>
              <button onClick={() => setShowEditModal(false)}><IoClose size={22} className="text-text-secondary" /></button>
            </div>
            <div className="p-5">
              <textarea className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:ring-2 focus:ring-accent"
                rows={6} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              <button onClick={() => void handleSaveEdit()} className="mt-3 w-full rounded-lg bg-accent py-3 font-medium text-white transition-colors hover:bg-accent-light">
                Salva modifiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
