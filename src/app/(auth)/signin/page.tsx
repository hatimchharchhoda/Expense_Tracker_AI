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
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function SignInForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    setLoading(true);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.identifier,
        password: data.password,
      });
      
      if (result?.error) {
        toast({
          title: 'Login Failed',
          description:
            result.error === 'CredentialsSignin'
              ? 'Incorrect username or password'
              : result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login Successful',
          description: 'Redirecting to dashboard...',
          variant: 'default',
        });

        const session = await getSession();
        if (session) {
          localStorage.setItem('session', JSON.stringify(session));
        }

        router.replace('/');
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/',
      });
      
      if (result?.error) {
        toast({
          title: 'Google Sign-In Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result?.url) {
        toast({
          title: 'Login Successful',
          description: 'Redirecting to dashboard...',
          variant: 'default',
        });
        
        // Get session and store it
        const session = await getSession();
        if (session) {
          localStorage.setItem('session', JSON.stringify(session));
        }
        
        router.replace('/');
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Google Sign-In Failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestCredentials = {
      identifier: 'one@gmail.com',
      password: '123456',
    };

    form.setValue('identifier', guestCredentials.identifier);
    form.setValue('password', guestCredentials.password);
    
    setTimeout(() => {
      form.handleSubmit(onSubmit)();
    }, 100);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md relative">
          {/* Decorative elements */}
          <div className="absolute -z-10 -top-6 -right-6 w-20 h-20 bg-teal-200 dark:bg-teal-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          <div className="absolute -z-10 -bottom-6 -left-6 w-20 h-20 bg-blue-200 dark:bg-blue-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-blue-400 to-teal-500 dark:from-blue-500 dark:to-teal-600 rounded-full">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome Back
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Sign in to your account
                </p>
              </div>

              {/* Google Sign-In Button */}
              {/* <Button
                type="button"
                variant="outline"
                className="w-full mb-6 h-12 border-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in with Google...
                  </>
                ) : (
                  <>
                    <FcGoogle className="mr-2 h-5 w-5" />
                    Continue with Google
                  </>
                )}
              </Button> */}

              {/* Divider */}
              {/* <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-800 px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div> */}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    name="identifier"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center text-foreground font-medium">
                          <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                          Email or Username
                        </FormLabel>
                        <Input
                          {...field}
                          className="bg-background border-input"
                          placeholder="your@email.com"
                          disabled={loading || googleLoading}
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
                        <FormLabel className="flex items-center text-foreground font-medium">
                          <Lock className="w-4 h-4 mr-2 text-muted-foreground" />
                          Password
                        </FormLabel>
                        <Input
                          type="password"
                          {...field}
                          className="bg-background border-input"
                          placeholder="••••••••"
                          disabled={loading || googleLoading}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="w-full mt-2 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                                    <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={handleGuestLogin}
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Login as Guest'
                    )}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <Link 
                    href="/signup" 
                    className="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}