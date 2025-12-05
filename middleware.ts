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

  // 1. Protected Routes Configuration
  const protectedPaths = [
    { path: '/driver', allowedRoles: ['driver'] },
    { path: '/passenger', allowedRoles: ['passenger'] },
    { path: '/admin', allowedRoles: ['superadmin'] },
    { path: '/manager', allowedRoles: ['manager', 'superadmin'] },
    { path: '/staff', allowedRoles: ['employee', 'manager', 'superadmin'] },
  ];

  // 2. Redirect unauthenticated users
  if (!user) {
    if (protectedPaths.some(p => path.startsWith(p.path))) {
      const redirectUrl = new URL('/auth', request.url);
      redirectUrl.searchParams.set('next', path);
      // Heuristic to set role hint for login page
      if (path.startsWith('/driver')) redirectUrl.searchParams.set('role', 'driver');
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // 3. Role-Based Access Control (RBAC)
  const userRole = (user.user_metadata?.role as UserRole) || 'passenger';

  // Check against protected paths
  for (const route of protectedPaths) {
    if (path.startsWith(route.path)) {
      if (!route.allowedRoles.includes(userRole)) {
        // User has logged in but is accessing wrong dashboard
        return NextResponse.redirect(new URL(getDashboardRoute(userRole), request.url));
      }
    }
  }

  // 4. Prevent authenticated users from visiting Auth page
  if (path === '/auth') {
    return NextResponse.redirect(new URL(getDashboardRoute(userRole), request.url));
  }

  return response;
}

function getDashboardRoute(role: UserRole): string {
  switch (role) {
    case 'driver': return '/driver';
    case 'passenger': return '/passenger';
    case 'employee': return '/staff';
    case 'manager': return '/manager';
    case 'superadmin': return '/admin';
    default: return '/passenger';
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};