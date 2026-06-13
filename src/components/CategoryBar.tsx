'use client';

import { useEffect, useRef } from 'react';

interface CategoryItem {
  id: number;
  type: string;
  name: string;
  protectedCategory: boolean;
  minLevelToRead: number;
}

interface CategoryBarProps {
  categories: CategoryItem[];
  selected: string;
  isSubscribed: boolean;
  isElevated: boolean; // admin o city manager — vedono il bottone "Tutti"
  userLevel: number;
  onSelect: (type: string) => void;
}

const COLORS: Record<string, string> = {
  GENERAL: '#8B949E', ANNOUNCEMENTS: '#F0A500', QUESTIONS: '#58A6FF',
  RESULTS: '#52B788', TRADE_MARKET: '#9C27B0', PROGETTI: '#E91E63',
  MERCATINO: '#FF6B35', AUTOSUFFICIENZA: '#4CAF50', EVENTI_LOCALI: '#2196F3',
  RICETTE: '#FF9800', ENERGIA: '#FFD700',
};

export function CategoryBar({ categories, selected, isSubscribed, isElevated, userLevel, onSelect }: CategoryBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selected);
  const categoriesRef = useRef(categories);
  const isSubscribedRef = useRef(isSubscribed);
  const isElevatedRef = useRef(isElevated);
  const userLevelRef = useRef(userLevel);

  onSelectRef.current = onSelect;
  selectedRef.current = selected;
  categoriesRef.current = categories;
  isSubscribedRef.current = isSubscribed;
  isElevatedRef.current = isElevated;
  userLevelRef.current = userLevel;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const buildButtons = () => {
      const cats = categoriesRef.current;
      const sub = isSubscribedRef.current;
      const elevated = isElevatedRef.current;
      const lvl = userLevelRef.current;
      const sel = selectedRef.current;

      const sorted = [...cats].sort((a, b) => {
        const aL = a.protectedCategory && !sub && lvl < a.minLevelToRead;
        const bL = b.protectedCategory && !sub && lvl < b.minLevelToRead;
        if (aL && !bL) return 1;
        if (!aL && bL) return -1;
        return 0;
      });

      container.innerHTML = '';

      const updateBtnStyle = (btn: HTMLButtonElement, active: boolean) => {
        const type = btn.dataset.cat!;
        const color = COLORS[type] ?? '#8B949E';
        if (active) {
          btn.style.backgroundColor = color;
          btn.style.color = '#fff';
          btn.style.borderColor = 'transparent';
        } else {
          btn.style.backgroundColor = '';
          btn.style.color = 'var(--color-text-secondary, #8B949E)';
          btn.style.borderColor = 'var(--color-border, #30363D)';
        }
      };

      const makeBtn = (type: string, label: string, locked: boolean) => {
        const btn = document.createElement('button');
        btn.dataset.cat = type;
        btn.className = 'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors';
        btn.style.cssText = 'font-family: inherit;';
        if (locked) btn.style.opacity = '0.6';
        updateBtnStyle(btn, type === sel);

        if (locked) {
          const star = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          star.setAttribute('width', '11'); star.setAttribute('height', '11');
          star.setAttribute('viewBox', '0 0 24 24'); star.style.marginLeft = '4px';
          star.style.display = 'inline'; star.style.verticalAlign = 'middle';
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z');
          path.setAttribute('fill', '#F0A500');
          star.appendChild(path);
          btn.appendChild(document.createTextNode(label));
          btn.appendChild(star);
        } else {
          btn.textContent = label;
        }
        return btn;
      };

      // Bottone "Tutti" — solo per admin/city manager
      if (elevated) {
        const allBtn = makeBtn('all', 'Tutti', false);
        container.appendChild(allBtn);
      }

      sorted.forEach((cat) => {
        const locked = cat.protectedCategory && !sub && lvl < cat.minLevelToRead;
        const btn = makeBtn(cat.type, cat.name, locked);
        container.appendChild(btn);
      });
    };

    buildButtons();

    const onClick = (e: MouseEvent) => {
      if (isDragging && didDrag) return;
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-cat]');
      if (!btn) return;
      onSelectRef.current(btn.dataset.cat!);
    };

    const updateActive = () => {
      const sel = selectedRef.current;
      container.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((btn) => {
        const type = btn.dataset.cat!;
        const color = COLORS[type] ?? '#8B949E';
        if (type === sel) {
          btn.style.backgroundColor = color;
          btn.style.color = '#fff';
          btn.style.borderColor = 'transparent';
        } else {
          btn.style.backgroundColor = '';
          btn.style.color = 'var(--color-text-secondary, #8B949E)';
          btn.style.borderColor = 'var(--color-border, #30363D)';
        }
      });
    };

    let isDragging = false;
    let didDrag = false;
    let startX = 0;
    let startScroll = 0;

    const onMouseDown = (e: MouseEvent) => { isDragging = true; didDrag = false; startX = e.clientX; startScroll = container.scrollLeft; container.style.cursor = 'grabbing'; };
    const onMouseMove = (e: MouseEvent) => { if (!isDragging) return; const dx = e.clientX - startX; if (Math.abs(dx) > 3) didDrag = true; container.scrollLeft = startScroll - dx; };
    const onMouseUp = () => { isDragging = false; container.style.cursor = 'grab'; };

    container.addEventListener('click', onClick);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let lastSelected = selectedRef.current;
    let lastCatLen = categoriesRef.current.length;

    const interval = setInterval(() => {
      const newSel = selectedRef.current;
      const newLen = categoriesRef.current.length;
      if (newLen !== lastCatLen) {
        lastCatLen = newLen; lastSelected = newSel;
        const scrollPos = container.scrollLeft;
        buildButtons();
        container.scrollLeft = scrollPos;
        return;
      }
      if (newSel !== lastSelected) { lastSelected = newSel; updateActive(); }
    }, 50);

    return () => {
      clearInterval(interval);
      container.removeEventListener('click', onClick);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="mb-4 flex gap-2 overflow-x-auto pb-2 select-none"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', cursor: 'grab', WebkitOverflowScrolling: 'touch' }}
    />
  );
}
