import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { UserRole } from '@/types';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 1. Redirect unauthenticated users trying to access protected routes
  if (!user) {
    if (path.startsWith('/driver') || path.startsWith('/passenger') || path.startsWith('/admin') || path.startsWith('/staff')) {
      // Preserve the intended destination
      const redirectUrl = new URL('/auth', request.url);
      redirectUrl.searchParams.set('next', path);
      
      // Attempt to guess role from path to pre-select tab
      if (path.startsWith('/driver')) redirectUrl.searchParams.set('role', 'driver');
      else redirectUrl.searchParams.set('role', 'passenger');
      
      return NextResponse.redirect(redirectUrl);
    }
    // Allow public access
    return response;
  }

  // 2. Role-Based Access Control (RBAC)
  // Retrieve role from user metadata (assumes role is set on sign-up)
  const userRole = (user.user_metadata?.role as UserRole) || 'passenger';

  // Define Restricted Areas
  if (path.startsWith('/driver') && userRole !== 'driver') {
    return NextResponse.redirect(new URL(getDashboardRoute(userRole), request.url));
  }

  if (path.startsWith('/passenger') && userRole !== 'passenger') {
    return NextResponse.redirect(new URL(getDashboardRoute(userRole), request.url));
  }

  if (path.startsWith('/admin') && userRole !== 'superadmin') {
    return NextResponse.redirect(new URL(getDashboardRoute(userRole), request.url));
  }

  if (path.startsWith('/staff') && userRole !== 'employee' && userRole !== 'superadmin') {
    // Superadmins can access staff areas, but employees cannot access admin areas
    return NextResponse.redirect(new URL(getDashboardRoute(userRole), request.url));
  }

  // 3. Prevent authenticated users from visiting Auth page
  if (path === '/auth') {
    return NextResponse.redirect(new URL(getDashboardRoute(userRole), request.url));
  }

  return response;
}

// Helper to determine home base for a role
function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'driver': return '/driver';
    case 'passenger': return '/passenger';
    case 'employee': return '/staff';
    case 'superadmin': return '/admin';
    default: return '/passenger';
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};