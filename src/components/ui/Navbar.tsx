import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button } from "@nextui-org/react";
import { useSession, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react";

export const AcmeLogo = () => {
  return (
    <svg fill="none" height="36" viewBox="0 0 32 32" width="36">
      <path
        clipRule="evenodd"
        d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default function AppBar() {
  const { data: session } = useSession();
  const [localUser, setLocalUser] = useState(null);
  const user = session?.user;

  useEffect(() => {
      // Update localStorage when session changes
      if (session) {
        localStorage.setItem('session', JSON.stringify(session));
        setLocalUser(session.user);
      }
    }, [session]);

    const isAuthenticated = localStorage.getItem('session');
  return (
    <Navbar className="py-4 bg-white border-b border-gray-200">
      <NavbarBrand>
        <AcmeLogo />
        <Link href="/">
          <p className="font-bold text-inherit text-2xl">Expense Tracker</p>
        </Link>
      </NavbarBrand>
      {isAuthenticated ? (
        <>
          <NavbarContent className="hidden sm:flex gap-7" justify="center">
            <NavbarItem>
              <Link href="/dashboard" className="hover:text-blue-500 transition-colors">
                Dashboard
              </Link>
            </NavbarItem>
            <NavbarItem isActive>
              <Link
                aria-current="page"
                href="/add-transaction"
                className="hover:text-blue-500 transition-colors"
              >
                Add Transaction
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link
                href="/history"
                className="hover:text-blue-500 transition-colors"
              >
                History
              </Link>
            </NavbarItem>
          </NavbarContent>
          <NavbarContent justify="end" className="flex items-center gap-4">
            {/* Avatar and Logout Button together */}
            <Link href="/profile">
              <Avatar>
                <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
                <AvatarFallback>{user?.username?.[0] || 'U'}</AvatarFallback>
              </Avatar>
            </Link>
            <Button
              onPress={() => {
                localStorage.removeItem('session');
                signOut()}}
              className=" mr-4 bg-blue-500 rounded-lg text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 transition-all"
            >
              Logout
            </Button>
          </NavbarContent>
        </>
      ) : (
        <>
          <div className="hidden lg:flex gap-2">
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 transition-all"
            >
              Sign Up
            </Link>
            <Link
              href="/signin"
              className="px-4 py-2 mr-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-400 transition-all"
            >
              Login
            </Link>
          </div>
        </>
      )}
    </Navbar>
  );
}
