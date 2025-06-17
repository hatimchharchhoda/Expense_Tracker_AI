// components/Recommendations.tsx
'use client'
import { useState, useEffect, useMemo } from 'react'
import { useFinancialData } from './FinancialDataProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowRight, AlertTriangle, TrendingUp, DollarSign, PiggyBank, ArrowUpRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'
import { PREDEFINED_CATEGORIES } from '@/models/model'
import type { Transaction, Budget, CategorySummary } from './FinancialDataProvider'

// Define interfaces for your data structures
interface Recommendation {
  title: string;
  description: string;
  icon: ReactNode;
  accentColor: string;
  actionLink?: string;
  actionText?: string;
}

interface FilteredInsights {
  transactions: Transaction[];
  budgets: Budget[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    totalSavings: number;
    netBalance: number;
    totalBudgeted: number;
    totalBudgetRemaining: number;
    transactionCount: number;
    averageTransactionAmount: number;
  };
  categorySummaries: CategorySummary[];
  topExpenseCategories: { category: string, amount: number, percentage: number }[];
  topIncomeCategories: { category: string, amount: number, percentage: number }[];
  budgetStatus: {
    overBudgetCategories: CategorySummary[];
    nearLimitCategories: CategorySummary[];
    underBudgetCategories: CategorySummary[];
  };
}

export default function Recommendations() {
  const financialData = useFinancialData()
  
  // Month/Year filtering state
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  
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

  // Helper function to calculate insights for filtered data
  const calculateFilteredInsights = (
    filteredTransactions: Transaction[], 
    filteredBudgets: Budget[]
  ): FilteredInsights => {
    // Filter transactions by type
    const expenseTransactions = filteredTransactions.filter(tx => 
      tx.type !== 'Income' && tx.type !== 'Investment' && tx.type !== 'Savings'
    );
    const incomeTransactions = filteredTransactions.filter(tx => tx.type === 'Income');
    const savingsTransactions = filteredTransactions.filter(tx => tx.type === 'Savings');
    
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
      const category = tx.name
      if (!incomeByCategory[category]) incomeByCategory[category] = 0
      incomeByCategory[category] += tx.amount
    })
    
    // Calculate total budgeted amount and remaining
    const totalBudgeted = filteredBudgets.reduce((sum, budget) => sum + budget.amount, 0)
    const totalBudgetRemaining = totalBudgeted - totalExpenses
    
    // Create category summaries with budget info
    const categorySummaries: CategorySummary[] = Object.keys(spendingByCategory).map(category => {
      const budget = filteredBudgets.find(b => b.category === category)
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
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
    
    // Sort categories by income amount for top income sources
    const topIncomeCategories = Object.entries(incomeByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
    
    // Budget status
    const overBudgetCategories = categorySummaries
      .filter(summary => summary.budgeted > 0 && summary.percentageUsed > 100)
      .sort((a, b) => b.percentageUsed - a.percentageUsed)
    
    const nearLimitCategories = categorySummaries
      .filter(summary => summary.budgeted > 0 && summary.percentageUsed >= 80 && summary.percentageUsed <= 100)
      .sort((a, b) => b.percentageUsed - a.percentageUsed)
    
    const underBudgetCategories = categorySummaries
      .filter(summary => summary.budgeted > 0 && summary.percentageUsed < 80)
      .sort((a, b) => b.percentageUsed - a.percentageUsed)
    
    return {
      transactions: filteredTransactions,
      budgets: filteredBudgets,
      summary: {
        totalIncome,
        totalExpenses,
        totalSavings,
        netBalance,
        totalBudgeted,
        totalBudgetRemaining,
        transactionCount: filteredTransactions.length,
        averageTransactionAmount: expenseTransactions.length > 0 
          ? totalExpenses / expenseTransactions.length 
          : 0
      },
      categorySummaries,
      topExpenseCategories,
      topIncomeCategories,
      budgetStatus: {
        overBudgetCategories,
        nearLimitCategories,
        underBudgetCategories
      }
    }
  }

  // Filter financial data by selected month/year
  const filteredFinancialData = useMemo(() => {
    if (!financialData || financialData.isLoading) return null

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

    // Calculate insights for filtered data
    return calculateFilteredInsights(filteredTransactions, filteredBudgets)
  }, [financialData, selectedMonth, selectedYear])

  // Loading state
  if (financialData.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-muted-foreground">Analyzing your financial data...</span>
      </div>
    )
  }

  // Error state
  if (financialData.error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Unable to generate recommendations</h3>
        <p className="text-muted-foreground mb-4">
          {financialData.error || "There was an error analyzing your financial data"}
        </p>
        <Button onClick={financialData.refreshData}>Try Again</Button>
      </div>
    )
  }

  // Empty data state
  if (financialData.transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <DollarSign className="h-12 w-12 text-blue-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">No transaction data available</h3>
        <p className="text-muted-foreground mb-4">
          Add some transactions to get personalized financial recommendations
        </p>
        <Link href="/add-transaction">
          <Button>Add Your First Transaction</Button>
        </Link>
      </div>
    )
  }

  // Generate recommendations based on filtered data
  const recommendations = filteredFinancialData ? generateRecommendations(filteredFinancialData) : []

  return (
    <div className="space-y-6">
      {/* Month/Year Selector */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Financial Analysis Period
              </CardTitle>
              <CardDescription>
                Select month and year for personalized recommendations
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
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
          </div>
        </CardHeader>
      </Card>

      {/* Check if there's data for selected month/year */}
      {!filteredFinancialData || filteredFinancialData.transactions.length === 0 ? (
        <Card className="border-dashed border-muted-foreground/20">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No data for {monthNames[selectedMonth - 1]} {selectedYear}</h3>
            <p className="text-muted-foreground mb-4">
              No transactions found for the selected month. Try selecting a different period or add some transactions.
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => {
                  const currentDate = new Date()
                  setSelectedMonth(currentDate.getMonth() + 1)
                  setSelectedYear(currentDate.getFullYear())
                }}
              >
                Go to Current Month
              </Button>
              <Link href="/add-transaction">
                <Button>Add Transaction</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Financial Summary Card */}
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                {monthNames[selectedMonth - 1]} {selectedYear} Financial Snapshot
              </CardTitle>
              <CardDescription>
                Summary of your financial situation for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="text-lg font-medium text-green-600 dark:text-green-400">
                    ₹{filteredFinancialData.summary.totalIncome.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <p className="text-lg font-medium text-red-600 dark:text-red-400">
                    ₹{filteredFinancialData.summary.totalExpenses.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Savings</p>
                  <p className="text-lg font-medium text-purple-600 dark:text-purple-400">
                    ₹{filteredFinancialData.summary.totalSavings.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className={`text-lg font-medium ${
                    filteredFinancialData.summary.netBalance >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    ₹{Math.abs(filteredFinancialData.summary.netBalance).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
                        </CardContent>
          </Card>

          {/* Recommendations List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Personalized Recommendations for {monthNames[selectedMonth - 1]} {selectedYear}
            </h3>
            
            {recommendations.length === 0 ? (
              <Card className="border-dashed border-muted-foreground/20">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    We don't have enough data for {monthNames[selectedMonth - 1]} {selectedYear} to provide personalized recommendations.
                    Continue tracking your expenses to get insights.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {recommendations.map((recommendation, index) => (
                  <Card key={index} className={`border-l-4 ${recommendation.accentColor}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        {recommendation.icon}
                        <span className="ml-2">{recommendation.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {recommendation.description}
                      </p>
                      
                      {recommendation.actionLink && (
                        <Link href={recommendation.actionLink}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-8 bg-accent/10"
                          >
                            {recommendation.actionText || 'Take Action'}
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Budget alerts for selected month */}
          {filteredFinancialData.budgetStatus.overBudgetCategories.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                {monthNames[selectedMonth - 1]} Budget Alerts: Categories Over Budget
              </h3>
              
              <div className="space-y-3">
                {filteredFinancialData.budgetStatus.overBudgetCategories.map((category, index) => (
                  <div 
                    key={index} 
                    className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: category.color }} 
                        />
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                        {Math.round(category.percentageUsed)}% of budget
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 dark:bg-red-600 rounded-full"
                        style={{ width: `${Math.min(100, category.percentageUsed)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>Budget: ₹{category.budgeted.toLocaleString('en-IN')}</span>
                      <span>Spent: ₹{category.totalSpent.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link href="/budget">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Your Budgets for {monthNames[selectedMonth - 1]}
                </Button>
              </Link>
            </div>
          )}

          {/* Near Budget Limit Categories */}
          {filteredFinancialData.budgetStatus.nearLimitCategories.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                Near Budget Limit - {monthNames[selectedMonth - 1]} {selectedYear}
              </h3>
              
              <div className="space-y-3">
                {filteredFinancialData.budgetStatus.nearLimitCategories.map((category, index) => (
                  <div 
                    key={index} 
                    className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/10"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: category.color }} 
                        />
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                        {Math.round(category.percentageUsed)}% of budget
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 dark:bg-amber-600 rounded-full"
                        style={{ width: `${category.percentageUsed}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>Budget: ₹{category.budgeted.toLocaleString('en-IN')}</span>
                      <span>Remaining: ₹{Math.max(0, category.remaining).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Last Updated Info */}
      <div className="text-xs text-center text-muted-foreground mt-8">
        {financialData.lastUpdated && (
          <div className="flex items-center justify-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              Last updated: {financialData.lastUpdated.toLocaleString()}
            </span>
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs h-auto p-0 ml-2" 
              onClick={financialData.refreshData}
            >
              Refresh
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Function to generate recommendations based on filtered financial data
function generateRecommendations(data: FilteredInsights): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 1. Over budget categories
  if (data.budgetStatus.overBudgetCategories.length > 0) {
    const topOverCategory = data.budgetStatus.overBudgetCategories[0];
    recommendations.push({
      title: `Reduce ${topOverCategory.category} Spending`,
      description: `You've spent ${Math.round(topOverCategory.percentageUsed)}% of your ${topOverCategory.category} budget this month. Consider finding ways to cut back in this category.`,
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      accentColor: "border-red-500",
      actionLink: "/budget",
      actionText: "Adjust Budget"
    });
  }

  // 2. Budget creation recommendation
  if (data.budgets.length === 0) {
    recommendations.push({
      title: "Create Budget for This Month",
      description: "You don't have any budgets set for this month. Setting up a budget will help you control your spending and reach your financial goals.",
      icon: <PiggyBank className="h-4 w-4 text-blue-500" />,
      accentColor: "border-blue-500",
      actionLink: "/budget",
      actionText: "Create Budget"
    });
  }

  // 3. Enhanced Savings recommendations
  const savingsAmount = data.summary.totalSavings || 0;
  const incomeAmount = data.summary.totalIncome || 1;
  const savingsPercentage = incomeAmount > 0 ? (savingsAmount / incomeAmount) * 100 : 0;

  if (incomeAmount > 0) {
    if (savingsPercentage >= 20) {
      recommendations.push({
        title: "Excellent Savings Rate This Month!",
        description: `You're saving ${savingsPercentage.toFixed(1)}% of your income this month, which exceeds the recommended 20%. Consider investing these savings for long-term growth.`,
        icon: <ArrowUpRight className="h-4 w-4 text-green-500" />,
        accentColor: "border-green-500",
        actionLink: "/add-transaction",
        actionText: "Add Investment"
      });
    } else if (savingsPercentage >= 10) {
      recommendations.push({
        title: "Good Progress on Monthly Savings",
        description: `You're saving ${savingsPercentage.toFixed(1)}% of your income this month. Try to reach the recommended 20% for better financial security.`,
        icon: <ArrowUpRight className="h-4 w-4 text-amber-500" />,
        accentColor: "border-amber-500",
        actionLink: "/add-transaction",
        actionText: "Increase Savings"
      });
    } else if (savingsPercentage > 0) {
      recommendations.push({
        title: "Increase Your Monthly Savings",
        description: `You're currently saving ${savingsPercentage.toFixed(1)}% of your income this month. Try to save at least 20% for better financial security.`,
        icon: <ArrowUpRight className="h-4 w-4 text-red-500" />,
        accentColor: "border-red-500",
        actionLink: "/add-transaction",
        actionText: "Add More Savings"
      });
    } else {
      recommendations.push({
        title: "Start Monthly Savings",
        description: "You haven't recorded any savings this month. Try to allocate at least 10-20% of your monthly income to savings.",
        icon: <PiggyBank className="h-4 w-4 text-red-500" />,
        accentColor: "border-red-500",
        actionLink: "/add-transaction",
                actionText: "Start Saving"
      });
    }
  }

  // 4. High expense category insight
  if (data.topExpenseCategories.length > 0) {
    const topCategory = data.topExpenseCategories[0];
    if (topCategory.percentage > 30) {
      recommendations.push({
        title: `${topCategory.category} Is Your Top Monthly Expense`,
        description: `You're spending ${topCategory.percentage.toFixed(1)}% of your monthly expenses on ${topCategory.category} (₹${topCategory.amount.toLocaleString('en-IN')}). Consider if this aligns with your priorities.`,
        icon: <TrendingUp className="h-4 w-4 text-amber-500" />,
        accentColor: "border-amber-500"
      });
    }
  }

  // 5. Income vs Expenses balance for the month
  if (data.summary.netBalance < 0) {
    const deficit = Math.abs(data.summary.netBalance);
    recommendations.push({
      title: "Monthly Spending Exceeds Income",
      description: `Your expenses exceeded your income by ₹${deficit.toLocaleString('en-IN')} this month. Consider reducing non-essential spending or finding additional income sources.`,
      icon: <DollarSign className="h-4 w-4 text-red-500" />,
      accentColor: "border-red-500",
      actionLink: "/history",
      actionText: "Review Expenses"
    });
  } else if (data.summary.netBalance > 0 && data.summary.totalIncome > 0) {
    const surplusPercentage = (data.summary.netBalance / data.summary.totalIncome) * 100;
    if (surplusPercentage > 30) {
      recommendations.push({
        title: "Great Monthly Financial Discipline!",
        description: `You have a surplus of ₹${data.summary.netBalance.toLocaleString('en-IN')} this month (${surplusPercentage.toFixed(1)}% of income). Consider investing this surplus for long-term wealth building.`,
        icon: <TrendingUp className="h-4 w-4 text-green-500" />,
        accentColor: "border-green-500",
        actionLink: "/add-transaction",
        actionText: "Add Investment"
      });
    }
  }

  // 6. Budget utilization recommendations
  if (data.budgets.length > 0) {
    const totalBudgeted = data.summary.totalBudgeted;
    const totalSpent = data.summary.totalExpenses;
    const budgetUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    if (budgetUtilization < 50 && totalSpent > 0) {
      recommendations.push({
        title: "Conservative Spending This Month",
        description: `You've only used ${budgetUtilization.toFixed(1)}% of your total monthly budget. You have room for planned purchases or consider saving the remainder.`,
        icon: <PiggyBank className="h-4 w-4 text-green-500" />,
        accentColor: "border-green-500",
        actionLink: "/budget",
        actionText: "Review Budget"
      });
    }
  }

  // 7. Transaction frequency recommendation
  if (data.summary.transactionCount < 5 && data.summary.totalExpenses > 0) {
    recommendations.push({
      title: "Track More Transactions",
      description: `You've recorded only ${data.summary.transactionCount} transactions this month. Recording more transactions will give you better insights into your spending patterns.`,
      icon: <DollarSign className="h-4 w-4 text-blue-500" />,
      accentColor: "border-blue-500",
      actionLink: "/add-transaction",
      actionText: "Add More Transactions"
    });
  }

  // 8. Large transaction alert
  if (data.summary.averageTransactionAmount > 0) {
    const largeTransactions = data.transactions.filter(tx => 
      tx.type !== 'Income' && tx.amount > data.summary.averageTransactionAmount * 2
    );
    
    if (largeTransactions.length > 0) {
      const largestTransaction = largeTransactions.reduce((max, tx) => 
        tx.amount > max.amount ? tx : max
      );
      
      recommendations.push({
        title: "Large Expense Alert",
        description: `You had ${largeTransactions.length} unusually large expense(s) this month. Your largest was ₹${largestTransaction.amount.toLocaleString('en-IN')} for ${largestTransaction.name}. Make sure these align with your financial goals.`,
        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        accentColor: "border-amber-500",
        actionLink: "/history",
        actionText: "Review Transactions"
      });
    }
  }

  // 9. Near budget limit warning
  if (data.budgetStatus.nearLimitCategories.length > 0) {
    const nearLimitCategory = data.budgetStatus.nearLimitCategories[0];
    recommendations.push({
      title: `Watch Your ${nearLimitCategory.category} Spending`,
      description: `You've used ${Math.round(nearLimitCategory.percentageUsed)}% of your ${nearLimitCategory.category} budget. You have ₹${nearLimitCategory.remaining.toLocaleString('en-IN')} remaining for the rest of the month.`,
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      accentColor: "border-amber-500",
      actionLink: "/budget",
      actionText: "Review Budget"
    });
  }

  // 10. Positive reinforcement for good financial habits
  if (data.budgetStatus.overBudgetCategories.length === 0 && 
      data.budgets.length > 0 && 
      data.summary.totalExpenses > 0) {
    recommendations.push({
      title: "Excellent Budget Management!",
      description: "You've stayed within all your budget limits this month. This shows great financial discipline and planning. Keep up the good work!",
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      accentColor: "border-green-500"
    });
  }

  return recommendations;
}