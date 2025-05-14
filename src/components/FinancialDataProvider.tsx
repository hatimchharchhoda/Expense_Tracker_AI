// components/FinancialDataProvider.tsx
'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { PREDEFINED_CATEGORIES } from '@/models/model'

// Define our data types
export interface Transaction {
  _id: string
  name: string
  type: string
  amount: number
  color: string
  date: string | Date
  description?: string
}

export interface Budget {
  _id: string
  category: string
  amount: number
  month: number
  year: number
  user: string
}

export interface CategorySummary {
  category: string
  totalSpent: number
  budgeted: number
  remaining: number
  percentageUsed: number
  color: string
}

export interface FinancialInsights {
  transactions: Transaction[]
  budgets: Budget[]
  summary: {
    totalIncome: number
    totalExpenses: number
    totalSavings: number
    netBalance: number
    totalBudgeted: number
    totalBudgetRemaining: number
    transactionCount: number
    averageTransactionAmount: number
  }
  categorySummaries: CategorySummary[]
  topExpenseCategories: { category: string, amount: number, percentage: number }[]
  topIncomeCategories: { category: string, amount: number, percentage: number }[]
  recentTransactions: Transaction[]
  budgetStatus: {
    overBudgetCategories: CategorySummary[]
    nearLimitCategories: CategorySummary[]
    underBudgetCategories: CategorySummary[]
  }
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refreshData: () => Promise<void>
}

// Create the context
const FinancialDataContext = createContext<FinancialInsights | null>(null)

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Get user from Redux store
  const userData = useSelector((state: any) => state.auth?.userData)
  const userId = userData?.user?._id

  // Process transactions into categories
 // Process transactions into categories
const processTransactions = (transactions: Transaction[]) => {
  // Ensure dates are properly handled and categorize transactions appropriately
  return transactions.map(tx => {
    // Convert date strings to Date objects
    const processed = {
      ...tx,
      date: new Date(tx.date)
    };
    
    // Ensure transaction has the correct category type
    if (processed.type === 'Investment' || processed.type === 'Savings') {
      processed.type = processed.type; // Mark as special category
    } else if (processed.type === 'Income') {
      processed.type = 'Income';
    } else {
      processed.type = 'Expense'; // All other types are expenses
    }
    
    return processed;
  });
};

  // Calculate summaries and insights
  const calculateInsights = (transactions: Transaction[], budgets: Budget[]) => {
    // Filter transactions by type
    const expenseTransactions = transactions.filter(tx => 
  tx.type !== 'Income' && tx.type !== 'Investment' && tx.type !== 'Savings'
);
const incomeTransactions = transactions.filter(tx => tx.type === 'Income');
const investmentTransactions = transactions.filter(tx => tx.type === 'Investment');
const savingsTransactions = transactions.filter(tx => tx.type === 'Savings');
    
    // Calculate basic summaries
    const totalIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const totalExpenses = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const totalSavings = savingsTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const netBalance = totalIncome - totalExpenses - totalSavings
    
    // Get spending by category
    const spendingByCategory: Record<string, number> = {}
    
    expenseTransactions.forEach(tx => {
      const category = tx.type
      if (!spendingByCategory[category]) spendingByCategory[category] = 0
      spendingByCategory[category] += tx.amount
    })

    // Get income by category
    const incomeByCategory: Record<string, number> = {}
    
    incomeTransactions.forEach(tx => {
      const category = tx.name // For income, name might be more specific (salary, freelance, etc.)
      if (!incomeByCategory[category]) incomeByCategory[category] = 0
      incomeByCategory[category] += tx.amount
    })
    
    // Current month and year for budgets
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1 // JS months are 0-based
    const currentYear = currentDate.getFullYear()
    
    // Filter budgets for current month/year
    const currentBudgets = budgets.filter(
      budget => budget.month === currentMonth && budget.year === currentYear
    )
    
    // Calculate total budgeted amount and remaining
    const totalBudgeted = currentBudgets.reduce((sum, budget) => sum + budget.amount, 0)
    const totalBudgetRemaining = totalBudgeted - totalExpenses
    
    // Create category summaries with budget info
    const categorySummaries: CategorySummary[] = Object.keys(spendingByCategory).map(category => {
      const budget = currentBudgets.find(b => b.category === category)
      const spent = spendingByCategory[category]
      const budgeted = budget?.amount || 0
      const remaining = budgeted - spent
      const percentageUsed = budgeted > 0 ? (spent / budgeted) * 100 : 100
      
      // Find color for this category
      const categoryInfo = PREDEFINED_CATEGORIES.find(c => c.type === category)
      const color = categoryInfo?.color || '#CCCCCC'
      
      return {
        category,
        totalSpent: spent,
        budgeted,
        remaining,
        percentageUsed,
        color
      }
    })
    
    // Sort categories by spending amount for top expense categories
    const topExpenseCategories = Object.entries(spendingByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
    
    // Sort categories by income amount for top income sources
    const topIncomeCategories = Object.entries(incomeByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalIncome) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
    
    // Recent transactions (sorted by date, newest first)
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
    
    // Budget status
    const overBudgetCategories = categorySummaries
      .filter(summary => summary.percentageUsed > 100)
      .sort((a, b) => b.percentageUsed - a.percentageUsed)
    
    const nearLimitCategories = categorySummaries
      .filter(summary => summary.percentageUsed >= 80 && summary.percentageUsed <= 100)
      .sort((a, b) => b.percentageUsed - a.percentageUsed)
    
    const underBudgetCategories = categorySummaries
      .filter(summary => summary.percentageUsed < 80)
      .sort((a, b) => b.percentageUsed - a.percentageUsed)
    
    return {
      summary: {
        totalIncome,
        totalExpenses,
        totalSavings,
        netBalance,
        totalBudgeted,
        totalBudgetRemaining,
        transactionCount: transactions.length,
        averageTransactionAmount: transactions.length > 0 
          ? totalExpenses / expenseTransactions.length 
          : 0
      },
      categorySummaries,
      topExpenseCategories,
      topIncomeCategories,
      recentTransactions,
      budgetStatus: {
        overBudgetCategories,
        nearLimitCategories,
        underBudgetCategories
      }
    }
  }

  // Check localStorage cache
  const getFromCache = () => {
    try {
      const cachedData = localStorage.getItem('financialDataCache')
      if (!cachedData) return null

      const { transactions, budgets, timestamp } = JSON.parse(cachedData)
      
      // Check if cache is expired
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem('financialDataCache')
        return null
      }

      return { transactions, budgets }
    } catch (error) {
      console.error('Error reading from cache:', error)
      localStorage.removeItem('financialDataCache')
      return null
    }
  }

  // Save to cache
  const saveToCache = (transactions: Transaction[], budgets: Budget[]) => {
    try {
      const cacheData = {
        transactions,
        budgets,
        timestamp: Date.now()
      }
      localStorage.setItem('financialDataCache', JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error saving to cache:', error)
    }
  }

  // Fetch data function
  const fetchData = async (checkCache = true) => {
    if (!userId) {
      setError('User not authenticated')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Check cache first if requested
      if (checkCache) {
        const cachedData = getFromCache()
        if (cachedData) {
          setTransactions(processTransactions(cachedData.transactions))
          setBudgets(cachedData.budgets)
          setLastUpdated(new Date())
          setIsLoading(false)
          // Still fetch fresh data in the background
          fetchData(false)
          return
        }
      }

      // Fetch transactions
      const transactionsResponse = await axios.post('/api/get-transaction', { user: userId })
      const fetchedTransactions = transactionsResponse.data.data
      
      // Fetch budgets
      const budgetsResponse = await axios.get(`/api/budgets?userId=${userId}`)
      const fetchedBudgets = budgetsResponse.data
      
      // Process and set data
      setTransactions(processTransactions(fetchedTransactions))
      setBudgets(fetchedBudgets)
      
      // Update cache
      saveToCache(fetchedTransactions, fetchedBudgets)
      
      // Update last updated timestamp
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching financial data:', error)
      setError('Failed to fetch financial data')
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh data function that can be called from components
  const refreshData = async () => {
    await fetchData(false) // Skip cache check
  }

  // Fetch data on component mount or when userId changes
  useEffect(() => {
    if (userId) {
      fetchData(true) // Check cache first
    }
  }, [userId])

  // Calculate insights from transactions and budgets
  const insights = calculateInsights(transactions, budgets)

  // Create the full context value
  const contextValue: FinancialInsights = {
    transactions,
    budgets,
    ...insights,
    isLoading,
    error,
    lastUpdated,
    refreshData
  }

  return (
    <FinancialDataContext.Provider value={contextValue}>
      {children}
    </FinancialDataContext.Provider>
  )
}

// Custom hook to use the financial data
export function useFinancialData() {
  const context = useContext(FinancialDataContext)
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider')
  }
  return context
}