import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-teal-deep text-offwhite flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="font-serif text-7xl text-teal mb-2">404</h1>
        <p className="font-serif text-2xl mb-3">Page not found</p>
        <p className="text-midgray text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist, was moved, or you don&apos;t have access.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-teal hover:bg-teal-mid text-offwhite px-5 py-2.5 rounded-lg font-medium"
          >
            Back to dashboard
          </Link>
          <Link
            href="/"
            className="text-midgray hover:text-offwhite px-5 py-2.5 text-sm self-center"
          >
            Marketing site →
          </Link>
        </div>
      </div>
    </main>
  );
}
