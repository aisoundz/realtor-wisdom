'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-offwhite flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-teal-light rounded-2xl p-8 shadow-sm">
        <h1 className="font-serif text-3xl text-teal-dark mb-2">Create account</h1>
        <p className="text-midgray mb-6">Start your first deal in two minutes.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Your name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-teal-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-teal-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <p className="text-xs text-midgray mt-1">Minimum 8 characters.</p>
          </div>
          {error && <p className="text-red text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal hover:bg-teal-mid text-offwhite py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-sm text-midgray mt-6 text-center">
          Already have an account? <Link href="/auth/login" className="text-teal-dark hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
