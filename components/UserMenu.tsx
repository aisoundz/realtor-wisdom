'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const initials = email
    .split('@')[0]
    .split(/[._-]/)
    .map((p) => p[0]?.toUpperCase())
    .join('')
    .slice(0, 2);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-teal/30 hover:bg-teal/40 border border-teal-mid/50 text-sm font-medium flex items-center justify-center transition"
        aria-label="User menu"
      >
        {initials || '?'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-charcoal border border-teal-mid/40 rounded-xl shadow-xl py-2 z-50">
          <div className="px-4 py-2 border-b border-teal-mid/30 mb-1">
            <div className="text-xs uppercase tracking-wider text-midgray">Signed in as</div>
            <div className="text-sm truncate">{email}</div>
          </div>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-charcoal/60"
          >
            Settings
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-charcoal/60"
          >
            All deals
          </Link>
          <div className="border-t border-teal-mid/30 my-1" />
          <button
            onClick={signOut}
            className="block w-full text-left px-4 py-2 text-sm text-red hover:bg-red/10"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
