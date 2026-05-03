import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Handles email-confirmation and OAuth redirects from Supabase.
// Supabase appends `?code=<code>` to the redirect URL; we exchange that
// code for a session, then bounce the user to the dashboard.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // No code or exchange failed — send them to login with a friendly message
  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
}
