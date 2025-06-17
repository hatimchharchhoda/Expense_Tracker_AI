// components/ChatBot.tsx - Enhanced implementation with month-wise filtering
import { useChat } from 'ai/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Bot, RefreshCw, AlertTriangle, Calendar, Info, Send, Sparkles } from 'lucide-react'
import { useEffect, useState, useRef, useMemo } from 'react'
import { useFinancialData } from './FinancialDataProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ChatBot() {
  const financialData = useFinancialData()
  const [systemMessage, setSystemMessage] = useState('')
  const [responseTimeout, setResponseTimeout] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Month/Year filtering state for AI context
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [useMonthFilter, setUseMonthFilter] = useState(false)
  
  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Generate year options
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years: number[] = []
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      years.push(year)
    }
    return years
  }, [])

  // Filter financial data by selected month/year when month filter is enabled
  const contextualFinancialData = useMemo(() => {
    if (!financialData || financialData.isLoading || !useMonthFilter) {
      return financialData
    }

    // Filter transactions by selected month/year
    const filteredTransactions = financialData.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return transactionDate.getMonth() + 1 === selectedMonth && 
             transactionDate.getFullYear() === selectedYear
    })

    // Filter budgets by selected month/year
    const filteredBudgets = financialData.budgets.filter(budget => 
      budget.month === selectedMonth && budget.year === selectedYear
    )

    // Recalculate insights for filtered data
    const expenseTransactions = filteredTransactions.filter(tx => 
      tx.type !== 'Income' && tx.type !== 'Investment' && tx.type !== 'Savings'
    )
    const incomeTransactions = filteredTransactions.filter(tx => tx.type === 'Income')
    const savingsTransactions = filteredTransactions.filter(tx => tx.type === 'Savings')
    
    const totalIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const totalExpenses = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const totalSavings = savingsTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const netBalance = totalIncome - totalExpenses - totalSavings

    // Get spending by category for filtered data
    const spendingByCategory: Record<string, number> = {}
    expenseTransactions.forEach(tx => {
      const category = tx.type
      if (!spendingByCategory[category]) spendingByCategory[category] = 0
      spendingByCategory[category] += tx.amount
    })

    // Calculate top expense categories for filtered data
    const topExpenseCategories = Object.entries(spendingByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    return {
      ...financialData,
      transactions: filteredTransactions,
      budgets: filteredBudgets,
      summary: {
        ...financialData.summary,
        totalIncome,
        totalExpenses,
        totalSavings,
        netBalance,
        transactionCount: filteredTransactions.length
      },
      topExpenseCategories
    }
  }, [financialData, selectedMonth, selectedYear, useMonthFilter])

  // Enhanced system message with better context and month detection
  useEffect(() => {
    if (contextualFinancialData && !contextualFinancialData.isLoading) {
      const summary = contextualFinancialData.summary
      const periodContext = useMonthFilter 
        ? `${monthNames[selectedMonth - 1]} ${selectedYear}` 
        : 'all time'
      
      let message = `You are a personal financial advisor with access to detailed transaction data. You must provide accurate, data-driven responses based on the exact information provided below.

ANALYSIS PERIOD: ${periodContext.toUpperCase()}
Current Date: ${new Date().toLocaleDateString('en-IN')}

FINANCIAL SUMMARY FOR ${periodContext.toUpperCase()}:
- Total Income: ₹${summary.totalIncome.toLocaleString('en-IN')}
- Total Expenses: ₹${summary.totalExpenses.toLocaleString('en-IN')}
- Total Savings: ₹${(summary.totalSavings || 0).toLocaleString('en-IN')}
- Net Balance: ₹${summary.netBalance.toLocaleString('en-IN')} ${summary.netBalance >= 0 ? '(Surplus)' : '(Deficit)'}
- Total Transactions: ${summary.transactionCount}

EXPENSE BREAKDOWN BY CATEGORY FOR ${periodContext.toUpperCase()}:`

      if (contextualFinancialData.topExpenseCategories && contextualFinancialData.topExpenseCategories.length > 0) {
        contextualFinancialData.topExpenseCategories.forEach((category, index) => {
          message += `\n${index + 1}. ${category.category}: ₹${category.amount.toLocaleString('en-IN')} (${category.percentage.toFixed(1)}% of total expenses)`
        })
        
        // Add the highest spending category for easy reference
        const topCategory = contextualFinancialData.topExpenseCategories[0]
        message += `\n\nHIGHEST SPENDING CATEGORY: ${topCategory.category} with ₹${topCategory.amount.toLocaleString('en-IN')}`
      } else {
        message += '\nNo expense data available for this period.'
      }

      // Add monthly breakdown for all-time analysis
      if (!useMonthFilter && contextualFinancialData.transactions.length > 0) {
        message += '\n\nMONTHLY BREAKDOWN (All Available Data):'
        const monthlyData: Record<string, { expenses: number, income: number, transactions: number }> = {}
        
        contextualFinancialData.transactions.forEach(tx => {
          const date = new Date(tx.date)
          const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { expenses: 0, income: 0, transactions: 0 }
          }
          
          monthlyData[monthKey].transactions++
          if (tx.type === 'Income') {
            monthlyData[monthKey].income += tx.amount
          } else if (tx.type !== 'Savings' && tx.type !== 'Investment') {
            monthlyData[monthKey].expenses += tx.amount
          }
        })
        
        Object.entries(monthlyData)
          .sort(([a], [b]) => new Date(`1 ${a}`).getTime() - new Date(`1 ${b}`).getTime())
          .slice(-6) // Last 6 months
          .forEach(([month, data]) => {
            message += `\n- ${month}: ₹${data.expenses.toLocaleString('en-IN')} expenses, ₹${data.income.toLocaleString('en-IN')} income (${data.transactions} transactions)`
          })
      }

      // Add recent transactions with dates
      message += `\n\nRECENT TRANSACTIONS FOR ${periodContext.toUpperCase()}:`
      if (contextualFinancialData.transactions && contextualFinancialData.transactions.length > 0) {
        const recentTransactions = contextualFinancialData.transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10)
        
        recentTransactions.forEach((tx, index) => {
          const date = new Date(tx.date).toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })
          message += `\n${index + 1}. ${tx.name}: ₹${tx.amount.toLocaleString('en-IN')} (${tx.type}) - ${date}`
        })
      } else {
        message += '\nNo transactions available for this period.'
      }

      // Add budget information if available
      if (contextualFinancialData.budgets && contextualFinancialData.budgets.length > 0) {
        message += `\n\nBUDGET STATUS FOR ${periodContext.toUpperCase()}:`
        contextualFinancialData.budgets.forEach((budget, index) => {
          const spent = contextualFinancialData.topExpenseCategories?.find(cat => cat.category === budget.category)?.amount || 0
          const remaining = budget.amount - spent
          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
          const status = percentage > 100 ? 'OVER BUDGET' : percentage > 80 ? 'NEAR LIMIT' : 'ON TRACK'
          
          message += `\n${index + 1}. ${budget.category}: Budgeted ₹${budget.amount.toLocaleString('en-IN')}, Spent ₹${spent.toLocaleString('en-IN')}, Remaining ₹${remaining.toLocaleString('en-IN')} (${percentage.toFixed(1)}% used) - ${status}`
        })
      }

      message += `

IMPORTANT INSTRUCTIONS:
1. ALWAYS mention the analysis period (${periodContext}) in your responses.
2. When asked about spending patterns, refer to the EXPENSE BREAKDOWN BY CATEGORY section with exact amounts and percentages.
3. For month-specific questions (like "spending in May"), check if the current analysis period matches. If not, suggest changing the analysis period.
4. Use the exact transaction data provided - never make assumptions or estimates.
5. For budget questions, refer to the BUDGET STATUS section with specific percentages and remaining amounts.
6. Always use Indian Rupee (₹) format with proper comma separation.
7. If asked about trends or comparisons, use the MONTHLY BREAKDOWN data when available.
8. Provide specific, actionable advice based on the actual numbers.
9. If no data exists for a question, clearly state this rather than guessing.

MONTH DETECTION RULES:
- If user asks about a specific month (January, February, March, April, May, June, July, August, September, October, November, December), suggest switching to that month's analysis.
- Current analysis period: ${periodContext}
- Available transaction months: ${!useMonthFilter ? 'All months with data shown in MONTHLY BREAKDOWN' : 'Current month only'}

Remember: Base ALL responses on the exact data provided above. Be specific with numbers and always reference the analysis period.`
      
      setSystemMessage(message)
    }
  }, [contextualFinancialData, selectedMonth, selectedYear, useMonthFilter, monthNames])

  // Enhanced submit handler with month detection and context
  const handleEnhancedSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (contextualFinancialData && !contextualFinancialData.isLoading) {
      let enhancedInput = input
      const lowerInput = input.toLowerCase()
      
      // Detect specific month mentions
      const mentionedMonth = monthNames.find(month => 
        lowerInput.includes(month.toLowerCase())
      )
      
      // Detect year mentions
      const yearMatch = lowerInput.match(/\b(20\d{2})\b/)
      const mentionedYear = yearMatch ? parseInt(yearMatch[1]) : null
      
      // Current analysis context
      const periodContext = useMonthFilter 
        ? `${monthNames[selectedMonth - 1]} ${selectedYear}` 
        : 'all time'
      
      // Add context and suggestions based on the question
      if (mentionedMonth || mentionedYear) {
        const suggestedMonth = mentionedMonth ? monthNames.indexOf(mentionedMonth) + 1 : selectedMonth
        const suggestedYear = mentionedYear || selectedYear
        
        if (!useMonthFilter || suggestedMonth !== selectedMonth || suggestedYear !== selectedYear) {
          enhancedInput += `\n\n[SYSTEM CONTEXT: User is asking about ${mentionedMonth || 'a specific month'}${mentionedYear ? ` ${mentionedYear}` : ''}, but current analysis is for ${periodContext}. Suggest changing the analysis period to get accurate results for the requested time period.]`
        }
      }
      
      // Add data context for spending/budget questions
      if (lowerInput.includes('spend') || lowerInput.includes('expense') || lowerInput.includes('budget')) {
        enhancedInput += `\n\n[ANALYSIS CONTEXT: Question is about ${periodContext} data. Current data shows ${contextualFinancialData.summary.transactionCount} transactions with ₹${contextualFinancialData.summary.totalExpenses.toLocaleString('en-IN')} total expenses.]`
      }
      
      // Submit the enhanced input
      handleSubmit({ preventDefault: () => {} } as any, { 
        data: { messages: [{ content: enhancedInput, role: "user" }] } 
      })
    } else {
      handleSubmit(e)
    }
  }

  // Initialize chat with the system message
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, error } = useChat({
    initialMessages: systemMessage ? [
      { id: 'system', role: 'system', content: systemMessage }
    ] : [],
    api: '/api/chat',
    onResponse: () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        setResponseTimeout(false)
      }
    }
  })

  // Set up timeout detection
  useEffect(() => {
    if (isLoading) {
      setResponseTimeout(false)
      timeoutRef.current = setTimeout(() => {
        setResponseTimeout(true)
      }, 20000) // Increased to 20 seconds
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isLoading])

  // Update system message when it changes
  useEffect(() => {
    if (systemMessage) {
      setMessages([
        { id: 'system', role: 'system', content: systemMessage }
      ])
    }
  }, [systemMessage, setMessages])

  // Enhanced message formatting with better styling
  const formatMessage = (content: string) => {
    let formattedContent = content
    
    // Format currency
    formattedContent = formattedContent.replace(/₹(\d+)/g, '<span class="font-semibold text-green-600 dark:text-green-400">₹$1</span>')
    
    // Format percentages
    formattedContent = formattedContent.replace(/(\d+\.?\d*)%/g, '<span class="font-medium text-blue-600 dark:text-blue-400">$1%</span>')
    
    // Format categories/important terms
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-purple-600 dark:text-purple-400">$1</span>')
    
    if (content.includes('1.') || content.includes('•')) {
      const lines = content.split('\n')
      return (
        <div className="space-y-1.5">
          {lines.map((line, index) => {
            if (line.match(/^\d+\./)) {
              return (
                <div key={index} className="flex gap-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[20px]">
                    {line.match(/^\d+\./)?.[0]}
                  </span>
                  <div 
                    className="flex-1"
                    dangerouslySetInnerHTML={{ 
                      __html: line.replace(/^\d+\.\s*/, '')
                    }} 
                  />
                </div>
              )
            } else if (line.startsWith('•')) {
              return (
                <div key={index} className="flex gap-2">
                  <span className="text-blue-600 dark:text-blue-400 min-w-[20px]">•</span>
                  <span 
                    className="flex-1"
                    dangerouslySetInnerHTML={{ __html: line.substring(1).trim() }} 
                  />
                </div>
              )
            } else {
              return <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
            }
          })}
        </div>
      )
    }
    
    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
  }

  // Sample questions based on current context
  const getSampleQuestions = () => {
    const periodText = useMonthFilter ? `in ${monthNames[selectedMonth - 1]} ${selectedYear}` : 'overall'
    
    return [
      `What was my highest spending category ${periodText}?`,
      `How much did I spend on Food ${periodText}?`,
      `Am I over budget in any categories ${periodText}?`,
      `What's my savings rate ${periodText}?`,
      `Show me my expense breakdown ${periodText}`,
      `How can I reduce my expenses ${periodText}?`
    ]
  }

  if (financialData.isLoading) {
    return (
            <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-muted-foreground">Loading your financial data...</span>
      </div>
    )
  }

  if (financialData.error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Bot className="h-12 w-12 text-blue-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Unable to load financial data</h3>
        <p className="text-muted-foreground mb-4">
          Your financial data is needed for personalized AI responses
        </p>
        <Button onClick={financialData.refreshData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>
    )
  }

  if (financialData.transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Bot className="h-12 w-12 text-blue-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">No transaction data available</h3>
        <p className="text-muted-foreground mb-4">
          Add some transactions first so our AI can give you personalized answers
        </p>
        <Button asChild>
          <a href="/add-transaction">Add Your First Transaction</a>
        </Button>
      </div>
    )
  }

  const sampleQuestions = getSampleQuestions()

  return (
    <div className="space-y-6">
      {/* Analysis Period Control */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                AI Analysis Period
              </CardTitle>
              <CardDescription>
                Choose the time period for AI analysis and responses
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant={!useMonthFilter ? "default" : "outline"}
                size="sm"
                onClick={() => setUseMonthFilter(false)}
                className="text-xs"
              >
                All Time
              </Button>
              <Button
                variant={useMonthFilter ? "default" : "outline"}
                size="sm"
                onClick={() => setUseMonthFilter(true)}
                className="text-xs"
              >
                Specific Month
              </Button>
            </div>
          </div>
          
          {useMonthFilter && (
            <div className="flex items-center gap-2 pt-3 border-t border-border">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-muted-foreground mr-3">Analyzing data for:</span>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Quick Data Summary for Context */}
      {contextualFinancialData && (
        <Card className="bg-accent/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Period</p>
                <p className="font-medium">
                  {useMonthFilter 
                    ? `${monthNames[selectedMonth - 1]} ${selectedYear}` 
                    : 'All Time'
                  }
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Transactions</p>
                <p className="font-medium">{contextualFinancialData.summary.transactionCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Expenses</p>
                <p className="font-medium text-red-600 dark:text-red-400">
                  ₹{contextualFinancialData.summary.totalExpenses.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Top Category</p>
                <p className="font-medium text-blue-600 dark:text-blue-400">
                  {contextualFinancialData.topExpenseCategories?.[0]?.category || 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="border border-border shadow-sm">
        <CardContent className="p-0">
          {/* Welcome Message */}
          {messages.length <= 1 && (
            <div className="p-6 border-b border-border bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center mb-3">
                <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="font-semibold text-foreground">Financial AI Assistant</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {useMonthFilter ? `${monthNames[selectedMonth - 1]} ${selectedYear}` : 'All Time'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                I can analyze your financial data and answer questions about spending patterns, budgets, and financial goals. 
                {useMonthFilter ? ` Currently analyzing data for ${monthNames[selectedMonth - 1]} ${selectedYear}.` : ' Currently analyzing all your transaction data.'}
              </p>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Try asking:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sampleQuestions.slice(0, 4).map((question, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      size="sm" 
                      className="justify-start text-xs h-auto py-2 px-3 bg-white/50 dark:bg-gray-800/50 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      onClick={() => {
                        handleInputChange({ target: { value: question } } as any)
                        handleEnhancedSubmit({ preventDefault: () => {} } as any)
                      }}
                    >
                      <Sparkles className="h-3 w-3 mr-2 text-blue-500" />
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation Messages */}
          <div className="max-h-[500px] overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.filter(m => m.role !== 'system').map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-xl ${
                    m.role === 'user' 
                      ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-br-md' 
                      : 'bg-gray-100 dark:bg-gray-800 text-foreground rounded-bl-md border border-border'
                  }`}>
                    {m.role === 'assistant' && (
                      <div className="flex items-center mb-2">
                        <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                        <span className="text-xs font-medium text-muted-foreground">
                          AI Assistant
                        </span>
                      </div>
                    )}
                    <div className="text-sm">
                      {typeof m.content === 'string' ? formatMessage(m.content) : m.content}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4 rounded-xl bg-gray-100 dark:bg-gray-800 border border-border rounded-bl-md">
                    {responseTimeout ? (
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-muted-foreground text-sm">
                          This is taking longer than expected...
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-xs ml-1"
                            onClick={() => window.location.reload()}
                          >
                            Refresh Page
                          </Button>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-muted-foreground text-sm">
                          Analyzing your financial data...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-bl-md">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Sorry, there was an error</p>
                        <p className="text-xs mt-1">Please try asking a different question or refresh the page.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Form */}
          <div className="p-4 border-t border-border bg-accent/30">
            <form onSubmit={handleEnhancedSubmit} className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder={`Ask about your finances ${useMonthFilter ? `for ${monthNames[selectedMonth - 1]} ${selectedYear}` : ''}...`}
                  className="flex-grow"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  className="px-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Quick action buttons */}
              <div className="flex flex-wrap gap-1">
                {sampleQuestions.slice(4, 6).map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      handleInputChange({ target: { value: question } } as any)
                    }}
                    disabled={isLoading}
                  >
                    {question}
                  </Button>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                💡 Tip: Ask specific questions like "What was my highest spending in May?" or "Am I over budget this month?"
              </p>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Data Availability Info */}
      {contextualFinancialData && (
        <Card className="border-dashed border-muted-foreground/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  AI has access to {contextualFinancialData.summary.transactionCount} transactions
                  {useMonthFilter && ` for ${monthNames[selectedMonth - 1]} ${selectedYear}`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={financialData.refreshData}
                className="text-xs h-6"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}