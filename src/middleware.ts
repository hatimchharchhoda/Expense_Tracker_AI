import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export { default } from 'next-auth/middleware';

export const config = {
    matcher: [
      '/',
      '/signin', 
      '/signup',
      '/dashboard', 
      '/add-transaction', 
      '/history',
      '/profile'
    ],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    // Redirect unauthenticated users trying to access protected routes
    if (request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/add-transaction') ||
        request.nextUrl.pathname.startsWith('/history') || 
        request.nextUrl.pathname.startsWith('/profile')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } else {
    // Redirect authenticated users away from auth pages
    if (request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname.startsWith('/signin') ||
        request.nextUrl.pathname.startsWith('/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}
