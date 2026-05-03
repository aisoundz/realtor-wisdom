import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-offwhite flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-midgray">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
