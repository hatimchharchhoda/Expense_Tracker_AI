import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      _id?: string;
      id?: string;
      username?: string;
      budget?: number;
      spent?: number;
      isGoogleUser?: boolean; // Added Google OAuth flag
    } & DefaultSession['user'];
  }

  interface User {
    _id?: string;
    id: string;
    username?: string;
    budget?: number;
    spent?: number;
    isGoogleUser?: boolean; // Added Google OAuth flag
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    _id?: string;
    id?: string;
    username?: string;
    budget?: number;
    spent?: number;
    isGoogleUser?: boolean; // Added Google OAuth flag
  }
}