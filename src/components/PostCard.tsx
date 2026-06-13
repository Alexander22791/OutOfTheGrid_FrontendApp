'use client';

import Image from 'next/image';
import {
  IoArrowUpCircle, IoArrowUpCircleOutline,
  IoChatbubbleOutline, IoLockClosed, IoTrashOutline,
} from 'react-icons/io5';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Post } from '@/types';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  isAdmin?: boolean;
  isSubscribed?: boolean;
  onPress: () => void;
  onUpvote: () => void;
  onComment: () => void;
  onDelete?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  GENERAL: '#8B949E', ANNOUNCEMENTS: '#F0A500', QUESTIONS: '#58A6FF',
  RESULTS: '#52B788', TRADE_MARKET: '#9C27B0', PROGETTI: '#E91E63',
  MERCATINO: '#FF6B35', AUTOSUFFICIENZA: '#4CAF50', EVENTI_LOCALI: '#2196F3',
  RICETTE: '#FF9800', ENERGIA: '#FFD700',
};

function getCategoryColor(categoryType: string): string {
  return CATEGORY_COLORS[categoryType?.toUpperCase()] ?? '#8B949E';
}

function isValidImageSrc(src: string | null | undefined): src is string {
  if (!src) return false;
  return src.startsWith('http://') || src.startsWith('https://') ||
    src.startsWith('data:image/') || src.startsWith('/');
}

export function PostCard({
  post, currentUserId, isAdmin, isSubscribed = true,
  onPress, onUpvote, onComment, onDelete,
}: PostCardProps) {
  const categoryType = post.category ?? 'GENERAL';
  // Usa il nome italiano dal backend se disponibile, altrimenti il type
  const categoryLabel = (post as { categoryName?: string }).categoryName ?? categoryType;
  const upvotes = post.upvotes ?? [];
  const commentCount = post.comment_count ?? 0;
  const authorName = post.author_name ?? 'Utente';
  const created = post.created_at ?? post.createdAt ?? new Date().toISOString();

  const rawImage = post.imageUrl ?? post.image ?? null;
  const postImage = isValidImageSrc(rawImage) ? rawImage : null;
  const authorAvatar = isValidImageSrc(post.author_avatar) ? post.author_avatar : null;

  const hasUpvoted = currentUserId ? upvotes.includes(currentUserId) : false;
  const catColor = getCategoryColor(categoryType);
  const timeAgo = formatDistanceToNow(new Date(created), { addSuffix: true, locale: it });

  return (
    <div
      className="relative mb-3 cursor-pointer rounded-xl border border-border bg-background-card p-4 transition-colors hover:border-border-light"
      onClick={onPress}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {authorAvatar ? (
            <Image src={authorAvatar} alt={authorName} width={36} height={36} className="rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
              <span className="text-sm font-bold text-white">{authorName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-text-primary">{authorName}</p>
            <p className="text-xs text-text-muted">{timeAgo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ color: catColor, backgroundColor: `${catColor}20` }}>
            {categoryLabel}
          </span>
          {isAdmin && onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-error hover:text-error/80">
              <IoTrashOutline size={18} />
            </button>
          )}
        </div>
      </div>

      {post.title && (
        <p className="mb-1 font-semibold text-text-primary">{post.title}</p>
      )}
      <p className="mb-3 line-clamp-5 text-sm text-text-primary">{post.content}</p>

      {postImage && (
        <div className="relative mb-3 h-48 w-full overflow-hidden rounded-lg">
          <Image src={postImage} alt="Immagine post" fill className="object-cover" />
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={(e) => { e.stopPropagation(); onUpvote(); }} className="flex items-center gap-1.5 text-sm">
          {hasUpvoted
            ? <IoArrowUpCircle size={24} className="text-accent" />
            : <IoArrowUpCircleOutline size={24} className="text-text-secondary" />}
          <span className={hasUpvoted ? 'text-accent' : 'text-text-secondary'}>{upvotes.length}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onComment(); }} className="flex items-center gap-1.5 text-sm text-text-secondary">
          <IoChatbubbleOutline size={22} />
          <span>{commentCount}</span>
        </button>
      </div>
    </div>
  );
}
