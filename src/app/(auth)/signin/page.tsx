'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getSession, signIn } from 'next-auth/react';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signInSchema } from '@/schemas/signInSchema';

export default function SignInForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const { toast } = useToast();
  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    console.log(data)
    const result = await signIn('credentials', {
      redirect: false,
      email: data.identifier,
      password: data.password,
    });
    console.log(result);
    if (result?.error) {
      if (result.error === 'CredentialsSignin') {
        toast({
          title: 'Login Failed',
          description: 'Incorrect username or password',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    }
    toast({
      title: 'Login Successful',
      description: 'Redirecting to home page',
      variant: "default"
    });
    const session = await getSession();
    if (session) {
      localStorage.setItem('session', JSON.stringify(session));
    }
    console.log(session)
    console.log(localStorage.getItem('session'));
    router.refresh(); // Refresh the session-aware components
    router.replace('/');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight lg:text-5xl mb-6">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to continue</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              name="identifier"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Email/Username</FormLabel>
                  <Input
                    {...field}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Password</FormLabel>
                  <Input
                    type="password"
                    {...field}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 transition-all"
            >
              Sign In
            </Button>
          </form>
        </Form>
        <div className="text-center mt-4">
          <p className="text-gray-600">
            Not a member yet?{' '}
            <Link href="/signup" className="text-blue-500 hover:text-blue-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
