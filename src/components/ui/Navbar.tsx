import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/authSlice";
import { useState } from "react";
import { profile } from "console";
import DropDown from "../dropDown";

export interface AuthState {
  status: boolean;
  userData: any | null; // Replace `any` with a more specific type if you know the structure of userData
}

const AcmeLogo = () => (
  <svg fill="none" height="36" viewBox="0 0 32 32" width="36">
    <path
      clipRule="evenodd"
      d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export default function AppBar() {
  const user = useSelector((state: { auth: AuthState }) => state.auth?.status);
  const userData = useSelector((state: { auth: AuthState }) => state.auth?.userData);
  console.log(userData)
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { label: "Profile", href: '/profile' },
    { label: "Dashboard", href: '/dashboard' },
    { label: "Add Transaction", href: '/add-transaction' },
    { label: "History", href: '/history' },
    { label: "AI", href: '/AI' },
    { label: "logout", href: '/logout' },
  ];


  const handleLogout = async () => {
    try {
      localStorage.removeItem("session");
      localStorage.removeItem("dashboardCache");
      localStorage.removeItem("labelCache");
      localStorage.removeItem("transactionCache");
      dispatch(logout());
      await signOut();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const isAuthenticated = Boolean(user);

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen} className="py-4 bg-white border-b border-gray-200 shadow-sm">
      <NavbarMenuToggle
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        className="sm:hidden"
      />
      <NavbarBrand>
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <AcmeLogo />
          <p className="font-bold text-inherit text-2xl">Expense Tracker</p>
        </Link>
      </NavbarBrand>

      {isAuthenticated ? (
        <>
          <NavbarContent className="hidden sm:flex gap-7" justify="center">
            {[
              { path: "/dashboard", label: "Dashboard" },
              { path: "/add-transaction", label: "Add Transaction" },
              { path: "/history", label: "History" },
              { path: "/AI", label: "AI" },
            ].map((item) => (
              <NavbarItem key={item.path}>
                <Link
                  href={item.path}
                  className="text-gray-600 hover:text-blue-500 transition-colors duration-200 font-medium"
                >
                  {item.label}
                </Link>
              </NavbarItem>
            ))}
          </NavbarContent>

          <NavbarContent justify="end" className="flex items-center gap-4">
            <Dropdown>
              <DropdownTrigger className="hover:cursor-pointer">
                  <Avatar className="ring-2 ring-gray-100">
                    <AvatarImage
                      src={userData?.image || ""}
                      alt={userData?.user.name || "User"}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {userData?.user.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownTrigger>
                <DropdownMenu aria-label="Static Actions">
                  <DropdownItem key="profile" href="/profile" >Profile</DropdownItem>
                  <DropdownItem key="logout" onPress={handleLogout} className="text-danger" color="danger">
                    Logout
                  </DropdownItem>
                </DropdownMenu>
             
            </Dropdown>
          </NavbarContent>
          <NavbarMenu className="py-10">
            {menuItems.map((item, index) => (
              <NavbarMenuItem key={`${item.label}-${index}`}>
                <Link
                  className="w-full"
                  color={
                    index === 2
                      ? "primary"
                      : index === menuItems.length - 1
                        ? "danger"
                        : "foreground"
                  }
                  href={item.href}
                  size="lg"
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
          </NavbarMenu>
        </>
      ) : (
        <NavbarContent justify="end" className="gap-4">
          <Link
            href="/signup"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg 
                     hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 
                     transition-all duration-200 font-medium sm:block hidden"
          >
            Sign Up
          </Link>
          <Link
            href="/signin"
            className="px-6 py-2 mr-3 bg-gray-100 text-gray-700 rounded-lg 
                     hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 
                     transition-all duration-200 font-medium"
          >
            Login
          </Link>
        </NavbarContent>
      )}
    </Navbar>
  );
}
