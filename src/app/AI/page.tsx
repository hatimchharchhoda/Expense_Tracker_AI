// app/AI/page.tsx (updated)
'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import ChatBot from '@/components/ChatBot'
import Recommendations from '@/components/Recommendations'
import { useTheme } from 'next-themes'
import { Bot, Lightbulb, Brain, Sparkles, BarChart } from 'lucide-react'
import { FinancialDataProvider } from '@/components/FinancialDataProvider'

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState("recommendations")
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Set mounted state to enable client-side rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render UI until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <FinancialDataProvider>
      <div className="container mx-auto py-10 px-4 max-w-5xl">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Financial AI Assistant</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get personalized financial insights, recommendations, and answers to your money questions
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger 
              value="recommendations" 
              className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 px-4 py-2"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger 
              value="askAi" 
              className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 px-4 py-2"
            >
              <Bot className="h-4 w-4 mr-2" />
              Ask AI
            </TabsTrigger>
          </TabsList>
          
          <Card className="border border-border shadow-md">
            <CardHeader className="pb-0">
              {activeTab === "recommendations" ? (
                <>
                  <CardTitle className="flex items-center text-xl text-foreground">
                    <Lightbulb className="h-5 w-5 mr-2 text-amber-500 dark:text-amber-400" />
                    Smart Financial Recommendations
                  </CardTitle>
                  <CardDescription>
                    AI-powered insights based on your spending patterns and financial habits
                  </CardDescription>
                </>
              ) : (
                <>
                  <CardTitle className="flex items-center text-xl text-foreground">
                    <Bot className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Ask Your Financial Questions
                  </CardTitle>
                  <CardDescription>
                    Get personalized answers about budgeting, saving, and managing your money
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <TabsContent value="recommendations" className="mt-0 p-0">
                <Recommendations />
              </TabsContent>
              <TabsContent value="askAi" className="mt-0 p-0">
                <ChatBot />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        {/* Additional sections remain the same */}
        {/* ... */}
      </div>
    </FinancialDataProvider>
  )
}