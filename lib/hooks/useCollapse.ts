'use client';

import { useEffect, useState, useCallback } from 'react';

// Persistent collapse state — remembers per-section preference across page loads.
// Uses localStorage with a stable key (typically `<sectionType>-<dealId>`) so
// collapse choices stick when the user reopens the deal room.
export function useCollapse(key: string, defaultCollapsed = false) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(`collapse:${key}`);
    if (stored !== null) {
      setCollapsed(stored === 'true');
    }
    setHydrated(true);
  }, [key]);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`collapse:${key}`, String(next));
      }
      return next;
    });
  }, [key]);

  return [collapsed, toggle, hydrated] as const;
}
