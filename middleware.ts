import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/signin', '/signup', '/','dashboard','/add-transaction','/history'],
};
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  console.log('token',token);
  const url = request.nextUrl;
  // Redirect to dashboard if the user is already authenticated
  // and trying to access sign-in, sign-up, or home page
  if (!token && 
    (url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/add-transaction') ||
      url.pathname.startsWith('/history')) ){
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  
  if (
    token &&
    (url.pathname.startsWith('/signin') ||
      url.pathname.startsWith('/signup') ||
      url.pathname === '/')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}