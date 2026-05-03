'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md bg-white border border-teal-light rounded-2xl p-8 shadow-sm">
      <h1 className="font-serif text-3xl text-teal-dark mb-2">Sign in</h1>
      <p className="text-midgray mb-6">Welcome back to Realtor Wisdom.</p>
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
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 border border-teal-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>
        {error && <p className="text-red text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal hover:bg-teal-mid text-offwhite py-2.5 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-sm text-midgray mt-4 text-center">
        <Link href="/auth/forgot-password" className="text-teal-dark hover:underline">Forgot password?</Link>
      </p>
      <p className="text-sm text-midgray mt-4 text-center">
        New here? <Link href="/auth/signup" className="text-teal-dark hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
