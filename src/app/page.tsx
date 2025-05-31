"use client"

//import "../globals.css"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { login } from "@/store/authSlice"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import {
  ArrowRightCircle,
  BarChart3,
  CreditCard,
  LineChart,
  MessageCircle,
  PieChart,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export interface AuthState {
  status: boolean
  userData: any | null
}

const features = [
  {
    title: "Smart Expense Classification",
    description: "AI-powered automatic categorization of your spending with unprecedented accuracy.",
    icon: <Sparkles className="h-12 w-12 text-amber-600 bg-amber-100 p-2 rounded-full" />,
    className:
      "md:col-span-2 bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 transition-colors duration-300 shadow-md border border-amber-200",
  },
  {
    title: "AI Budget Advisor",
    description: "Personalized financial guidance through AI-powered conversational budget planning.",
    icon: <MessageCircle className="h-12 w-12 text-emerald-600 bg-emerald-100 p-2 rounded-full" />,
    className:
      "md:col-span-1 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 transition-colors duration-300 shadow-md border border-emerald-200",
  },
  {
    title: "Financial Insights",
    description: "Deep analysis of your spending habits with personalized financial recommendations.",
    icon: <PieChart className="h-12 w-12 text-violet-600 bg-violet-100 p-2 rounded-full" />,
    className:
      "md:col-span-1 bg-gradient-to-br from-violet-50 to-violet-100 hover:from-violet-100 hover:to-violet-200 transition-colors duration-300 shadow-md border border-violet-200",
  },
  {
    title: "Real-time Expense Tracking",
    description: "Instant transaction monitoring and comprehensive financial dashboard.",
    icon: <LineChart className="h-12 w-12 text-blue-600 bg-blue-100 p-2 rounded-full" />,
    className:
      "md:col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-colors duration-300 shadow-md border border-blue-200",
  },
]


function Page() {
  const { data: session, status } = useSession()
  const userStatus = useSelector((state: { auth: AuthState }) => state.auth.status)
  const dispatch = useDispatch()
  const [progress, setProgress] = useState(13)

  useEffect(() => {
    // Animate progress bar
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Check localStorage on component mount
    const storedSession = localStorage.getItem("session")
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession)
        dispatch(login(parsedSession))
      } catch (error) {
        console.error("Error parsing stored session:", error)
        localStorage.removeItem("session")
      }
    }
  }, [dispatch])

  useEffect(() => {
    // Update localStorage when session changes
    if (session) {
      localStorage.setItem("session", JSON.stringify(session))
      console.log(session.user)
      dispatch(login(session))
    }
  }, [session, dispatch])

  // Show loading state only on initial load when no local data is available
  if (status === "loading" && !userStatus) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 mt-4">Loading your financial dashboard...</p>
      </div>
    )
  }

  const isAuthenticated = session || userStatus

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-12 md:pt-32 md:pb-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(120,190,140,0.12),rgba(255,255,255,0))]"></div>
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent mb-4 animate-fade-in">
                Smart Finance
              </h1>
              <h2 className="text-3xl md:text-5xl font-serif text-gray-700 mb-6">Simplify your personal finances</h2>
              <p className="text-gray-600 text-lg mb-8 max-w-lg">
                Track expenses, set budgets, and gain insights with our AI-powered financial management platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/add-transaction">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white gap-2 group">
                    Get Started
                    <ArrowRightCircle className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="border-green-600 text-green-600 hover:bg-green-50">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 mt-10 md:mt-0">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg blur-lg opacity-50 animate-pulse"></div>
                <Card className="relative shadow-xl border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-green-600" />
                      Financial Overview
                    </CardTitle>
                    <CardDescription>Your monthly summary at a glance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-green-200 bg-green-50 text-green-700">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Powerful Financial Tools</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our comprehensive suite of financial management features helps you take control of your money.
            </p>
          </div>
          <BentoGrid className="max-w-5xl mx-auto md:auto-rows-[20rem]">
            {features.map((item, i) => (
              <BentoGridItem
                key={i}
                title={item.title}
                description={item.description}
                className={item.className}
                icon={item.icon}
              />
            ))}
          </BentoGrid>
        </div>
      </section>


      {/* Testimonials Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-green-200 bg-green-50 text-green-700">
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">What Our Users Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of users who have transformed their financial habits with our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Alex Johnson",
                role: "Small Business Owner",
                avatar: "A",
                quote:
                  "This app has completely transformed how I manage both my personal and business finances. The insights are incredibly valuable.",
              },
              {
                name: "Sarah Williams",
                role: "Freelance Designer",
                avatar: "S",
                quote:
                  "As a freelancer with irregular income, this app helps me budget effectively and plan for taxes. The AI suggestions are spot on!",
              },
              {
                name: "Michael Chen",
                role: "Graduate Student",
                avatar: "M",
                quote:
                  "Perfect for students on a tight budget. I've managed to save for a vacation while paying off my student loans thanks to the budgeting tools.",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar>
                      <AvatarFallback className="bg-green-100 text-green-800">{testimonial.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Ready to Take Control of Your Finances?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Join thousands of users who have transformed their financial habits with our intuitive platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/add-transaction">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <CreditCard className="h-5 w-5" />
                Start Tracking Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Page