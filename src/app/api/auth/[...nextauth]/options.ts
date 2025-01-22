import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/model';

type Cred = Record<'email' | 'password', string>;

type CustomUser = {
  id: string; // Add the `id` field as required by next-auth
  _id: string;
  username: string;
  email: string;
  password: string;
  budget?: number;
  spent?:number;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: Cred | undefined): Promise<CustomUser | null> {
        if (!credentials) {
          throw new Error('Credentials are required.');
        }

        const { email, password } = credentials;

        await dbConnect();

        try {
          const user = await UserModel.findOne({
            $or: [{ email: email }, { username: email }],
          });

          if (!user) {
            throw new Error('No user found with this email or username.');
          }

          const isPasswordCorrect = await bcrypt.compare(password, user.password);

          if (isPasswordCorrect) {
            return {
              id: user._id.toString(), // Map MongoDB `_id` to `id`
              _id: user._id.toString(),
              username: user.username,
              email: user.email,
              password: user.password,
              budget: user.budget,
              spent : user.spent,
            };
          } else {
            throw new Error('Incorrect password.');
          }
        } catch (err) {
          throw new Error('Authorization failed.');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id?.toString();
        token.id = user.id; // Ensure `id` is mapped in the token
        token.username = user.username;
        token.budget = user.budget;
        token.spent = user.spent;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.id = token.id; // Ensure `id` is mapped in the session
        session.user.username = token.username;
        session.user.budget = token.budget;
        session.user.spent = token.spent;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/sign-in',
  },
};
