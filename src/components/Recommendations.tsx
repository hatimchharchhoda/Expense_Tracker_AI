// components/Recommendations.tsx
'use client'
import { useFinancialData } from './FinancialDataProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight, AlertTriangle, TrendingUp, DollarSign, PiggyBank, ArrowUpRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'

// Define interfaces for your data structures
interface Recommendation {
  title: string;
  description: string;
  icon: ReactNode;
  accentColor: string;
  actionLink?: string;
  actionText?: string;
}

// components/Recommendations.tsx (continued)
export default function Recommendations() {
  const financialData = useFinancialData()
  
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

  // Generate recommendations based on financial data
  const recommendations = generateRecommendations(financialData)

  return (
    <div className="space-y-6">
      {/* Financial Summary Card */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Your Financial Snapshot
          </CardTitle>
          <CardDescription>
            Summary of your current financial situation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="text-lg font-medium text-green-600 dark:text-green-400">
                ₹{financialData.summary.totalIncome.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="text-lg font-medium text-red-600 dark:text-red-400">
                ₹{financialData.summary.totalExpenses.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={`text-lg font-medium ${
                financialData.summary.netBalance >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                ₹{Math.abs(financialData.summary.netBalance).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Budget Status</p>
              <p className={`text-lg font-medium ${
                financialData.summary.totalBudgetRemaining >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {financialData.summary.totalBudgetRemaining >= 0 
                  ? `₹${financialData.summary.totalBudgetRemaining.toLocaleString('en-IN')} left` 
                  : `₹${Math.abs(financialData.summary.totalBudgetRemaining).toLocaleString('en-IN')} over`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personalized Recommendations</h3>
        
        {recommendations.length === 0 ? (
          <Card className="border-dashed border-muted-foreground/20">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                We don't have enough data yet to provide personalized recommendations.
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
      
      {financialData.budgetStatus.overBudgetCategories.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            Budget Alert: Categories Over Budget
          </h3>
          
          <div className="space-y-3">
            {financialData.budgetStatus.overBudgetCategories.map((category, index) => (
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
              Manage Your Budgets
            </Button>
          </Link>
        </div>
      )}
      
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

// Function to generate recommendations based on financial data
// Function to generate recommendations based on financial data
function generateRecommendations(data: any): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // 1. Over budget categories
  if (data.budgetStatus.overBudgetCategories.length > 0) {
    const topOverCategory = data.budgetStatus.overBudgetCategories[0];
    recommendations.push({
      title: `Reduce ${topOverCategory.category} Spending`,
      description: `You've spent ${Math.round(topOverCategory.percentageUsed)}% of your ${topOverCategory.category} budget. Consider finding ways to cut back in this category for the rest of the month.`,
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      accentColor: "border-red-500",
      actionLink: "/budget",
      actionText: "Adjust Budget"
    });
  }
  
  // 2. Budget creation recommendation
  if (data.budgets.length === 0) {
    recommendations.push({
      title: "Create Your First Budget",
      description: "Setting up a budget is the first step to financial control. Based on your spending, we can help you create realistic budget categories.",
      icon: <PiggyBank className="h-4 w-4 text-blue-500" />,
      accentColor: "border-blue-500",
      actionLink: "/budget",
      actionText: "Create Budget"
    });
  }
  
  // 3. Enhanced Savings recommendations
  // Calculate savings percentage
  const savingsAmount = data.summary.totalSavings || 0;
  const incomeAmount = data.summary.totalIncome || 1; // Prevent division by zero
  const savingsPercentage = (savingsAmount / incomeAmount) * 100;
  
  console.log("Savings data:", {
    savingsAmount,
    incomeAmount,
    savingsPercentage,
    transactions: data.transactions
  });
  
  // Always offer a savings recommendation for improved visibility
  if (incomeAmount > 0) {
    if (savingsPercentage >= 20) {
      // Great savings rate
      recommendations.push({
        title: "Excellent Savings Rate!",
        description: `You're saving ${savingsPercentage.toFixed(1)}% of your income, which exceeds the recommended 20%. Consider optimizing these savings through strategic investments.`,
        icon: <ArrowUpRight className="h-4 w-4 text-green-500" />,
        accentColor: "border-green-500",
        actionLink: "/budget",
        actionText: "Review Savings Plan"
      });
    } else if (savingsPercentage >= 10) {
      // Good but could be better
      recommendations.push({
        title: "Good Progress on Savings",
        description: `You're saving ${savingsPercentage.toFixed(1)}% of your income. You're on the right track, but try to reach the recommended 20% for long-term financial security.`,
        icon: <ArrowUpRight className="h-4 w-4 text-amber-500" />,
        accentColor: "border-amber-500",
        actionLink: "/add-transaction",
        actionText: "Increase Savings"
      });
    } else if (savingsPercentage > 0) {
      // Has some savings but needs improvement
      recommendations.push({
        title: "Increase Your Savings",
        description: `You're currently saving ${savingsPercentage.toFixed(1)}% of your income. Financial experts recommend saving at least 20% of your income for financial security.`,
        icon: <ArrowUpRight className="h-4 w-4 text-red-500" />,
        accentColor: "border-red-500",
        actionLink: "/add-transaction",
        actionText: "Add More Savings"
      });
    } else {
      // No savings at all
      recommendations.push({
        title: "Start Building Savings",
        description: "You don't have any recorded savings yet. Try to allocate at least 10-20% of your income to savings for financial security.",
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
        title: `${topCategory.category} Is Your Top Expense`,
        description: `You're spending ${topCategory.percentage.toFixed(1)}% of your expenses on ${topCategory.category}. This might be an area to evaluate for potential savings.`,
        icon: <TrendingUp className="h-4 w-4 text-amber-500" />,
        accentColor: "border-amber-500"
      });
    }
  }
  
  // 5. Income vs Expenses balance
  if (data.summary.netBalance < 0) {
    recommendations.push({
      title: "Spending Exceeds Income",
      description: "Your expenses are higher than your income this period. Consider reducing non-essential spending or finding additional income sources.",
      icon: <DollarSign className="h-4 w-4 text-red-500" />,
      accentColor: "border-red-500"
    });
  }
  
  return recommendations;
}