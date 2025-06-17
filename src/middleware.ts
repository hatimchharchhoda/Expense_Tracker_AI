import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const config = {
  matcher: [
    '/',
    '/signin', // Your actual route
    '/signup',
    '/dashboard', 
    '/add-transaction', 
    '/history',
    '/profile',
    '/budget',
    '/AI'
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  const publicRoutes = ['/', '/signin', '/signup']; // Updated to /signin
  const protectedRoutes = ['/dashboard', '/add-transaction', '/history', '/profile', '/budget', '/AI'];

  // Allow API routes and NextAuth routes to pass through
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware - Path:', pathname, 'Has Token:', !!token);
  }

  // Handle root path
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect authenticated users from public routes to dashboard
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users from protected routes to signin
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    const signinUrl = new URL('/signin', request.url); // Updated to /signin
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}