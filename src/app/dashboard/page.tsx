// app/dashboard/page.tsx
'use client'
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from "@/store/authSlice";
import { useSession } from "next-auth/react";
import axios from 'axios';
import { useTheme } from 'next-themes';
import { 
  Chart, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { getTotal } from '@/helper/graphData';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PREDEFINED_CATEGORIES } from '@/models/model';
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  DollarSign, 
  Wallet, 
  RefreshCw, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Coins
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Label from '@/components/Labels';
import { Chart as Area } from '@/components/AreaGraph';

// Register Chart.js components
Chart.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface AuthState {
  status: boolean;
  userData: any | null;
}

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  name: string;
  color: string;
  date: Date;
  description?: string;
}

interface Budget {
  _id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  user: string;
}

interface CachedDashboardData {
  transactions: Transaction[];
  budgets: Budget[];
  timestamp: number;
}

function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth?.userData || {});
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state to enable client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cache duration (2 minutes for dashboard data since it changes frequently)
  const CACHE_DURATION = 2 * 60 * 1000;

  // Add authentication setup from landing page
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
    if (session) {
      localStorage.setItem('session', JSON.stringify(session));
      dispatch(login(session));
    }
  }, [session, dispatch]);

  const saveToCache = (transactions: Transaction[], budgets: Budget[]) => {
    const cacheData: CachedDashboardData = {
      transactions,
      budgets,
      timestamp: Date.now()
    };
    localStorage.setItem('dashboardCache', JSON.stringify(cacheData));
  };

  const getFromCache = useCallback((): { transactions: Transaction[], budgets: Budget[] } | null => {
    try {
      const cachedData = localStorage.getItem('dashboardCache');
      if (!cachedData) return null;

      const { transactions, budgets, timestamp }: CachedDashboardData = JSON.parse(cachedData);
      
      // Check if cache is expired
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem('dashboardCache');
        return null;
      }

      return { transactions, budgets };
    } catch (error) {
      console.error('Error reading from cache:', error);
      localStorage.removeItem('dashboardCache');
      return null;
    }
  }, []);

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    setRefreshing(true);
  
    // Check if user is available
    if (!user?.user?._id) {
      console.error("User ID is undefined. Skipping data fetch.");
      setLoading(false);
      setRefreshing(false);
      return;
    }
  
    try {
      // Get transactions
      const transactionsResponse = await axios.post('/api/get-transaction', { user: user.user._id });
      const fetchedTransactions = transactionsResponse.data.data;
      
      // Get budgets - this might need API endpoint implementation
      let fetchedBudgets: Budget[] = [];
      try {
        const budgetsResponse = await axios.get(`/api/budgets?userId=${user.user._id}`);
        fetchedBudgets = budgetsResponse.data;
      } catch (budgetError) {
        console.error('Error fetching budgets:', budgetError);
        // Continue with empty budgets array if budget API fails
      }
  
      setTransactions(fetchedTransactions);
      setBudgets(fetchedBudgets);
      saveToCache(fetchedTransactions, fetchedBudgets);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError("Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.user?._id]);
  
  useEffect(() => {
    // Only fetch data when we have user data
    if (user?.user?._id) {
      const initializeDashboard = async () => {
        // Try to get data from cache first
        const cachedData = getFromCache();
        
        if (cachedData) {
          // If we have cached data, show it immediately
          setTransactions(cachedData.transactions);
          setBudgets(cachedData.budgets);
          setLoading(false);
          // Fetch fresh data in background
          fetchDashboardData(false);
        } else {
          // If no cache, fetch fresh data
          fetchDashboardData(true);
        }
      };

      initializeDashboard();
    }
  }, [fetchDashboardData, getFromCache, user?.user?._id]);

  // Calculate summary data
  const expenseTransactions = transactions.filter(transaction => transaction.type !== 'Income' && transaction.type !== 'Savings');
  const incomeTransactions = transactions.filter(transaction => transaction.type === 'Income');
  const savingsTransactions = transactions.filter(transaction => transaction.type === 'Savings');
  
  const totalExpenses = expenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalIncome = incomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalSavings = savingsTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  
  // Get recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);
  
  // Get category data for budget comparison
  const categoryTotals = useMemo(() => {
    return expenseTransactions.reduce((acc, transaction) => {
      const { type, amount } = transaction;
      if (!acc[type]) acc[type] = 0;
      acc[type] += amount;
      return acc;
    }, {} as Record<string, number>);
  }, [expenseTransactions]);
  
  // Prepare budget vs actual data
  const budgetVsActualData = useMemo(() => {
    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    return PREDEFINED_CATEGORIES
      .filter(cat => cat.type !== 'Income' && cat.type !== 'Savings')
      .map(cat => {
        const category = cat.type;
        const actual = categoryTotals[category] || 0;
        
        // Find current month's budget for this category
        const budget = budgets.find(
          b => b.category === category && b.month === currentMonth && b.year === currentYear
        );
        
        return {
          category,
          actual,
          budget: budget?.amount || 0,
          remaining: (budget?.amount || 0) - actual
        };
      });
  }, [budgets, categoryTotals]);

  // Prepare data for monthly expenses bar chart
  const monthlyExpenseData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const expensesByMonth = Array(12).fill(0);
    
    expenseTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      if (date.getFullYear() === currentYear) {
        expensesByMonth[date.getMonth()] += transaction.amount;
      }
    });
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Monthly Expenses',
          data: expensesByMonth,
          backgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.7)' : 'rgba(34, 197, 94, 0.6)',
          borderColor: theme === 'dark' ? 'rgb(21, 128, 61)' : 'rgb(21, 128, 61)',
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(34, 197, 94, 0.8)',
        }
      ]
    };
  }, [expenseTransactions, theme]);

  // Create doughnut chart data for expense categories
  const createDoughnutChartData = useMemo(() => {
    // Get expense categories and their totals
    const categories = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);
    
    // Get colors for categories
    const colors = categories.map(category => {
      const found = PREDEFINED_CATEGORIES.find(c => c.type === category);
      return found ? found.color : '#CCCCCC';
    });
    
    return {
      labels: categories,
      datasets: [{
        data: values,
        backgroundColor: colors,
        hoverOffset: 4,
        borderWidth: theme === 'dark' ? 1 : 2,
        borderColor: theme === 'dark' ? '#1e293b' : '#ffffff'
      }]
    };
  }, [categoryTotals, theme]);

  // Area chart data for expenses
  const areaChartData = useMemo(() => {
    return expenseTransactions.map((transact) => {
      return {
        month: transact.name,
        desktop: transact.amount,
      };
    });
  }, [expenseTransactions]);

  // Show initial loading state
  if ((sessionStatus === 'loading' && !user?.user) || !mounted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">Loading your financial dashboard...</p>
      </div>
    );
  }

  // Loading state
  if (loading && transactions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 bg-background">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[130px] w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-lg max-w-md p-8 bg-card rounded-2xl shadow-lg border border-destructive/20">
          <div className="flex items-center text-destructive mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <h2 className="font-semibold">Data Loading Error</h2>
          </div>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Button 
            onClick={() => fetchDashboardData(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Try Again
            <RefreshCw className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl bg-background">
      {/* Header with Title and Refresh Button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <Button 
          onClick={() => fetchDashboardData(true)} 
          disabled={refreshing}
          variant="outline" 
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Summary Cards */}
      {/* Summary Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">Total Income</CardTitle>
      <div className="h-8 w-8 rounded-full bg-green-500/20 dark:bg-green-500/10 flex items-center justify-center">
        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div className="flex items-center mt-1">
        <p className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
          {incomeTransactions.length} transactions
        </p>
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
      <div className="h-8 w-8 rounded-full bg-red-500/20 dark:bg-red-500/10 flex items-center justify-center">
        <Wallet className="h-4 w-4 text-red-600 dark:text-red-400" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div className="flex items-center mt-1">
        <p className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
          {expenseTransactions.length} transactions
        </p>
      </div>
    </CardContent>
  </Card>
  
  {/* New Savings Card */}
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
      <div className="h-8 w-8 rounded-full bg-purple-500/20 dark:bg-purple-500/10 flex items-center justify-center">
        <Coins className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">₹{totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div className="flex items-center mt-1">
        <p className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
          {savingsTransactions.length} transactions
        </p>
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
        totalIncome - totalExpenses - totalSavings >= 0 
          ? 'bg-blue-500/20 dark:bg-blue-500/10' 
          : 'bg-amber-500/20 dark:bg-amber-500/10'
      }`}>
        {totalIncome - totalExpenses - totalSavings >= 0 ? (
          <ArrowUpIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <ArrowDownIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        )}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">
        ₹{Math.abs(totalIncome - totalExpenses - totalSavings).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="flex items-center mt-1">
        <p className={`text-xs px-2 py-0.5 rounded-full ${
          totalIncome - totalExpenses - totalSavings >= 0 
            ? 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
            : 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30'
        }`}>
          {totalIncome - totalExpenses - totalSavings >= 0 ? 'Available funds' : 'Deficit'}
        </p>
      </div>
    </CardContent>
  </Card>
</div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Expenses Bar Chart */}
        <Card className="shadow-md border border-border hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Monthly Expenses
                </CardTitle>
                <CardDescription>
                  Your spending pattern throughout {new Date().getFullYear()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {expenseTransactions.length > 0 ? (
              <div className="h-[300px] w-full mt-2">
                <Bar 
                  data={monthlyExpenseData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                        },
                        ticks: {
                          callback: function(value) {
                            return '₹' + value;
                          },
                          font: {
                            size: 10
                          },
                          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          font: {
                            size: 10
                          },
                          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(0, 0, 0, 0.7)',
                        padding: 10,
                        cornerRadius: 6,
                        callbacks: {
                          label: function(context) {
                            return '₹' + (context.raw as number).toLocaleString('en-IN');
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] p-6 bg-accent/30 rounded-lg">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center mb-2">No expense data available</p>
                <Link href="/add-transaction" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Add your first transaction
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Category Breakdown */}
        <Card className="shadow-md border border-border hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Spending by Category
                </CardTitle>
                <CardDescription>
                  Breakdown of your expenses across categories
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {expenseTransactions.length > 0 ? (
              <div className="relative h-[300px] flex items-center justify-center">
                {/* Centered Total */}
                <div className="absolute inset-0 flex flex-col justify-center items-center z-10 pointer-events-none pb-7">
                  <div className="bg-card/90 backdrop-blur-sm px-4 py-3 rounded-full shadow-sm border border-border">
                    <h3 className="text-xs font-medium text-muted-foreground">Total Expenses</h3>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                    </span>
                  </div>
                </div>
                
                {/* Doughnut Chart */}
                <div className="relative h-[300px] flex items-center justify-center" style={{ overflow: 'visible' }}>
                <div className="h-[290px] w-[290px]">
                  <Doughnut 
                    data={createDoughnutChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '65%',
                      plugins: {
                        legend: {
                          display: true,
                          position: 'bottom',
                          labels: {
                            boxWidth: 12,
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                              size: 11
                            },
                            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'
                          }
                        },
                        tooltip: {
                          backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(0, 0, 0, 0.7)',
                          padding: 10,
                          cornerRadius: 6,
                          callbacks: {
                            label: function(context) {
                              const value = context.raw;
                              const percentage = ((value as number) / totalExpenses * 100).toFixed(1);
                              return `₹${(value as number).toLocaleString('en-IN')} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] p-6 bg-accent/30 rounded-lg">
                <PieChart className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center mb-2">No category data available</p>
                <Link href="/add-transaction" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Add your first transaction
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Budget vs Actual Section */}
        <Card className="shadow-md border border-border hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Budget Progress
                </CardTitle>
                <CardDescription>
                  Your monthly spending against budget limits
                </CardDescription>
              </div>
              <Link href="/budget">
                <Button variant="ghost" size="sm" className="text-xs h-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  Manage Budgets
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {budgetVsActualData.some(item => item.budget > 0) ? (
              <div className="space-y-5 mt-3">
                {budgetVsActualData
                  .filter(item => item.budget > 0)
                  .map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full mr-2"
                            style={{ 
                              backgroundColor: PREDEFINED_CATEGORIES.find(
                                cat => cat.type === item.category
                              )?.color || '#ccc' 
                            }}
                          />
                          <span className="text-sm font-medium text-foreground">{item.category}</span>
                        </div>
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            item.actual > item.budget 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-foreground'
                          }`}>
                            ₹{item.actual.toLocaleString('en-IN')}
                          </span>
                          <span className="text-muted-foreground mx-1">/</span>
                          <span className="text-sm text-muted-foreground">
                            ₹{item.budget.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            item.actual > item.budget 
                              ? 'bg-red-500' 
                              : item.actual > item.budget * 0.8
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, (item.actual / item.budget) * 100)}%`,
                            transition: 'width 1s ease-in-out'
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {Math.min(100, Math.round((item.actual / item.budget) * 100))}% used
                        </span>
                        {item.remaining > 0 && (
                          <span className="text-green-600 dark:text-green-400">
                            ₹{item.remaining.toLocaleString('en-IN')} remaining
                          </span>
                        )}
                        {item.remaining < 0 && (
                          <span className="text-red-600 dark:text-red-400">
                            ₹{Math.abs(item.remaining).toLocaleString('en-IN')} over budget
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] p-6 bg-accent/30 rounded-lg">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center mb-2">No budget data available</p>
                <Link href="/budget" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Set up your first budget
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Transactions */}
        <Card className="shadow-md border border-border hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>
                  Your most recent financial activities
                </CardDescription>
              </div>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-xs h-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-4 mt-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0" 
                        style={{ backgroundColor: `${transaction.color}30` }}
                      >
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: transaction.color }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{transaction.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(transaction.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${
                      transaction.type === 'Income' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'Income' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
                <div className="pt-4 text-center">
                  <Link 
                    href="/history" 
                    className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    View all transactions
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] p-6 bg-accent/30 rounded-lg">
                <Clock className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center mb-2">No transactions available</p>
                <Link href="/add-transaction" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Add your first transaction
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Area Chart and Doughnut Chart Row */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Area Chart */}
          <Card className="shadow-md border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Expense Trends
              </CardTitle>
              <CardDescription>
                Visualize your expense patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px]">
                <Area chartData={areaChartData} />
              </div>
            </CardContent>
          </Card>

          {/* Original Chart with Labels */}
          <Card className="shadow-md border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <PieChart className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                Transaction Distribution
              </CardTitle>
              <CardDescription>
                Overview of your transaction categories with details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center">
                {/* Centered Total */}
                <div className="relative w-[250px] h-[250px]">
                  <div className="absolute inset-0 flex flex-col justify-center items-center z-10">
                    <h3 className="text-sm font-medium text-muted-foreground">Total</h3>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{getTotal(transactions) ?? 0}
                    </span>
                  </div>
                  
                  {/* Doughnut Chart */}
                  <Doughnut 
                    data={
                      {
                        datasets: [{
                            data: transactions.map(v => v.amount),
                            backgroundColor: transactions.map(v => v.color),
                            hoverOffset: 4,
                            borderRadius: 30,
                            spacing: 10
                        }],
                        labels: transactions.map(v => v.type)
                      }
                    }
                    options={{
                      cutout: '60%',
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }}
                  />
                </div>
                
                <div className="flex flex-col pt-2 gap-2 w-full max-w-xs">
                  <Label />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions Footer */}
      {/* <div className="mt-8 bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="font-medium text-foreground">Need to record a new transaction?</h3>
            <p className="text-sm text-muted-foreground mt-1">Keep your finances updated for accurate insights.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/add-transaction">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                Add Transaction
              </Button>
            </Link>
            <Link href="/budget">
              <Button variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                Manage Budgets
              </Button>
            </Link>
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default DashboardPage;