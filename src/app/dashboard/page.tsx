// app/dashboard/page.tsx
'use client'
import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from "@/store/authSlice";
import { useSession } from "next-auth/react";
import axios from 'axios';
import { useTheme } from 'next-themes';
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PREDEFINED_CATEGORIES } from '@/models/model';
import { 
  RefreshCw, 
  AlertCircle,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import '@/lib/chartSetup';

// Import dashboard components
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { BudgetProgress } from '@/components/dashboard/BudgetProgress';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { ExpenseTrends } from '@/components/dashboard/ExpenseTrends';
import { TransactionDistribution } from '@/components/dashboard/TransactionDistribution';

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
  
  // New state for month/year filtering
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const { data: session, status: sessionStatus } = useSession();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth?.userData || {});
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state to enable client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cache duration (2 minutes for dashboard data since it changes frequently)
  const CACHE_DURATION = useMemo(() => 2 * 60 * 1000, []);

  // Month names for display
  const monthNames = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

  // Generate year options (current year - 5 to current year + 1)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years;
  }, []);

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
    if (session?.user?._id) {
      localStorage.setItem('session', JSON.stringify(session));
      dispatch(login(session as AuthState["userData"]));
    }
  }, [session, dispatch]);

  const saveToCache = useCallback((transactions: Transaction[], budgets: Budget[]) => {
    const cacheData: CachedDashboardData = {
      transactions,
      budgets,
      timestamp: Date.now()
    };
    localStorage.setItem('dashboardCache', JSON.stringify(cacheData));
  }, []);

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
  }, [CACHE_DURATION]);

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
  }, [user?.user?._id, saveToCache]);
  
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

  // Filter transactions based on selected month and year - MEMOIZED
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() + 1 === selectedMonth && 
             transactionDate.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // MEMOIZED: Calculate summary data using filtered transactions
  const dashboardData = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter(t => t.type !== 'Income' && t.type !== 'Savings');
    const incomeTransactions = filteredTransactions.filter(t => t.type === 'Income');
    const savingsTransactions = filteredTransactions.filter(t => t.type === 'Savings');
    
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalSavings = savingsTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      expenseTransactions,
      incomeTransactions,
      savingsTransactions,
      totalExpenses,
      totalIncome,
      totalSavings
    };
  }, [filteredTransactions]);
  
  // MEMOIZED: Get recent transactions from filtered data
  const recentTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [filteredTransactions]);
  
  // MEMOIZED: Get category data for budget comparison using filtered transactions
  const categoryTotals = useMemo(() => {
    return dashboardData.expenseTransactions.reduce((acc, transaction) => {
      const { type, amount } = transaction;
      if (!acc[type]) acc[type] = 0;
      acc[type] += amount;
      return acc;
    }, {} as Record<string, number>);
  }, [dashboardData.expenseTransactions]);
  
  // MEMOIZED: Prepare budget vs actual data for selected month/year
  const budgetVsActualData = useMemo(() => {
    return PREDEFINED_CATEGORIES
      .filter(cat => cat.type !== 'Income' && cat.type !== 'Savings')
      .map(cat => {
        const category = cat.type;
        const actual = categoryTotals[category] || 0;
        
        // Find selected month/year's budget for this category
        const budget = budgets.find(
          b => b.category === category && b.month === selectedMonth && b.year === selectedYear
        );
        
        return {
          category,
          actual,
          budget: budget?.amount || 0,
          remaining: (budget?.amount || 0) - actual
        };
      });
  }, [budgets, categoryTotals, selectedMonth, selectedYear]);

  // MEMOIZED: Prepare data for monthly expenses bar chart
  const monthlyExpenseData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const expensesByMonth = Array(12).fill(0);
    
    // Use all transactions for the selected year
    const yearTransactions = transactions.filter(transaction => {
      const date = new Date(transaction.date);
      return date.getFullYear() === selectedYear && transaction.type !== 'Income' && transaction.type !== 'Savings';
    });
    
    yearTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      expensesByMonth[date.getMonth()] += transaction.amount;
    });
    
    // Create background colors array, highlighting the selected month
    const backgroundColors = expensesByMonth.map((_, index) => {
      const isSelectedMonth = index === selectedMonth - 1;
      return isSelectedMonth 
        ? (theme === 'dark' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.7)')
        : (theme === 'dark' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.4)');
    });
    
    const borderColors = expensesByMonth.map((_, index) => {
      const isSelectedMonth = index === selectedMonth - 1;
      return isSelectedMonth 
        ? (theme === 'dark' ? 'rgb(59, 130, 246)' : 'rgb(59, 130, 246)')
        : (theme === 'dark' ? 'rgb(21, 128, 61)' : 'rgb(21, 128, 61)');
    });
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Monthly Expenses',
          data: expensesByMonth,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 6,
          hoverBackgroundColor: backgroundColors.map(color => color.replace('0.5', '0.9').replace('0.4', '0.8').replace('0.8', '1').replace('0.7', '0.9')),
        }
      ]
    };
  }, [transactions, selectedYear, selectedMonth, theme]);

  // MEMOIZED: Create doughnut chart data for expense categories using filtered data
  const createDoughnutChartData = useMemo(() => {
    // Get expense categories and their totals from filtered data
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

  // MEMOIZED: Area chart data for expenses using filtered data
  const areaChartData = useMemo(() => {
    return dashboardData.expenseTransactions.map((transact) => {
      return {
        month: transact.name,
        desktop: transact.amount,
      };
    });
  }, [dashboardData.expenseTransactions]);

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
      {/* Header with Title, Month/Year Selector and Refresh Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Showing data for {monthNames[selectedMonth - 1]} {selectedYear}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Month/Year Selectors */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalIncome={dashboardData.totalIncome}
        totalExpenses={dashboardData.totalExpenses}
        totalSavings={dashboardData.totalSavings}
        incomeCount={dashboardData.incomeTransactions.length}
        expenseCount={dashboardData.expenseTransactions.length}
        savingsCount={dashboardData.savingsTransactions.length}
      />

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Expenses Bar Chart */}
        <ExpenseChart
          monthlyExpenseData={monthlyExpenseData}
          theme={theme || 'light'}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          monthNames={monthNames}
          hasData={transactions.some(t => new Date(t.date).getFullYear() === selectedYear && t.type !== 'Income' && t.type !== 'Savings')}
        />
        
        {/* Category Breakdown */}
        <CategoryBreakdown
          expenseTransactions={dashboardData.expenseTransactions}
          createDoughnutChartData={createDoughnutChartData}
          totalExpenses={dashboardData.totalExpenses}
          theme={theme || 'light'}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          monthNames={monthNames}
        />
        
        {/* Budget vs Actual Section */}
        <BudgetProgress
          budgetVsActualData={budgetVsActualData}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          monthNames={monthNames}
        />
        
        {/* Recent Transactions */}
        <RecentTransactions
          recentTransactions={recentTransactions}
          filteredTransactions={filteredTransactions}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          monthNames={monthNames}
        />
      </div>
      
      {/* Area Chart and Doughnut Chart Row */}
      {filteredTransactions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Area Chart */}
          <ExpenseTrends
            areaChartData={areaChartData}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            monthNames={monthNames}
          />

          {/* Original Chart with Labels */}
          <TransactionDistribution
            filteredTransactions={filteredTransactions}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            monthNames={monthNames}
          />
        </div>
      )}

      {/* No Data State for Selected Month */}
      {filteredTransactions.length === 0 && transactions.length > 0 && (
        <div className="mt-8 bg-card border border-border rounded-xl p-8 shadow-sm text-center">
          <div className="flex flex-col items-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No transactions found for {monthNames[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              You haven't recorded any transactions for this month yet. Try selecting a different month or add some transactions.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => {
                  const currentDate = new Date();
                  setSelectedMonth(currentDate.getMonth() + 1);
                  setSelectedYear(currentDate.getFullYear());
                }}
                variant="outline"
              >
                Go to Current Month
              </Button>
              <Link href="/add-transaction">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add Transaction
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Footer - Only show if there are transactions for selected month */}
      {filteredTransactions.length > 0 && (
        <div className="mt-8 bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="font-medium text-foreground">
                Managing your finances for {monthNames[selectedMonth - 1]} {selectedYear}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Keep adding transactions and managing budgets for better financial insights.
              </p>
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
        </div>
      )}
    </div>
  );
}

export default memo(DashboardPage);