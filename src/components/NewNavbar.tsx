"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem, 
  NavbarMenuToggle, 
  NavbarMenu, 
  NavbarMenuItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@nextui-org/react";
import { LayoutDashboard, PlusCircle, ListOrdered, Sparkles, PieChart, User, LogOut } from "lucide-react";
import { signOut } from 'next-auth/react';
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/authSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";

export interface AuthState {
  status: boolean;
  userData: any | null;
}

// Modern Logo Component
const ExpenseLogo = () => (
  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white dark:from-blue-600 dark:to-indigo-600">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13.41 18.09V20H10.74V18.07C9.03 17.71 7.58 16.61 7.47 14.67H9.43C9.53 15.72 10.25 16.54 12.08 16.54C14.04 16.54 14.48 15.56 14.48 14.95C14.48 14.12 14.04 13.34 11.81 12.81C9.33 12.21 7.63 11.19 7.63 9.14C7.63 7.42 9.02 6.2 10.74 5.87V4H13.41V5.89C15.99 6.35 16.53 8.14 16.6 9.08H14.63C14.56 8.3 14.06 7.54 12.08 7.54C10.28 7.54 9.68 8.41 9.68 9.08C9.68 9.91 10.39 10.44 12.36 10.94C14.32 11.44 16.53 12.34 16.53 14.93C16.53 16.47 15.4 17.69 13.41 18.09Z" 
        fill="currentColor"
      />
    </svg>
  </div>
);

export default function NewNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname ? usePathname() : "";
  const router = useRouter();
  const dispatch = useDispatch();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const user = useSelector((state: { auth: AuthState }) => state.auth?.status);
  const userData = useSelector((state: { auth: AuthState }) => state.auth?.userData);
  const isAuthenticated = Boolean(user);

  const menuItems = [
    { 
      label: "Dashboard", 
      href: "/dashboard", 
      icon: <LayoutDashboard className="w-4 h-4 mr-2" /> 
    },
    { 
      label: "Add Transaction", 
      href: "/add-transaction", 
      icon: <PlusCircle className="w-4 h-4 mr-2" /> 
    },
    { 
      label: "History", 
      href: "/history", 
      icon: <ListOrdered className="w-4 h-4 mr-2" /> 
    },
    {
      label: "Budget",
      href: "/budget",
      icon: <PieChart className="w-4 h-4 mr-2" />
    },
    { 
      label: "AI", 
      href: "/AI", 
      icon: <Sparkles className="w-4 h-4 mr-2" /> 
    },
  ];

  const mobileMenuItems = [
    ...menuItems,
  
  ];

  // Check if a route is active
  const isActive = (path: string): boolean => pathname === path;

  const handleLogout = async () => {
    try {
      // Clear all local storage at once for better performance
      const keysToRemove = ["session", "dashboardCache", "labelCache", "transactionCache"];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Dispatch logout action
      dispatch(logout());
      
      // Sign out from auth
      await signOut();
      
      // Close mobile menu if open
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // IMPORTANT: Using direct navigation method instead of Link components
  const navigate = (href: string) => {
    window.location.href = href;
  };

  // Don't render until client-side
  if (!mounted) {
    return null;
  }

  return (
    <Navbar 
      onMenuOpenChange={setIsMenuOpen} 
      className="py-3 border-b shadow-sm backdrop-blur-md z-40 bg-background/90 dark:border-gray-800"
      maxWidth="xl"
      position="sticky"
    >
      <NavbarMenuToggle
        aria-label={isMenuOpen ? "Close menu" : "Open menu"} 
        className="sm:hidden text-foreground"
      />
      
      <NavbarBrand>
        <div 
          onClick={() => navigate("/")}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <ExpenseLogo />
          <div>
            <p className="font-bold text-foreground text-xl">Expense Tracker</p>
            <p className="text-xs text-muted-foreground -mt-1 hidden sm:block">Manage your finances</p>
          </div>
        </div>
      </NavbarBrand>

      {isAuthenticated ? (
        <>
          <NavbarContent className="hidden sm:flex gap-1" justify="center">
            {menuItems.map((item) => (
              <NavbarItem key={item.href}>
                <div
                  onClick={() => navigate(item.href)}
                  className={`px-4 py-2 rounded-lg flex items-center text-sm transition-all duration-200 cursor-pointer ${
                    isActive(item.href)
                      ? "text-blue-600 bg-blue-50 font-medium dark:text-blue-400 dark:bg-blue-950/50"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <span className={`hidden md:block ${isActive(item.href) ? "opacity-100" : "opacity-70"}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </div>
              </NavbarItem>
            ))}
          </NavbarContent>

          <NavbarContent justify="end" className="flex items-center gap-2">
            <ThemeToggle />
            
            <Dropdown>
              <DropdownTrigger className="hover:cursor-pointer">
                <Avatar className="ring-2 ring-primary/10 transition-shadow hover:ring-primary/30">
                  <AvatarImage
                    src={userData?.image || ""}
                    alt={userData?.user?.name || "User"}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {userData?.user?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu">
              
                <DropdownItem 
                  key="logout" 
                  onPress={handleLogout} 
                  className="text-danger" 
                  color="danger"
                  startContent={<LogOut className="w-4 h-4" />}
                >
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarContent>

          <NavbarMenu className="pt-6 pb-10 px-4 bg-background/95 backdrop-blur-md dark:bg-background/90">
            {mobileMenuItems.map((item, index) => (
              <NavbarMenuItem key={`${item.label}-${index}`} className="my-1">
                <div
                  onClick={() => {
                    navigate(item.href);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg flex items-center cursor-pointer ${
                    isActive(item.href)
                      ? "text-blue-600 bg-blue-50 font-medium dark:text-blue-400 dark:bg-blue-950/50"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </div>
              </NavbarMenuItem>
            ))}
            <NavbarMenuItem className="my-1">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-lg flex items-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <span className="mr-3"><LogOut className="w-4 h-4" /></span>
                Logout
              </button>
            </NavbarMenuItem>
          </NavbarMenu>
        </>
      ) : (
        <NavbarContent justify="end" className="gap-2">
          <ThemeToggle />
          <div
            onClick={() => navigate("/signup")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg 
                     hover:bg-primary/90 focus:ring-2 focus:ring-primary/30 
                     transition-all duration-200 font-medium sm:block hidden cursor-pointer"
          >
            Sign Up
          </div>
          <div
            onClick={() => navigate("/signin")}
            className="px-6 py-2 mr-3 bg-secondary text-secondary-foreground rounded-lg 
                     hover:bg-secondary/80 focus:ring-2 focus:ring-secondary/30 
                     transition-all duration-200 font-medium cursor-pointer"
          >
            Login
          </div>
        </NavbarContent>
      )}
    </Navbar>
  );
}