'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    // The reset link sends users here with a session set via /auth/callback.
    // Verify they have a session before showing the form.
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user);
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-offwhite flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-teal-light rounded-2xl p-8 shadow-sm">
        <h1 className="font-serif text-3xl text-teal-dark mb-2">Set a new password</h1>
        {done ? (
          <div className="space-y-2">
            <p className="text-teal-dark text-sm">✓ Password updated. Redirecting to dashboard…</p>
          </div>
        ) : authed === false ? (
          <div className="space-y-4">
            <p className="text-red text-sm">
              This reset link is invalid or has expired.
            </p>
            <Link href="/auth/forgot-password" className="text-teal-dark hover:underline text-sm">
              Request a new reset link →
            </Link>
          </div>
        ) : authed === null ? (
          <p className="text-midgray text-sm">Verifying reset link…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-teal-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Confirm password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2.5 border border-teal-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            {error && <p className="text-red text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal hover:bg-teal-mid text-offwhite py-2.5 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
