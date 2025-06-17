import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import UserModel, { Usertype } from '@/models/model';

interface Credentials {
  email: string;
  password: string;
}

interface ExtendedUser {
  id: string;
  _id: string;
  username: string;
  email: string;
  password?: string;
  budget?: number;
  spent?: number;
  isGoogleUser?: boolean;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required.');
        }

        const { email, password } = credentials as Credentials;

        await dbConnect();

        try {
          const user = await UserModel.findOne({
            $or: [{ email: email }, { username: email }],
          }) as Usertype | null;

          if (!user) {
            throw new Error('No user found with this email or username.');
          }

          if (user.isGoogleUser && !user.password) {
            throw new Error('This account uses Google Sign-In. Please click "Continue with Google" to sign in.');
          }

          if (!user.password) {
            throw new Error('Invalid account configuration.');
          }

          const isPasswordCorrect = await bcrypt.compare(password, user.password);

          if (isPasswordCorrect) {
            return {
              id: (user as ExtendedUser)._id.toString(),
              _id: (user as ExtendedUser)._id.toString(),
              username: user.username,
              email: user.email,
              budget: user.budget,
              spent: user.spent,
              isGoogleUser: user.isGoogleUser || false,
            };
          } else {
            throw new Error('Incorrect password.');
          }
        } catch (err: any) {
          throw new Error(err.message || 'Authorization failed.');
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        await dbConnect();
        
        try {
          let existingUser = await UserModel.findOne({ email: user.email }) as Usertype | null;
          
          if (existingUser) {
            if (!existingUser.isGoogleUser) {
              existingUser.isGoogleUser = true;
              await existingUser.save();
            }
          } else {
            // Generate unique username for Google users
            let baseUsername = user.name?.replace(/\s+/g, '').toLowerCase() || 
                             user.email?.split('@')[0] || 
                             'user';
            
            let username = baseUsername;
            let counter = 1;
            
            // Ensure username is unique
            while (await UserModel.findOne({ username })) {
              username = `${baseUsername}${counter}`;
              counter++;
            }

            const newUser = new UserModel({
              username,
              email: user.email,
              isGoogleUser: true,
              budget: 0,
              spent: 0,
              // No password field for Google users
            });
            
            await newUser.save();
            existingUser = newUser;
          }
          
          if (existingUser) {
            user.id = (existingUser as ExtendedUser)._id.toString();
            (user as any)._id = (existingUser as ExtendedUser)._id.toString();
            (user as any).username = existingUser.username;
            (user as any).budget = existingUser.budget;
            (user as any).spent = existingUser.spent;
            (user as any).isGoogleUser = existingUser.isGoogleUser;
          }
          
        } catch (error) {
          console.error('Error during Google sign in:', error);
          return false;
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token._id = (user as any)._id || user.id;
        token.id = user.id;
        token.username = (user as any).username;
        token.budget = (user as any).budget;
        token.spent = (user as any).spent;
        token.isGoogleUser = (user as any).isGoogleUser;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user._id = token._id as string;
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.budget = token.budget as number;
        session.user.spent = token.spent as number;
        session.user.isGoogleUser = token.isGoogleUser as boolean;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/signin', // Updated to match your actual route
  },
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};