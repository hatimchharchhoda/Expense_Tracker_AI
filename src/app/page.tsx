'use client';
import './globals.css';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { login } from '@/store/authSlice';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  IconClipboardCopy,
  IconSignature,
  IconTableColumn,
  IconMessageCircle,
} from "@tabler/icons-react";


export interface AuthState {
  status: boolean;
  userData: any | null; // Replace `any` with a more specific type if you know the structure of userData
}

const items = [
  { 
    title: "Smart Expense Classification", 
    description: "AI-powered automatic categorization of your spending with unprecedented accuracy.",
    icon: <IconClipboardCopy className="h-12 w-12 text-amber-600 bg-amber-100 p-2 rounded-full" />,
    className: "md:col-span-2 bg-amber-50 hover:bg-amber-100 transition-colors duration-300 shadow-md"
  },
  { 
    title: "AI Budget Advisor", 
    description: "Personalized financial guidance through AI-powered conversational budget planning.",
    icon: <IconMessageCircle className="h-12 w-12 text-teal-600 bg-teal-100 p-2 rounded-full" />,
    className: "md:col-span-1 bg-teal-50 hover:bg-teal-100 transition-colors duration-300 shadow-md"
  },
  { 
    title: "Financial Insights", 
    description: "Deep analysis of your spending habits with personalized financial recommendations.",
    icon: <IconSignature className="h-12 w-12 text-purple-600 bg-purple-100 p-2 rounded-full" />,
    className: "md:col-span-1 bg-purple-50 hover:bg-purple-100 transition-colors duration-300 shadow-md"
  },
  { 
    title: "Real-time Expense Tracking", 
    description: "Instant transaction monitoring and comprehensive financial dashboard.",
    icon: <IconTableColumn className="h-12 w-12 text-blue-600 bg-blue-100 p-2 rounded-full" />,
    className: "md:col-span-2 bg-blue-50 hover:bg-blue-100 transition-colors duration-300 shadow-md"
  }
];

function Page() {
  const { data: session, status } = useSession();
  const userStatus = useSelector((state: { auth: AuthState })  => state.auth.status);
  const dispatch = useDispatch();
  useEffect(() => {
    // Check localStorage on component mount
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        dispatch(login(parsedSession))
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem('session');
      }
    }
  }, [dispatch]);

  useEffect(() => {
    // Update localStorage when session changes
    if (session) {
      localStorage.setItem('session', JSON.stringify(session));
      console.log(session.user)
      dispatch(login(session))
    }
  }, [session,dispatch]);

  // Show loading state only on initial load when no local data is available
  if (status === 'loading' && !userStatus) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const isAuthenticated = session || userStatus;

  return (
    <>
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-7xl font-bold text-green-500 mb-8">
        Simple way
      </h1>
      <h1 className="text-6xl font-serif text-gray-600 mb-8">
        to manage personal finances
      </h1>
      <div>
        <Link href='/add-transaction'>
          <Button>
            Get Started
          </Button>
        </Link>
      </div>
    </div>
    <div className="bg-gradient-to-br from-stone-100 to-stone-200  py-16 rounded-2xl shadow-md">
      <BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem]">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            //header={item.header}
            className={item.className}
            icon={item.icon}
          />
        ))}
      </BentoGrid>
    </div>
    </>
  );
}

export default Page;