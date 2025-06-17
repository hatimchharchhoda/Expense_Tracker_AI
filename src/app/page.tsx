"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { login } from "@/store/authSlice"
import Link from "next/link"
import Image from "next/image"
import AddToHomeButton from "@/components/InstallPWA"
import { Button } from "@/components/ui/button"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import { 
  ArrowRight, 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  ChevronDown 
} from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

export interface AuthState {
  status: boolean
  userData: any | null
}

const features = [
  {
    title: "Smart Expense Classification",
    description: "AI-powered automatic categorization of your spending with unprecedented accuracy.",
    icon: <PieChart className="h-8 w-8 md:h-10 md:w-10 text-emerald-600 dark:text-emerald-500" />,
    className:
      "col-span-1 md:col-span-2 bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 dark:from-emerald-950/30 dark:to-emerald-900/30 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300",
  },
  {
    title: "AI Budget Advisor",
    description: "Personalized financial guidance through AI-powered conversational budget planning.",
    icon: <MessageSquare className="h-8 w-8 md:h-10 md:w-10 text-teal-600 dark:text-teal-500" />,
    className: "col-span-1 bg-gradient-to-br from-teal-50/80 to-teal-100/80 dark:from-teal-950/30 dark:to-teal-900/30 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300",
  },
  {
    title: "Financial Insights",
    description: "Deep analysis of your spending habits with personalized financial recommendations.",
    icon: <BarChart3 className="h-8 w-8 md:h-10 md:w-10 text-cyan-600 dark:text-cyan-500" />,
    className: "col-span-1 bg-gradient-to-br from-cyan-50/80 to-cyan-100/80 dark:from-cyan-950/30 dark:to-cyan-900/30 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300",
  },
  {
    title: "Real-time Expense Tracking",
    description: "Instant transaction monitoring and comprehensive financial dashboard.",
    icon: <TrendingUp className="h-8 w-8 md:h-10 md:w-10 text-green-600 dark:text-green-500" />,
    className: "col-span-1 md:col-span-2 bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-950/30 dark:to-green-900/30 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300",
  },
]

export default function Page() {
  const { data: session, status } = useSession();
  const userStatus = useSelector((state: { auth: AuthState }) => state.auth.status);
  const dispatch = useDispatch();

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
  if (session?.user?._id) {
    localStorage.setItem('session', JSON.stringify(session));
    dispatch(login(session as AuthState["userData"]));
  }
}, [session, dispatch]);

  // Show loading state only on initial load when no local data is available
  if (status === 'loading' && !userStatus) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="w-10 h-10 md:w-12 md:h-12 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading your financial dashboard...</p>
      </div>
    );
  }

  const isAuthenticated = session || userStatus;

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden max-w-full">
      <AddToHomeButton />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-32 md:w-56 lg:w-72 h-32 md:h-56 lg:h-72 bg-green-100 dark:bg-green-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-0 left-6 md:left-16 w-32 md:w-56 lg:w-72 h-32 md:h-56 lg:h-72 bg-blue-100 dark:bg-blue-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-16 md:bottom-32 right-6 md:right-24 w-32 md:w-56 lg:w-72 h-32 md:h-56 lg:h-72 bg-purple-100 dark:bg-purple-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            
            <div className="absolute inset-0 opacity-10">
              <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
          </div>
          
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="max-w-xl mx-auto lg:mx-0">
                <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 mb-4">
                  <span className="text-green-800 dark:text-green-400 text-xs font-medium">AI-powered financial management</span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-teal-500 to-blue-500 dark:from-green-400 dark:via-teal-300 dark:to-blue-400">Smart</span> way to manage personal finances
                </h1>
                
                <p className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground">
                  Take control of your money with AI-powered expense tracking, intelligent categorization, and personalized financial insights.
                </p>
                
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4">
                  <Link href={isAuthenticated ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
                    <Button className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-300 w-full h-auto">
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <Link href="#features1" className="w-full sm:w-auto">
                    <Button variant="outline" className="border-2 border-teal-500 dark:border-teal-700 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg w-full h-auto transition-all duration-300">
                      See Features
                    </Button>
                  </Link>
                </div>
                
                <div className="mt-8 md:mt-12 hidden sm:block">
                  <a href="#features1" className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                    <ChevronDown className="h-6 w-6 md:h-8 md:w-8 animate-bounce" />
                  </a>
                </div>
              </div>
              
              <div className="relative mt-6 lg:mt-0">
                <div className="absolute -z-10 inset-0 bg-gradient-to-r from-green-100/40 to-blue-100/40 dark:from-green-900/20 dark:to-blue-900/20 rounded-3xl blur-xl transform rotate-3 scale-105"></div>
                
                <div className="relative rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
                  <Image
                    src="/image.png"
                    alt="FinTrack Dashboard Preview"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
            
              </div>
            </div>
          </div>
        </section>
        
        <section id="features1" className="pt-8 sm:pt-12 bg-background">
          {/* Empty section for anchor navigation */}
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-12 sm:py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
              <div className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 mb-3">
                <span className="text-blue-800 dark:text-blue-400 text-xs font-medium">Key Features</span>
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Powerful Features</h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                Our AI-powered tools help you track, analyze, and optimize your personal finances.
              </p>
            </div>
            
            <BentoGrid className="max-w-5xl mx-auto grid-cols-1 sm:grid-cols-2 md:auto-rows-[16rem] lg:auto-rows-[18rem] gap-3 sm:gap-4">
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
        
        {/* CTA Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-br from-teal-500 to-green-500 dark:from-teal-900 dark:to-green-900">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4">Ready to Take Control of Your Finances?</h2>
            <p className="text-sm sm:text-base text-teal-50 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of users who have improved their financial health with our AI-powered expense tracker.
            </p>
            
            <Link href={isAuthenticated ? "/dashboard" : "/signup"}>
              <Button className="bg-white hover:bg-gray-100 text-teal-600 px-5 py-2 sm:py-3 text-sm sm:text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-sm sm:text-base font-bold text-foreground mb-3">Expense Tracker</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Take control of your finances with our AI-powered tools and insights.</p>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2 sm:mb-3">FEATURES</h3>
              <ul className="space-y-1 sm:space-y-1.5">
                <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Smart Classification</Link></li>
                <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">AI Budget Advisor</Link></li>
                <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Financial Insights</Link></li>
                <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Expense Tracking</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2 sm:mb-3">COMPANY</h3>
              <ul className="space-y-1 sm:space-y-1.5">
                <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2 sm:mb-3">LEGAL</h3>
              <ul className="space-y-1 sm:space-y-1.5">
                <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          
                    <div className="border-t border-border mt-6 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Expense Tracker. All rights reserved.</p>
            
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </Link>
              
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}