import { create } from 'zustand';
import api from '@/lib/api';
import { setToken } from '@/lib/api';
import { City, User } from '@/types';

const NATIONAL_CITY_NAMES = ['nazionale', 'national', 'hub', 'italia', 'italy'];

function isNationalCity(name: string): boolean {
  return NATIONAL_CITY_NAMES.includes(name.toLowerCase().trim());
}

interface CommunityState {
  cities: City[];
  currentCommunityId: string;
  currentCommunityName: string;
  isLoading: boolean;
  pendingRequestCityId: string | null; // città per cui c'è già una richiesta pendente
  fetchCities: () => Promise<void>;
  setCurrentCommunity: (cityId: string, cityName: string) => void;
  syncUserCity: (user: User | null) => void;
  requestJoinCommunity: (cityId: string) => Promise<'requested' | 'already_pending' | 'error'>;
  joinCommunity: (cityId: string) => Promise<boolean>;
  leaveCommunity: (cityId: string) => Promise<boolean>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  cities: [],
  currentCommunityId: 'national',
  currentCommunityName: 'Hub OutofTheGrid',
  isLoading: false,
  pendingRequestCityId: null,

  fetchCities: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/cities');
      const cities: City[] = Array.isArray(response.data)
        ? response.data
            .filter((c: { id: string | number; name: string }) => !isNationalCity(c.name))
            .map((c: { id: string | number; name: string }) => ({
              id: String(c.id),
              name: c.name,
            }))
        : [];
      set({ cities, isLoading: false });
    } catch (error) {
      console.error('Error fetching cities:', error);
      set({ isLoading: false });
    }
  },

  setCurrentCommunity: (cityId, cityName) => {
    set({ currentCommunityId: cityId, currentCommunityName: cityName });
  },

  syncUserCity: (user) => {
    // Non cambia automaticamente — l'utente sceglie dal modal
  },

  // Nuova funzione: richiesta di adesione (non join diretto)
  requestJoinCommunity: async (cityId) => {
    try {
      await api.post(`/cities/${cityId}/request-join`);
      set({ pendingRequestCityId: cityId });
      return 'requested';
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) return 'already_pending';
      return 'error';
    }
  },

  // Usato solo internamente (es. admin che sposta un utente)
  joinCommunity: async (cityId) => {
    try {
      const response = await api.post<{ cityId: number; cityName: string; accessToken: string }>(
        `/cities/${cityId}/join`
      );
      if (response.data.accessToken) setToken(response.data.accessToken);
      set({
        currentCommunityId: String(response.data.cityId),
        currentCommunityName: `Community di ${response.data.cityName}`,
      });
      return true;
    } catch (error) {
      console.error('Error joining community:', error);
      return false;
    }
  },

  leaveCommunity: async (cityId) => {
    try {
      const response = await api.post<{ cityId: number; cityName: string; accessToken: string }>(
        `/cities/${cityId}/leave`
      );
      if (response.data.accessToken) setToken(response.data.accessToken);
      set({ currentCommunityId: 'national', currentCommunityName: 'Hub OutofTheGrid' });
      return true;
    } catch (error) {
      console.error('Error leaving community:', error);
      return false;
    }
  },
}));
