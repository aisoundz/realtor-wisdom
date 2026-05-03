import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: CookieToSet) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;

  // Email-confirm / OAuth callbacks land on / with ?code=... — route them
  // through /auth/callback BEFORE we check auth, since the session doesn't
  // exist until the code is exchanged.
  if (path === '/' && request.nextUrl.searchParams.has('code')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated user hitting marketing root → bounce to dashboard
  if (user && path === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Public deal profiles (/deals/[id]/public) are accessible without auth
  const isPublicDeal = /^\/deals\/[^/]+\/public$/.test(path);

  // Unauthenticated user trying to access protected app routes → bounce to login
  const protectedPrefixes = [
    '/dashboard',
    '/deals',
    '/marketplace',
    '/portfolio',
    '/real-wisdom',
    '/impact-score',
  ];
  if (!user && !isPublicDeal && protectedPrefixes.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }

  return response;
}
