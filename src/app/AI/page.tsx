'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import ChatBot from '@/components/ChatBot'
import Recommendations from '@/components/Recommendations'
// import AnalyzeBudget from './analyze-budget'
// import Recommendations from './recommendations'

export default function BudgetAnalysis() {
  const [activeTab, setActiveTab] = useState("recommendations")

  return (
    <div className="container mx-auto py-10">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {/* <TabsTrigger value="analyze" className="w-full">Analyze Budget</TabsTrigger> */}
          <TabsTrigger value="recommendations" className="w-full">Recommendations</TabsTrigger>
          <TabsTrigger value="askAi" className="w-full">Ask AI</TabsTrigger>
        </TabsList>
        <Card className="mt-6">
          <CardContent className="pt-6">
            {/* <TabsContent value="analyze">
              <AnalyzeBudget />
            </TabsContent> */}
            <TabsContent value="recommendations">
              <Recommendations/>
            </TabsContent>
            <TabsContent value="askAi">
              <ChatBot/>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}

