'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-offwhite flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-teal-light rounded-2xl p-8 shadow-sm">
        <h1 className="font-serif text-3xl text-teal-dark mb-2">Reset password</h1>
        {sent ? (
          <div className="space-y-4">
            <p className="text-charcoal text-sm">
              Check your inbox. We sent a reset link to <strong>{email}</strong>.
            </p>
            <p className="text-midgray text-xs">
              The link expires in 60 minutes. If you don&apos;t see it, check spam.
            </p>
            <Link href="/auth/login" className="text-teal-dark hover:underline text-sm block mt-4">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="text-midgray mb-6">
              Enter your account email and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-teal-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
              {error && <p className="text-red text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal hover:bg-teal-mid text-offwhite py-2.5 rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p className="text-sm text-midgray mt-6 text-center">
              Remembered it? <Link href="/auth/login" className="text-teal-dark hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
