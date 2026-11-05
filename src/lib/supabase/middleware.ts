import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  // Ottieni l'utente autenticato in modo sicuro tramite getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');
  const isSuperAdminRoute = pathname.startsWith('/superadmin');

  // Protezione Rotte RBAC
  if (isAdminRoute || isSuperAdminRoute) {
    if (!user) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Recupero il ruolo dell'utente dalla tabella profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role;

    // Se tenta di accedere a /superadmin ma non è superadmin -> Accesso Negato
    if (isSuperAdminRoute && userRole !== 'superadmin') {
      const forbiddenUrl = new URL('/', request.url);
      return NextResponse.redirect(forbiddenUrl);
    }

    // Se tenta di accedere a /admin ma non è né admin né superadmin -> Accesso Negato
    if (isAdminRoute && userRole !== 'admin' && userRole !== 'superadmin') {
      const forbiddenUrl = new URL('/', request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return response;
}

