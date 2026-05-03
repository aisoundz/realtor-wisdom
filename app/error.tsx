'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-teal-deep text-offwhite flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-charcoal/40 border border-red/30 rounded-2xl p-8 text-center">
        <h1 className="font-serif text-3xl mb-2 text-red">Something went wrong</h1>
        <p className="text-midgray text-sm mb-6">
          We hit a snag. Try refreshing the page — if it keeps happening, let us know.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-midgray mb-6 break-all">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-teal hover:bg-teal-mid text-offwhite px-5 py-2.5 rounded-lg font-medium"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="text-midgray hover:text-offwhite px-5 py-2.5 text-sm self-center"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
