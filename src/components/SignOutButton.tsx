'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function SignOutButton() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('session');
      
      // Sign out with NextAuth
      await signOut({
        redirect: false,
      });
      
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
        variant: 'default',
      });
      
      router.push('/sign-in');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  );
}