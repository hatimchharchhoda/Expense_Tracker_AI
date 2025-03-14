'use client'
import { Chart, ArcElement } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { chartData, getTotal } from '@/helper/graphData';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import Label from '@/components/Labels';
import { Skeleton } from '@/components/ui/skeleton';
import { Chart as Area } from '@/components/AreaGraph';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';

// Register Chart.js components
Chart.register(ArcElement)

export interface AuthState {
  status: boolean;
  userData: any | null; // Replace `any` with a more specific type if you know the structure of userData
}

// Use the defined type
interface Transaction {
  _id: string;
  amount: number;
  type: string;
  name: string;
  color: string;
  date : Date;
}

interface CachedDashboardData {
  transactions: Transaction[];
  timestamp: number;
}

function Page() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useSelector((state: any) => (state.auth?.userData))

  const AreaData = transactions.map((transact) => {
    return {
      month : transact.name,
      desktop: transact.amount,
    }
  });

  // Cache duration (2 minutes for dashboard data since it changes frequently)
  const CACHE_DURATION = 2 * 60 * 1000;

  const saveToCache = (transactions: Transaction[]) => {
    const cacheData: CachedDashboardData = {
      transactions,
      timestamp: Date.now()
    };
    localStorage.setItem('dashboardCache', JSON.stringify(cacheData));
  };

  const getFromCache = useCallback((): Transaction[] | null => {
    try {
      const cachedData = localStorage.getItem('dashboardCache');
      if (!cachedData) return null;

      const { transactions, timestamp }: CachedDashboardData = JSON.parse(cachedData);
      
      // Check if cache is expired
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem('dashboardCache');
        return null;
      }

      return transactions;
    } catch (error) {
      console.error('Error reading from cache:', error);
      localStorage.removeItem('dashboardCache');
      return null;
    }
  }, []);

  const fetchTransactions = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/get-transaction', { user: user.user._id });
      const fetchedTransactions = response.data.data;
      
      setTransactions(fetchedTransactions);
      saveToCache(fetchedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError("Failed to fetch transactions. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user.user._id]);

  useEffect(() => {
    const initializeDashboard = async () => {
      // Try to get data from cache first
      const cachedTransactions = getFromCache();
      
      if (cachedTransactions) {
        // If we have cached data, show it immediately
        setTransactions(cachedTransactions);
        setLoading(false);
        // Fetch fresh data in background
        fetchTransactions(false);
      } else {
        // If no cache, fetch fresh data
        fetchTransactions(true);
      }
    };

    initializeDashboard();
  }, [fetchTransactions, getFromCache]);

  // Loading state
  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center space-y-4 mt-8 py-10">
        <Skeleton className="h-[300px] w-[300px] rounded-full " />
        <Skeleton className="h-[30px] w-[300px] rounded-xl " />
        <Skeleton className="h-[30px] w-[300px] rounded-xl " />
        <Skeleton className="h-[30px] w-[300px] rounded-xl " />
        <div className="space-y-2">
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 justify-center py-8 min-h-screen md:flex-row">
      <div className='mx-auto min-w-[500px] min-h=[800px]'>
      <Area chartData = {AreaData} />
      </div>
      <div className="item relative max-w-sm mx-auto">
        {transactions.length > 0 ? (
          <div className="chart relative">
            {/* Centered Total */}
            <div className="absolute inset-0 flex flex-col justify-center items-center z-10">
              <h3 className="text-lg font-bold">Total Transactions</h3>
              <span className="text-3xl text-emerald-400">
              ₹{getTotal(transactions) ?? 0}
              </span>
            </div>
            {/* Doughnut Chart */}
            <Doughnut {...chartData(transactions)} />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No transactions available</p>
            <button 
              onClick={() => fetchTransactions(true)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        )}

        <div className="flex flex-col py-10 gap-4">
          <Label />
        </div>
      </div>
    </div>
  );
}

export default Page;