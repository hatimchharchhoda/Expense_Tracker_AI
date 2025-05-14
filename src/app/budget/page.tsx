// app/budget/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from '@/hooks/use-toast'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { 
  AlertTriangle, 
  PiggyBank, 
  Trash2, 
  Plus, 
  DollarSign,
  Calendar,
  ArrowUpRight,
  CircleDollarSign,
  TrendingUp,
  Check,
  AlertCircle,
  X,
  BarChart3,
  LightbulbIcon,
  Clock,
  Hammer
} from 'lucide-react'
import { PREDEFINED_CATEGORIES } from '@/models/model'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'

export interface AuthState {
  status: boolean;
  userData: any | null;
}

interface Budget {
  _id: string
  category: string
  amount: number
  month: number
  year: number
  user: string
}

interface BudgetFormData {
  category: string
  amount: string
  month: string
  year: string
}

interface BudgetSummary {
  category: string
  budgeted: number
  spent: number
  remaining: number
  percentage: number
}

interface Transaction {
  _id: string
  type: string
  name: string
  amount: number
  date: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function BudgetsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary[]>([])
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Get current month and year for default filter values
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  
  // Get user from Redux store
  const user = useSelector((state: { auth: AuthState }) => state.auth?.userData)
  const userId = user?.user?._id

  // Set mounted state to enable client-side rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine if we're in dark mode
  const isDark = mounted && theme === 'dark'

  // Summary calculations
  const totalBudgeted = useMemo(() => 
    budgetSummary.reduce((total, item) => total + item.budgeted, 0),
  [budgetSummary])
  
  const totalSpent = useMemo(() => 
    budgetSummary.reduce((total, item) => total + item.spent, 0),
  [budgetSummary])
  
  const totalRemaining = totalBudgeted - totalSpent
  const overallPercentage = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0

  const { 
    register, 
    handleSubmit, 
    setValue, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm<BudgetFormData>({
    defaultValues: {
      month: selectedMonth.toString(),
      year: selectedYear.toString(),
      category: "",
      amount: ""
    }
  });

  // Categories that don't have a budget for the selected month/year
  const availableCategories = useMemo(() => {
    const budgetedCategories = budgets
      .filter(b => b.month === selectedMonth && b.year === selectedYear)
      .map(b => b.category)

    return PREDEFINED_CATEGORIES
      .filter(c => c.type !== 'Income') // Don't budget for income
      .filter(c => !budgetedCategories.includes(c.type))
      .map(c => c.type)
  }, [budgets, selectedMonth, selectedYear])

  // Calculate budget summary from the transactions and budgets
  const calculateBudgetSummary = () => {
    // Get only transactions for the selected month and year
    const filteredTransactions = transactions.filter(transaction => {
      const txDate = new Date(transaction.date)
      return txDate.getMonth() + 1 === selectedMonth && txDate.getFullYear() === selectedYear
    })

    // Group transactions by category
    const spendingByCategory: { [key: string]: number } = {}
    
    filteredTransactions.forEach(transaction => {
      const category = transaction.type
      
      if (!spendingByCategory[category]) {
        spendingByCategory[category] = 0
      }
      
      // Add to spending if expense, subtract if income
      if (category === 'Income') {
        // Don't include income in spending calculations
      } else {
        spendingByCategory[category] = (spendingByCategory[category] || 0) + transaction.amount
      }
    })

    // Create budget summary
    const summary: BudgetSummary[] = []
    
    // First add all categories with budgets
    const filteredBudgets = budgets.filter(
      budget => budget.month === selectedMonth && budget.year === selectedYear
    )
    
    filteredBudgets.forEach(budget => {
      const spent = spendingByCategory[budget.category] || 0
      const remaining = budget.amount - spent
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      
      summary.push({
        category: budget.category,
        budgeted: budget.amount,
        spent,
        remaining,
        percentage
      })
    })
    
    // Add categories with spending but no budget
    Object.keys(spendingByCategory).forEach(category => {
      if (category !== 'Income' && !summary.some(s => s.category === category)) {
        summary.push({
          category,
          budgeted: 0,
          spent: spendingByCategory[category],
          remaining: -spendingByCategory[category],
          percentage: 100 // 100% over budget when there's no budget
        })
      }
    })
    
    setBudgetSummary(summary)
  }

  // Fetch budgets and transaction data
  const fetchData = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      // Fetch user's budgets
      const budgetsResponse = await axios.get(`/api/budgets?userId=${userId}`)
      setBudgets(budgetsResponse.data)
      
      // Fetch user's transactions
      const transactionsResponse = await axios.post('/api/get-transaction', { user: userId })
      setTransactions(transactionsResponse.data.data)
    } catch (error) {
      console.error('Error fetching budget data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load budget data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate budget summary when transactions or budgets change
  useEffect(() => {
    if (transactions.length > 0 || budgets.length > 0) {
      calculateBudgetSummary()
    }
  }, [transactions, budgets, selectedMonth, selectedYear])

  // Fetch data when user, month, or year changes
  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId, selectedMonth, selectedYear])

  // Create a new budget
  const onSubmit = async (data: BudgetFormData) => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a budget',
        variant: 'destructive'
      })
      return
    }
    
    try {
      const budgetData = {
        category: data.category,
        amount: parseFloat(data.amount),
        month: parseInt(data.month),
        year: parseInt(data.year),
        user: userId
      }
      
      const response = await axios.post('/api/budgets', budgetData)
      
      // Update local state
      setBudgets(prev => [...prev, response.data])
      
      // Reset form and refresh data
      reset({
        category: "",
        amount: "",
        month: selectedMonth.toString(),
        year: selectedYear.toString()
      });
      setShowForm(false);
      fetchData();
      
      toast({
        title: 'Success',
        description: 'Budget has been created successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error creating budget:', error);
      toast({
        title: 'Error',
        description: 'Failed to create budget',
        variant: 'destructive'
      });
    }
  };

  // Delete a budget
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await axios.delete(`/api/budgets/${id}`)

      // Update local state
      setBudgets(prev => prev.filter(budget => budget._id !== id))

      toast({
        title: 'Success',
        description: 'Budget has been deleted',
        variant: 'default'
      })

      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error deleting budget:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete budget',
        variant: 'destructive'
      })
    } finally {
      setDeletingId(null)
    }
  }

  // Filter budgets for the selected month/year
  const filteredBudgets = useMemo(() => {
    return budgets.filter(
      budget => budget.month === selectedMonth && budget.year === selectedYear
    )
  }, [budgets, selectedMonth, selectedYear])

  // Generate years for selection (current year and 2 years before and after)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return [
      currentYear - 2,
      currentYear - 1,
      currentYear,
      currentYear + 1,
      currentYear + 2
    ]
  }, [])

  // Get color for budget vs actual bars
  const getBarColor = (budget: number, spent: number) => {
    if (spent > budget) return '#ef4444' // Over budget - red
    if (spent > budget * 0.8) return '#f59e0b' // Near budget - amber
    return '#10b981' // Under budget - green
  }

  // Get category color from predefined categories
  const getCategoryColor = (category: string) => {
    const found = PREDEFINED_CATEGORIES.find(c => c.type === category)
    return found ? found.color : '#CCCCCC'
  }

  // Chart data for budget vs actual - with Income filter
  const chartData = useMemo(() => {
    return budgetSummary
      .filter(summary => summary.category !== 'Income')
      .map(summary => ({
        category: summary.category,
        Budget: summary.budgeted,
        Spent: summary.spent
      }))
  }, [budgetSummary])

  // Don't render UI until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  if (loading && budgets.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-1/3 mb-4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        <Skeleton className="h-12 w-full mb-8 rounded-lg" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>
        
        <Skeleton className="h-[400px] w-full mb-8 rounded-xl" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <PiggyBank className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
            Budget Management
          </h1>
          <p className="text-muted-foreground mt-1 ml-11">
            Set monthly budgets for each category and track your spending
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center space-x-2 bg-card rounded-lg shadow-sm border border-border p-1">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-[130px] border-0 shadow-none focus:ring-0 h-9">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Month" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-8 border-r border-border"></div>

            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[90px] border-0 shadow-none focus:ring-0 h-9">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => {
              setShowForm(true);
              reset({
                category: "",
                amount: "",
                month: selectedMonth.toString(),
                year: selectedYear.toString()
              });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            disabled={showForm || availableCategories.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Budget
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {budgetSummary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground flex items-center">
                <CircleDollarSign className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                Total Budgeted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₹{totalBudgeted.toLocaleString('en-IN', {maximumFractionDigits: 2})}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                For {filteredBudgets.length} categories
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₹{totalSpent.toLocaleString('en-IN', {maximumFractionDigits: 2})}
              </div>
              <div className="mt-1">
                <div className="w-full bg-secondary/50 rounded-full h-1.5">
                  <div 
                                        className={`h-1.5 rounded-full ${
                      overallPercentage > 90 ? 'bg-red-500 dark:bg-red-600' : 
                      overallPercentage > 75 ? 'bg-amber-500 dark:bg-amber-600' : 'bg-green-500 dark:bg-green-600'
                    }`}
                    style={{ width: `${overallPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{overallPercentage}% of budget used</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground flex items-center">
                <ArrowUpRight className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₹{Math.abs(totalRemaining).toLocaleString('en-IN', {maximumFractionDigits: 2})}
              </div>
              <div className="flex items-center mt-1">
                <Badge variant={totalRemaining >= 0 ? "default" : "destructive"}>
                  {totalRemaining >= 0 ? "Under budget" : "Over budget"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="manage">
            <Hammer className="w-4 h-4 mr-2" />
            Manage Budgets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {budgetSummary.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PiggyBank className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-500" />
                  No Budget Data
                </CardTitle>
                <CardDescription>
                  You haven't set up any budgets for {MONTHS[selectedMonth - 1]} {selectedYear} yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-6 mb-4">
                    <PiggyBank className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-muted-foreground max-w-md text-center mb-6">
                    Setting up a budget helps you plan your spending and track how well you're staying within your financial limits.
                  </p>
                  <Button
                    onClick={() => {
                      setShowForm(true);
                      reset({
                        category: "",
                        amount: "",
                        month: selectedMonth.toString(),
                        year: selectedYear.toString()
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Budget
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shadow-md border border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Budget vs. Actual Spending
                      </CardTitle>
                      <CardDescription>
                        Compare your budgeted amounts with actual spending for {MONTHS[selectedMonth - 1]} {selectedYear}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-secondary/30">
                      {budgetSummary.length} Categories
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#f0f0f0"} />
                        <XAxis
                          dataKey="category"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          tick={{ fontSize: 12, fill: isDark ? "#cbd5e1" : "#374151" }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: isDark ? "#cbd5e1" : "#374151" }}
                          tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)', 
                            borderRadius: '8px',
                            border: isDark ? '1px solid #1e293b' : '1px solid #eaeaea',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            color: isDark ? '#f1f5f9' : 'inherit'
                          }}
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, undefined]}
                          labelFormatter={(label) => `Category: ${label}`}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={40}
                          wrapperStyle={{ paddingTop: '10px' }}
                          formatter={(value) => <span style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>{value}</span>}
                        />
                        <Bar 
                          dataKey="Budget" 
                          fill="#3b82f6" 
                          radius={[4, 4, 0, 0]}
                          name="Budget Amount"
                        />
                        <Bar 
                          dataKey="Spent" 
                          name="Actual Spent"
                          radius={[4, 4, 0, 0]}
                        >
                          {
                            chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={getBarColor(entry.Budget, entry.Spent)}
                              />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {budgetSummary.map((item, index) => {
                  const categoryColor = getCategoryColor(item.category);
                  const progressColor = item.percentage > 100 
                    ? 'bg-red-500 dark:bg-red-600' 
                    : item.percentage > 80 
                      ? 'bg-yellow-500 dark:bg-yellow-600' 
                      : 'bg-green-500 dark:bg-green-600';
                  
                  return (
                    <Card key={index} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                      <CardHeader className="pb-3 border-b border-border">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: categoryColor }}
                            ></div>
                            {item.category}
                          </CardTitle>
                          <Badge 
                            variant={
                              item.percentage > 100 
                                ? 'destructive' 
                                : item.percentage > 80 
                                  ? 'outline' 
                                  : 'default'
                            }
                          >
                            {item.percentage > 100 
                              ? 'Over Budget' 
                              : item.percentage > 80 
                                ? 'Near Limit' 
                                : 'Under Budget'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Budget:</span>
                          <span className="font-medium">₹{item.budgeted.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Spent:</span>
                          <span className="font-medium">₹{item.spent.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm text-muted-foreground">Remaining:</span>
                          <span
                            className={`font-medium ${item.remaining < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}
                          >
                            ₹{Math.abs(item.remaining).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                            {item.remaining < 0 ? ' over' : ' left'}
                          </span>
                        </div>

                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-secondary/50">
                            <div
                              style={{ width: `${Math.min(100, item.percentage)}%` }}
                              className={`shadow-none flex flex-col justify-center text-center whitespace-nowrap text-white transition-all duration-500 ${progressColor}`}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs mt-1.5">
                            <span className="text-muted-foreground">0%</span>
                            <span className={`font-medium ${item.percentage > 100 ? 'text-red-500 dark:text-red-400' : 'text-foreground'}`}>
                              {item.percentage.toFixed(0)}%
                            </span>
                            <span className="text-muted-foreground">100%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="manage">
          {showForm && (
            <Card className="mb-6 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Plus className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Create New Budget
                </CardTitle>
                <CardDescription>
                  Set a monthly budget for a specific category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Category Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="category" className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" />
                        Category
                      </Label>
                      <select
                        className="w-full px-3 py-2.5 bg-background border border-input rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        id="category"
                        {...register('category', { required: 'Category is required' })}
                      >
                        <option value="">Select a category</option>
                        {availableCategories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="text-sm text-destructive flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.category.message}
                        </p>
                      )}
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="flex items-center">
                        <CircleDollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        Budget Amount
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          className="pl-10 border-input focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          {...register('amount', {
                            required: 'Amount is required',
                            min: {
                              value: 0.01,
                              message: 'Amount must be greater than 0'
                            }
                          })}
                          placeholder="0.00"
                        />
                      </div>
                      {errors.amount && (
                        <p className="text-sm text-destructive flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.amount.message}
                        </p>
                      )}
                    </div>

                    {/* Month Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="month" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        Month
                      </Label>
                      <select
                        className="w-full px-3 py-2.5 bg-background border border-input rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        id="month"
                        {...register('month', { required: 'Month is required' })}
                      >
                        {MONTHS.map((month, index) => (
                          <option key={index + 1} value={(index + 1).toString()}>
                            {month}
                          </option>
                        ))}
                      </select>
                      {errors.month && (
                        <p className="text-sm text-destructive flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.month.message}
                        </p>
                      )}
                    </div>

                    {/* Year Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="year" className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        Year
                      </Label>
                      <select
                        className="w-full px-3 py-2.5 bg-background border border-input rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        id="year"
                        {...register('year', { required: 'Year is required' })}
                      >
                        {yearOptions.map(year => (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        ))}
                      </select>
                      {errors.year && (
                        <p className="text-sm text-destructive flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.year.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Save Budget
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {filteredBudgets.length === 0 && !showForm ? (
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                  No Budgets Found
                </CardTitle>
                <CardDescription>
                  You haven't set up any budgets for {MONTHS[selectedMonth - 1]} {selectedYear}.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-6 mb-4">
                  <AlertTriangle className="h-12 w-12 text-amber-500 dark:text-amber-400" />
                </div>
                                <p className="text-muted-foreground max-w-md text-center mb-6">
                  Creating a budget is the first step to gain control over your finances. Start by setting up budgets for your major spending categories.
                </p>
                <Button
                  onClick={() => {
                    setShowForm(true);
                    reset({
                      category: "",
                      amount: "",
                      month: selectedMonth.toString(),
                      year: selectedYear.toString()
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Budget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBudgets.map(budget => {
                const budgetSummaryItem = budgetSummary.find(s => s.category === budget.category);
                const categoryColor = getCategoryColor(budget.category);
                
                return (
                  <Card key={budget._id} className="border border-border hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-2 border-b border-border">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: categoryColor }}
                          ></div>
                          {budget.category}
                        </CardTitle>
                        <Badge variant="outline" className="text-muted-foreground">
                          {MONTHS[budget.month - 1].substring(0, 3)} {budget.year}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground text-sm">Budget Amount</span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          ₹{budget.amount.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                        </span>
                      </div>

                      {budgetSummaryItem && (
                        <div className="mt-2 space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Spent so far:</span>
                            <span className="font-medium">
                              ₹{budgetSummaryItem.spent.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                            </span>
                          </div>
                          
                          <div className="relative">
                            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-secondary/50">
                              <div
                                style={{
                                  width: `${Math.min(100, budgetSummaryItem.percentage)}%`
                                }}
                                className={`shadow-none flex flex-col justify-center text-center whitespace-nowrap text-white transition-all duration-500 ${
                                  budgetSummaryItem.percentage > 100
                                    ? 'bg-red-500 dark:bg-red-600'
                                    : budgetSummaryItem.percentage > 80
                                      ? 'bg-yellow-500 dark:bg-yellow-600'
                                      : 'bg-green-500 dark:bg-green-600'
                                }`}
                              ></div>
                            </div>
                            <div className="flex justify-end text-xs mt-1">
                              <span className={`${
                                budgetSummaryItem.percentage > 100 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'
                              }`}>
                                {budgetSummaryItem.percentage.toFixed(0)}% used
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm pt-1">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge 
                              variant={
                                budgetSummaryItem.percentage > 100 
                                  ? 'destructive' 
                                  : budgetSummaryItem.percentage > 80 
                                    ? 'outline' 
                                    : 'default'
                              }
                            >
                              {budgetSummaryItem.percentage > 100 
                                ? 'Over Budget' 
                                : budgetSummaryItem.percentage > 80 
                                  ? 'Near Limit' 
                                  : 'Under Budget'}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t border-border pt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDelete(budget._id)}
                        disabled={deletingId === budget._id}
                      >
                        {deletingId === budget._id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Insights Section */}
      {budgetSummary.length > 0 && (
        <Card className="mt-8 shadow-md border border-border">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <LightbulbIcon className="mr-2 h-5 w-5 text-amber-500 dark:text-amber-400" />
                  Spending Insights
                </CardTitle>
                <CardDescription>
                  Analysis of your spending patterns for {MONTHS[selectedMonth - 1]} {selectedYear}
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-secondary/30 text-foreground">
                Financial Intelligence
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {/* Top spending categories */}
            <div className="bg-accent/20 rounded-xl p-5">
              <h3 className="font-medium mb-4 text-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                Top Spending Categories
              </h3>
              <div className="space-y-3">
                {[...budgetSummary]
                  .sort((a, b) => b.spent - a.spent)
                  .slice(0, 3)
                  .map((category, index) => (
                    <div key={index} className="flex justify-between items-center bg-card p-3 rounded-lg shadow-sm border border-border">
                      <div className="flex items-center">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            index === 0 ? 'bg-red-100 dark:bg-red-900/30' : 
                            index === 1 ? 'bg-orange-100 dark:bg-orange-900/30' : 
                            'bg-yellow-100 dark:bg-yellow-900/30'
                          }`}
                        >
                          <div 
                            className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-red-500' : 
                              index === 1 ? 'bg-orange-500' : 
                              'bg-yellow-500'
                            }`}
                          ></div>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">{category.category}</span>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {Math.round(category.spent / totalSpent * 100)}% of total spending
                          </div>
                        </div>
                      </div>
                      <span className="font-medium text-foreground">
                        ₹{category.spent.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Budget status cards */}
            <div>
              <h3 className="font-medium mb-4 text-foreground flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                Budget Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-green-600 dark:text-green-400 font-medium">Under Budget</div>
                      <div className="bg-green-200 dark:bg-green-800 rounded-full p-1.5">
                        <Check className="h-4 w-4 text-green-700 dark:text-green-300" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                      {budgetSummary.filter(s => s.category !== 'Income' && s.percentage < 80).length}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-400 mt-1">categories</div>
                  </CardContent>
                </Card>
                
                <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-900/10 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-yellow-600 dark:text-yellow-400 font-medium">Near Limit</div>
                      <div className="bg-yellow-200 dark:bg-yellow-800 rounded-full p-1.5">
                        <AlertTriangle className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                      {budgetSummary.filter(s => s.category !== 'Income' && s.percentage >= 80 && s.percentage <= 100).length}
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">categories</div>
                  </CardContent>
                </Card>
                
                <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-red-600 dark:text-red-400 font-medium">Over Budget</div>
                      <div className="bg-red-200 dark:bg-red-800 rounded-full p-1.5">
                        <X className="h-4 w-4 text-red-700 dark:text-red-300" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                      {budgetSummary.filter(s => s.category !== 'Income' && s.percentage > 100).length}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-400 mt-1">categories</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recommendations */}
            {budgetSummary
              .filter(s => s.category !== 'Income' && s.percentage > 100)
              .length > 0 && (
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm mt-4">
                <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-3 flex items-center">
                  <LightbulbIcon className="h-4 w-4 mr-2" />
                  Smart Recommendations
                </h3>
                <ul className="space-y-2">
                  {budgetSummary
                    .filter(s => s.category !== 'Income' && s.percentage > 100)
                    .map((category, index) => (
                      <li key={index} className="flex items-start bg-card/80 p-3 rounded-lg backdrop-blur-sm border border-border">
                        <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-1 mr-3 mt-0.5">
                          <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Consider adjusting your budget for <strong className="text-foreground">{category.category}</strong> as you're 
                          spending <span className="text-red-600 dark:text-red-400 font-medium">{Math.round(category.percentage - 100)}% more</span> than budgeted.
                        </div>
                      </li>
                    ))}
                  {budgetSummary
                    .filter(s => s.category !== 'Income' && s.percentage < 50 && s.budgeted > 0)
                    .map((category, index) => (
                      <li key={`underuse-${index}`} className="flex items-start bg-card/80 p-3 rounded-lg backdrop-blur-sm border border-border">
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1 mr-3 mt-0.5">
                          <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          You're only using <span className="text-green-600 dark:text-green-400 font-medium">{Math.round(category.percentage)}%</span> of your <strong className="text-foreground">{category.category}</strong> budget. 
                          You might reallocate some to categories where you're over budget.
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}