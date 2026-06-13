import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import api, { setToken, removeToken, getToken } from '../lib/api';
import { User, AuthResponse } from '../types';

const normalizeUser = (raw: Partial<User> & Record<string, unknown>): User => {
  const now = new Date().toISOString();
  const role = String(raw.role ?? 'USER').toUpperCase() as User['role'];
  return {
    id: raw.id as string | number,
    email: String(raw.email ?? ''),
    name: (raw.displayName as string | undefined) ?? (raw.name as string | undefined),
    displayName: (raw.displayName as string | undefined) ?? (raw.name as string | undefined),
    bio: raw.bio as string | undefined,
    avatar: (raw.avatarUrl as string | undefined) ?? (raw.avatar as string | undefined),
    role,
    level: Number(raw.level ?? 1),
    points: Number(raw.totalPoints ?? raw.points ?? raw.monthlyPoints ?? 0),
    badges: (raw.badges as string[] | undefined) ?? [],
    is_admin: role === 'ADMIN',
    is_city_manager: role === 'MODERATOR',
    is_subscribed: Boolean(raw.subscriptionActive ?? raw.is_subscribed),
    subscriptionActive: Boolean(raw.subscriptionActive ?? raw.is_subscribed),
    home_city_name: (raw.cityName as string | undefined) ?? (raw.home_city_name as string | undefined),
    createdAt: (raw.createdAt as string | undefined) ?? now,
    updatedAt: (raw.updatedAt as string | undefined) ?? now,
  };
};

/**
 * Deposita il JWT in un cookie httpOnly tramite la route API Next.js.
 * Il cookie non è leggibile da JavaScript (protezione XSS).
 * Mantiene anche localStorage come fallback per l'interceptor Axios,
 * che gira lato client e non può leggere cookie httpOnly.
 */
async function storeTokenSecurely(token: string): Promise<void> {
  setToken(token); // localStorage — solo per Axios interceptor
  try {
    await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Se la route API non è disponibile (es. export statico), continua con localStorage
  }
}

async function clearTokenSecurely(): Promise<void> {
  removeToken(); // Rimuove da localStorage
  try {
    await fetch('/api/auth/set-cookie', { method: 'DELETE' });
  } catch {}
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: { name?: string; bio?: string; avatar?: string }) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<AuthResponse>('/api/auth/login', { email, password });
      await storeTokenSecurely(response.data.accessToken);
      const fetched = response.data.user ?? (await api.get<User>('/api/me')).data;
      const userData = normalizeUser(fetched as Partial<User> & Record<string, unknown>);
      set({ user: userData, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login fallito';
      set({ error: message, isLoading: false, isAuthenticated: false });
      return false;
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<AuthResponse>('/api/auth/register', {
        email,
        password,
        displayName,
      });
      await storeTokenSecurely(response.data.accessToken);
      const fetched = response.data.user ?? (await api.get<User>('/api/me')).data;
      const userData = normalizeUser(fetched as Partial<User> & Record<string, unknown>);
      set({ user: userData, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registrazione fallita';
      set({ error: message, isLoading: false, isAuthenticated: false });
      return false;
    }
  },

  logout: () => {
    void clearTokenSecurely();
    set({ user: null, isAuthenticated: false, error: null, isLoading: false });
  },

  checkAuth: async () => {
    const token = getToken();
    if (!token) { set({ user: null, isAuthenticated: false, isLoading: false }); return; }
    try {
      const decoded = jwtDecode<{ exp?: number }>(token);
      if (!decoded.exp || decoded.exp * 1000 < Date.now()) {
        void clearTokenSecurely();
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const response = await api.get<User>('/api/me');
      set({ user: normalizeUser(response.data as Partial<User> & Record<string, unknown>), isAuthenticated: true, isLoading: false });
    } catch {
      void clearTokenSecurely();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    try {
      const payload: Record<string, string> = {};
      if (data.name?.trim()) payload.displayName = data.name.trim();
      if (data.bio !== undefined) payload.bio = data.bio;
      if (data.avatar !== undefined) payload.avatarUrl = data.avatar;
      if (Object.keys(payload).length > 0) {
        const response = await api.patch<User>('/api/me', payload);
        set({ user: normalizeUser(response.data as Partial<User> & Record<string, unknown>) });
      }
      return true;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Aggiornamento fallito';
      set({ error: message });
      return false;
    }
  },

  refreshUser: async () => {
    try {
      const response = await api.get<User>('/api/me');
      set({ user: normalizeUser(response.data as Partial<User> & Record<string, unknown>) });
    } catch (error) {
      console.error('Errore durante il refresh utente:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
