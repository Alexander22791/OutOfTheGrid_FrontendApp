// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  user?: User;
  userId?: number;
  cityId?: number;
  role?: 'USER' | 'MODERATOR' | 'ADMIN';
}

// ─── User ────────────────────────────────────────────────────────────────────
// Campi allineati a UserProfileResponse del backend:
// id, email, displayName, bio, avatarUrl, cityName, level,
// totalPoints, monthlyPoints, subscriptionActive, role, badges

export interface User {
  id: string | number;
  email: string;
  // frontend convenience aliases
  name?: string;           // alias di displayName
  displayName?: string;
  bio?: string;
  avatar?: string;         // alias di avatarUrl
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  level: number;
  points?: number;         // alias di totalPoints
  badges?: string[];
  // ruoli derivati (calcolati in normalizeUser)
  is_admin?: boolean;
  is_city_manager?: boolean;
  // città — il backend restituisce solo cityName (stringa)
  home_city_name?: string; // alias di cityName
  // subscription
  is_subscribed?: boolean;
  subscriptionActive?: boolean;
  subscription_expires?: string;
  // 2FA
  is_2fa_enabled?: boolean;
  // timestamp
  createdAt: string;
  updatedAt: string;
}

// ─── City ────────────────────────────────────────────────────────────────────
// Allineato a CityResponse del backend: { id, name }

export interface City {
  id: string | number;
  name: string;
  // campi opzionali usati solo lato frontend (mappa, UI)
  region?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  member_count?: number;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string | number;
  name?: string;
  slug?: string;
  icon?: string;
  color?: string;
  order?: number;
  is_active?: boolean;
  read_min_level?: number;
  read_roles?: string[];
  write_min_level?: number;
  write_roles?: string[];
  type: string;
  protectedCategory?: boolean;
  minLevelToRead?: number;
  minLevelToWrite?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Post ────────────────────────────────────────────────────────────────────
// Allineato a PostResponse del backend:
// id, title, content, imageUrl, category (CategoryType), authorName, createdAt, likesCount

export interface Post {
  id: string | number;
  title?: string;
  content: string;
  imageUrl?: string;       // campo backend
  image?: string;          // alias frontend (legacy localPostMedia)
  category?: string;
  author_name?: string;    // alias di authorName
  author_avatar?: string;
  upvotes?: string[];      // array fittizio costruito da likesCount
  comment_count?: number;
  createdAt?: string;
  created_at?: string;     // alias legacy
  updatedAt?: string;
}

export interface PostRequest {
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
}

// ─── Comment ─────────────────────────────────────────────────────────────────

export interface Comment {
  id: string | number;
  content: string;
  postId?: number | string;
  authorId?: number | string;
  author_name?: string;
  author_avatar?: string;
  upvotes?: string[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
}

// ─── Course ──────────────────────────────────────────────────────────────────
// Allineato a CourseResponse del backend:
// id, title, description, accessType, cityId, rewardPoints

export interface Course {
  id: string | number;
  title: string;
  description: string;
  accessType: 'FREE' | 'SUBSCRIPTION';
  cityId?: number;
  rewardPoints?: number;
  // campi solo frontend
  thumbnail?: string;
  image_url?: string;
  can_access?: boolean;
  modules?: Module[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Module {
  id: string;
  title: string;
  lessons?: Lesson[];
  order?: number;
}

export interface Lesson {
  id: string;
  title: string;
  duration?: string;
  description?: string;
  content_type?: 'video' | 'text' | 'image' | 'audio' | 'file';
  video_url?: string;
  content_text?: string;
  file_url?: string;
  completed?: boolean;
  order?: number;
}

export interface UserCourseProgress {
  id: number;
  userId: number;
  courseId: number;
  progressPercent: number;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Event ───────────────────────────────────────────────────────────────────

export interface Event {
  id: number;
  title: string;
  description: string;
  startsAt: string;
  rewardPoints: number;
  cityId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventParticipation {
  id: number;
  eventId: number;
  userId: number;
  status: 'JOINED' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
}

// ─── Gamification ────────────────────────────────────────────────────────────

export interface Badge {
  id: number;
  name: string;
  description: string;
  minPointsRequired: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserStats {
  id: number;
  userId: number;
  cityId: number;
  totalPoints: number;
  monthlyPoints: number;
  likesCount: number;
  postsCount: number;
  commentsCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaderboardEntry {
  id: number;
  userId: number;
  cityId: number;
  monthKey: string;
  points: number;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Subscription ────────────────────────────────────────────────────────────

export interface Subscription {
  id: number;
  userId: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  price: number;
  cityId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Coupon {
  id: number;
  code: string;
  discountPercent: number;
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
