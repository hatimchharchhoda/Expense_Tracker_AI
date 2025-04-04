"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { login } from "@/store/authSlice"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import { ArrowRight, PieChart, BarChart3, Wallet, TrendingUp, MessageSquare, CheckCircle2, Menu, X } from "lucide-react"
import { useState } from "react"

export interface AuthState {
  status: boolean
  userData: any | null
}

const features = [
  {
    title: "Smart Expense Classification",
    description: "AI-powered automatic categorization of your spending with unprecedented accuracy.",
    icon: <PieChart className="h-10 w-10 text-emerald-600" />,
    className:
      "md:col-span-2 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-lg transition-all duration-300",
  },
  {
    title: "AI Budget Advisor",
    description: "Personalized financial guidance through AI-powered conversational budget planning.",
    icon: <MessageSquare className="h-10 w-10 text-teal-600" />,
    className: "md:col-span-1 bg-gradient-to-br from-teal-50 to-teal-100 hover:shadow-lg transition-all duration-300",
  },
  {
    title: "Financial Insights",
    description: "Deep analysis of your spending habits with personalized financial recommendations.",
    icon: <BarChart3 className="h-10 w-10 text-cyan-600" />,
    className: "md:col-span-1 bg-gradient-to-br from-cyan-50 to-cyan-100 hover:shadow-lg transition-all duration-300",
  },
  {
    title: "Real-time Expense Tracking",
    description: "Instant transaction monitoring and comprehensive financial dashboard.",
    icon: <TrendingUp className="h-10 w-10 text-green-600" />,
    className: "md:col-span-2 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-300",
  },
]

const testimonials = [
  {
    quote: "This app completely transformed how I manage my finances. The AI categorization is spot on!",
    author: "Sarah Johnson",
    role: "Marketing Professional",
  },
  {
    quote: "I've tried many expense trackers, but this one's budget advisor feature is a game-changer.",
    author: "Michael Chen",
    role: "Software Engineer",
  },
  {
    quote: "The insights I get from this app helped me save an extra $400 every month.",
    author: "Priya Patel",
    role: "Small Business Owner",
  },
]

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with expense tracking",
    features: ["Basic expense tracking", "Manual categorization", "Monthly reports", "Up to 100 transactions"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$9.99",
    period: "per month",
    description: "Advanced features for better financial management",
    features: [
      "Smart AI categorization",
      "Unlimited transactions",
      "Budget advisor",
      "Advanced insights",
      "Data export options",
      "Priority support",
    ],
    cta: "Try Free for 14 Days",
    highlighted: true,
  },
]

export default function Page() {
  const { data: session, status } = useSession();
  const userStatus = useSelector((state: { auth: AuthState }) => state.auth.status);
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check localStorage on component mount
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        dispatch(login(parsedSession));
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
      dispatch(login(session));
    }
  }, [session, dispatch]);

  // Show loading state only on initial load when no local data is available
  if (status === 'loading' && !userStatus) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading your financial dashboard...</p>
      </div>
    );
  }

  const isAuthenticated = session || userStatus;

  return (
    <div className="min-h-screen flex flex-col">


      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white to-green-50 py-20 sm:py-25">
          <div className="absolute inset-0 z-0 opacity-30">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="max-w-xl">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  <span className="text-green-500">Smart</span> way to manage personal finances
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600">
                  Take control of your money with AI-powered expense tracking, intelligent categorization, and personalized financial insights.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link href={isAuthenticated ? "/dashboard" : "/signup"}>
                    <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="#features1">
                    <Button variant="outline" className="border-green-500 text-green-500 hover:bg-green-50 px-8 py-6 text-lg rounded-lg w-full sm:w-auto">
                      See Features
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="relative">
                <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white">
                  <Image
                    src="/image.png"
                    alt="FinTrack Dashboard Preview"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-green-500/20 backdrop-blur-xl"></div>
                <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-cyan-500/20 backdrop-blur-xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-6">
                <p className="text-3xl sm:text-4xl font-bold text-green-500">50K+</p>
                <p className="mt-2 text-gray-600">Active Users</p>
              </div>
              <div className="p-6">
                <p className="text-3xl sm:text-4xl font-bold text-green-500">$2.5M</p>
                <p className="mt-2 text-gray-600">Monthly Tracked</p>
              </div>
              <div className="p-6">
                <p className="text-3xl sm:text-4xl font-bold text-green-500">98%</p>
                <p className="mt-2 text-gray-600">Accuracy Rate</p>
              </div>
              <div className="p-6">
                <p className="text-3xl sm:text-4xl font-bold text-green-500">30%</p>
                <p className="mt-2 text-gray-600">Avg. Savings</p>
              </div>
            </div>
          </div>
        </section>
        <section  id="features1" className="pt-40 bg-gray-50">

        </section>
        {/* Features Section */}
        <section id="features" className="pb-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Powerful Features</h2>
              <p className="mt-4 text-lg text-gray-600">
                Our AI-powered tools help you track, analyze, and optimize your personal finances.
              </p>
            </div>
            
            <BentoGrid className="max-w-5xl mx-auto md:auto-rows-[20rem]">
              {features.map((feature, i) => (
                <BentoGridItem
                  key={i}
                  title={feature.title}
                  description={feature.description}
                  className={feature.className}
                  icon={feature.icon}
                />
              ))}
            </BentoGrid>
          </div>
        </section>
      </main>
      </div>
  )
}