import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const config = {
  matcher: [
    '/',
    '/signin', 
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
  // Get the pathname from the request
  const { pathname } = request.nextUrl;
  
  // Get the token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Define routes
  const publicRoutes = ['/', '/signin', '/signup'];
  const protectedRoutes = ['/dashboard', '/add-transaction', '/history', '/profile', '/budget', '/AI'];

  // IMPORTANT: Allow API routes to pass through without redirects
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Redirect authenticated users from public routes to dashboard
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users from protected routes to signin
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // All other cases - allow the request to proceed
  return NextResponse.next();
}