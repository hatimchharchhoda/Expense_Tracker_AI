// components/ChatBot.tsx - completely revised implementation
import { useChat } from 'ai/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Bot, RefreshCw, AlertTriangle } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useFinancialData } from './FinancialDataProvider'

export default function ChatBot() {
  const financialData = useFinancialData()
  const [systemMessage, setSystemMessage] = useState('')
  const [responseTimeout, setResponseTimeout] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Create a very explicit system message 
  useEffect(() => {
    if (financialData && !financialData.isLoading) {
      const summary = financialData.summary
      
      // Build a more structured message that forces the AI to use the data
      let message = `You are a financial assistant analyzing the user's data. Your responses MUST be based on this exact financial data:

FINANCIAL OVERVIEW:
- Income: ₹${summary.totalIncome}
- Expenses: ₹${summary.totalExpenses}
- Savings: ₹${summary.totalSavings || 0}
- Balance: ₹${summary.netBalance}

TOP SPENDING CATEGORIES:
`;

      // Add expense categories with clear formatting
      if (financialData.topExpenseCategories && financialData.topExpenseCategories.length > 0) {
        financialData.topExpenseCategories.forEach((category, index) => {
          message += `${index+1}. ${category.category}: ₹${category.amount} (${category.percentage.toFixed(1)}% of total expenses)\n`;
        });
      } else {
        message += "No expense categories available.\n";
      }
      
      // Add transaction examples
      message += "\nRECENT TRANSACTIONS:\n";
      if (financialData.transactions && financialData.transactions.length > 0) {
        financialData.transactions.slice(0, 5).forEach((tx, index) => {
          message += `${index+1}. ${tx.name}: ₹${tx.amount} (Category: ${tx.type})\n`;
        });
      }
      
      // Add extremely clear instructions
      message += `
IMPORTANT: When asked "Where am I spending the most money?" or similar questions, you MUST directly reference the TOP SPENDING CATEGORIES listed above with exact amounts and percentages.

Do NOT say you need more information about spending categories - the data is already provided above.

If asked about expense breakdown, analyze the TOP SPENDING CATEGORIES section above and provide detailed insights.
`;
      
      setSystemMessage(message);
      console.log("System message set:", message);
    }
  }, [financialData]);

  // Add a custom submission handler to include data in the user's questions
  const handleEnhancedSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Get the financial data to include with each message
    if (financialData && !financialData.isLoading) {
      const topCategories = financialData.topExpenseCategories?.map(cat => 
        `${cat.category}: ₹${cat.amount} (${cat.percentage.toFixed(1)}%)`
      ).join(", ");
      
      // Only append data for specific questions that might need it
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes("spend") || lowerInput.includes("expense") || lowerInput.includes("where")) {
        // Append financial data directly to the user's question
        const enhancedInput = `${input}\n\nFor reference, my top spending categories are: ${topCategories}`;
        handleSubmit({ preventDefault: () => {} } as any, { data: { messages: [{ content: enhancedInput, role: "user" }] } });
      } else {
        // For other questions, submit normally
        handleSubmit(e);
      }
    } else {
      // Fall back to normal submission
      handleSubmit(e);
    }
  };

  // Initialize chat with the system message
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, error } = useChat({
    initialMessages: systemMessage ? [
      { id: 'system', role: 'system', content: systemMessage }
    ] : [],
    api: '/api/chat',
    onResponse: () => {
      // Clear timeout when we get a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        setResponseTimeout(false)
      }
    }
  })

  // Set up timeout detection
  useEffect(() => {
    if (isLoading) {
      // Set a timeout for 15 seconds
      setResponseTimeout(false)
      timeoutRef.current = setTimeout(() => {
        setResponseTimeout(true)
      }, 15000)
    } else {
      // Clear timeout when not loading
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
    if (systemMessage && messages.length <= 1) {
      // Only set the system message if we haven't started a conversation yet
      setMessages([
        { id: 'system', role: 'system', content: systemMessage }
      ])
    }
  }, [systemMessage, setMessages, messages.length])

  const formatMessage = (content: string) => {
    // Check if the message contains numbered points
    if (content.includes('1.')) {
      const points = content.split(/\d+\.\s/).filter(Boolean)
      return (
        <div className="space-y-2">
          {points.map((point, index) => (
            <div key={index} className="flex gap-2">
              <span className="font-bold">{index + 1}.</span>
              <div dangerouslySetInnerHTML={{ 
                __html: point.replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold">$1</span>') 
              }} />
            </div>
          ))}
        </div>
      )
    }
    // Handle bullet points
    if (content.includes('•')) {
      const points = content.split('•').filter(Boolean)
      return (
        <div className="space-y-2">
          {points.map((point, index) => (
            <div key={index} className="flex gap-2">
              <span>•</span>
              <span>{point.trim()}</span>
            </div>
          ))}
        </div>
      )
    }
    return content
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

  return (
    <div className="space-y-6">
      {/* Chat UI */}
      <div className="flex flex-col space-y-4">
        {/* System message explanation */}
        {messages.length <= 1 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-muted-foreground border border-blue-100 dark:border-blue-900">
            <div className="flex items-center mb-2">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="font-medium text-foreground">Financial AI Assistant</span>
            </div>
            <p>
              I can answer questions about your budget, spending patterns, and give personalized financial advice based on your transaction history.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start text-xs h-auto py-1.5 bg-blue-50/50 dark:bg-blue-900/40 border-blue-100 dark:border-blue-900"
                onClick={() => {
                  const sampleQuestion = "In which Expense am I spending the most money?"
                  handleInputChange({ target: { value: sampleQuestion } } as any)
                  handleSubmit({ preventDefault: () => {} } as any)
                }}
              >
                ❓ In which Expense am I spending the most money?
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start text-xs h-auto py-1.5 bg-blue-50/50 dark:bg-blue-900/40 border-blue-100 dark:border-blue-900"
                onClick={() => {
                  const sampleQuestion = "Am I over budget in any categories?"
                  handleInputChange({ target: { value: sampleQuestion } } as any)
                  handleSubmit({ preventDefault: () => {} } as any)
                }}
              >
                ❓ Am I over budget in any categories?
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start text-xs h-auto py-1.5 bg-blue-50/50 dark:bg-blue-900/40 border-blue-100 dark:border-blue-900"
                onClick={() => {
                  const sampleQuestion = "How can I improve my financial situation?"
                  handleInputChange({ target: { value: sampleQuestion } } as any)
                  handleSubmit({ preventDefault: () => {} } as any)
                }}
              >
                ❓ How can I improve my finances?
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start text-xs h-auto py-1.5 bg-blue-50/50 dark:bg-blue-900/40 border-blue-100 dark:border-blue-900"
                onClick={() => {
                  const sampleQuestion = "What's my overall budget status this month?"
                  handleInputChange({ target: { value: sampleQuestion } } as any)
                  handleSubmit({ preventDefault: () => {} } as any)
                }}
              >
                ❓ What's my budget status?
              </Button>
            </div>
          </div>
        )}

        {/* Conversation Messages */}
        <div className="space-y-4">
          {messages.filter(m => m.role !== 'system').map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-4 rounded-lg ${
                m.role === 'user' 
                  ? 'bg-blue-600 dark:bg-blue-700 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-foreground'
              }`}>
                {typeof m.content === 'string' ? formatMessage(m.content) : m.content}
              </div>
            </div>
          ))}

          {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-md p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
              {responseTimeout ? (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-muted-foreground text-sm">
                    This is taking longer than expected...
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto text-xs ml-1"
                      onClick={() => window.location.reload()} // Force refresh
                    >
                      Refresh
                    </Button>
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-muted-foreground text-sm">Analyzing your financial data...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show error message if there's an API error */}
        {error && (
          <div className="flex justify-start">
            <div className="max-w-md p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Sorry, there was an error</p>
                  <p className="text-sm mt-1">Please try asking a different question or try again later.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Input Form */}
      <div className="pt-4 border-t border-border">
        <form onSubmit={handleEnhancedSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about your finances..."
            className="flex-grow"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : (
              'Send'
            )}
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground mt-2">
          Ask specific questions about your budget, spending habits, or financial goals.
        </p>
      </div>
    </div>
  )
}