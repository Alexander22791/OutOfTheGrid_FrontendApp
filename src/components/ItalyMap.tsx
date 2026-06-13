'use client';

import Image from 'next/image';
import { IoCheckmarkCircle, IoEarth, IoLocation, IoMap } from 'react-icons/io5';
import { City } from '@/types';

// Dimensioni display della mappa nel componente
const MAP_W = 320;
const MAP_H = 386; // mantiene il rapporto 507:612 → 320:386

// Bounding box geografico dell'immagine italy_map.jpg (507x612 px)
// Calibrato visivamente sulla mappa reale
const IMG_LON_MIN = 5.0;
const IMG_LON_MAX = 20.5;
const IMG_LAT_MAX = 48.2;
const IMG_LAT_MIN = 35.2;

function projectToMap(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - IMG_LON_MIN) / (IMG_LON_MAX - IMG_LON_MIN)) * MAP_W;
  const y = ((IMG_LAT_MAX - lat) / (IMG_LAT_MAX - IMG_LAT_MIN)) * MAP_H;
  return { x, y };
}

// Coordinate approssimative delle principali città italiane
// Usate come fallback se il backend non restituisce lat/lng
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // Nord
  'Milano': { lat: 45.47, lng: 9.19 },
  'Torino': { lat: 45.07, lng: 7.69 },
  'Venezia': { lat: 45.44, lng: 12.33 },
  'Genova': { lat: 44.41, lng: 8.93 },
  'Bologna': { lat: 44.49, lng: 11.34 },
  'Trieste': { lat: 45.65, lng: 13.78 },
  'Verona': { lat: 45.43, lng: 10.99 },
  // Centro
  'Firenze': { lat: 43.77, lng: 11.26 },
  'Roma': { lat: 41.90, lng: 12.50 },
  'Pisa': { lat: 43.72, lng: 10.40 },
  'Ancona': { lat: 43.60, lng: 13.51 },
  'Perugia': { lat: 43.11, lng: 12.39 },
  // Sud
  'Napoli': { lat: 40.85, lng: 14.26 },
  'Bari': { lat: 41.12, lng: 16.87 },
  'Palermo': { lat: 38.12, lng: 13.36 },
  'Catania': { lat: 37.50, lng: 15.09 },
  'Cagliari': { lat: 39.22, lng: 9.12 },
  'Reggio Calabria': { lat: 38.11, lng: 15.65 },
  'Lecce': { lat: 40.35, lng: 18.17 },
  'Taranto': { lat: 40.47, lng: 17.24 },
  'Messina': { lat: 38.19, lng: 15.55 },
  'Salerno': { lat: 40.68, lng: 14.76 },
};

// Cerca coordinate per una città: prima dal backend, poi dal dizionario, poi null
function getCityCoords(city: City): { lat: number; lng: number } | null {
  const lat = city.latitude ?? city.lat;
  const lng = city.longitude ?? city.lng;
  if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };

  const known = CITY_COORDS[city.name];
  if (known) return known;

  return null;
}

interface ItalyMapProps {
  cities: City[];
  currentCommunityId: string;
  onSelectCommunity: (cityId: string, cityName: string) => void;
}

export default function ItalyMap({ cities, currentCommunityId, onSelectCommunity }: ItalyMapProps) {
  // Hub nazionale — centro Italia
  const hubPos = projectToMap(41.9, 12.5);

  const citiesWithCoords = cities
    .map((city) => ({ city, coords: getCityCoords(city) }))
    .filter((entry): entry is { city: City; coords: { lat: number; lng: number } } =>
      entry.coords !== null
    );

  const citiesWithoutCoords = cities.filter((city) => getCityCoords(city) === null);

  return (
    <div className="flex flex-col items-center py-2">
      <div className="mb-1 flex items-center gap-2">
        <IoMap size={18} className="text-accent" />
        <h3 className="font-semibold text-text-primary">Mappa d&apos;Italia</h3>
      </div>
      <p className="mb-3 text-center text-xs text-text-secondary">
        Tocca una città per entrare nella sua community.
      </p>

      {/* Mappa */}
      <div
        className="relative overflow-hidden rounded-2xl border border-border"
        style={{ width: MAP_W, height: MAP_H }}
      >
        <Image
          src="/italy_map.jpg"
          alt="Mappa d'Italia"
          width={MAP_W}
          height={MAP_H}
          className="h-full w-full object-cover"
          priority
        />

        {/* Hub nazionale */}
        <button
          type="button"
          title="Hub OutofTheGrid"
          className={[
            'absolute z-20 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white shadow transition-transform hover:scale-110',
            currentCommunityId === 'national' ? 'bg-yellow-400 text-background' : 'bg-accent text-white',
          ].join(' ')}
          style={{ left: hubPos.x, top: hubPos.y }}
          onClick={() => onSelectCommunity('national', 'Hub OutofTheGrid')}
        >
          <IoEarth size={16} />
        </button>
        {currentCommunityId === 'national' && (
          <div
            className="absolute z-10 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/30"
            style={{ left: hubPos.x, top: hubPos.y }}
          />
        )}

        {/* Pin città */}
        {citiesWithCoords.map(({ city, coords }) => {
          const pos = projectToMap(coords.lat, coords.lng);
          const isSelected = currentCommunityId === String(city.id);

          return (
            <div key={String(city.id)}>
              {isSelected && (
                <div
                  className="absolute z-10 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/35"
                  style={{ left: pos.x, top: pos.y }}
                />
              )}
              <button
                type="button"
                title={city.name}
                className={[
                  'absolute z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white shadow transition-transform hover:scale-110',
                  isSelected ? 'bg-yellow-400 text-background' : 'bg-info text-white',
                ].join(' ')}
                style={{ left: pos.x, top: pos.y }}
                onClick={() => onSelectCommunity(String(city.id), city.name)}
              >
                <IoLocation size={12} />
              </button>
              <span
                className={[
                  'pointer-events-none absolute z-30 -translate-x-1/2 whitespace-nowrap rounded px-1 text-[9px] font-bold drop-shadow',
                  isSelected ? 'text-yellow-300' : 'text-white',
                ].join(' ')}
                style={{ left: pos.x, top: pos.y + 14 }}
              >
                {city.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Città senza coordinate (non nel dizionario) */}
      {citiesWithoutCoords.length > 0 && (
        <div className="mt-3 w-full max-w-xs">
          <p className="mb-2 text-center text-xs text-text-muted">Altre community</p>
          <div className="flex flex-wrap justify-center gap-2">
            {citiesWithoutCoords.map((city) => {
              const isSelected = currentCommunityId === String(city.id);
              return (
                <button
                  key={String(city.id)}
                  type="button"
                  onClick={() => onSelectCommunity(String(city.id), city.name)}
                  className={[
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    isSelected
                      ? 'border-accent bg-accent text-white'
                      : 'border-border text-text-secondary hover:border-accent/50',
                  ].join(' ')}
                >
                  {city.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Città selezionata */}
      <div className="mt-4 flex w-full max-w-xs items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
        {currentCommunityId === 'national' ? (
          <IoEarth size={18} className="text-accent" />
        ) : (
          <IoLocation size={18} className="text-accent" />
        )}
        <span className="flex-1 truncate text-text-primary">
          {currentCommunityId === 'national'
            ? 'Hub OutofTheGrid'
            : cities.find((c) => String(c.id) === currentCommunityId)?.name ?? 'Seleziona una community'}
        </span>
        <IoCheckmarkCircle size={18} className="text-accent" />
      </div>
    </div>
  );
}
