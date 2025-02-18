'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { Delete, Calendar } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectItem } from "@nextui-org/select";
import { useDispatch, useSelector } from 'react-redux';
import { filterOptions } from '@/constants/filterOptions'
import { login } from '@/store/authSlice';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface AuthState {
  status: boolean;
  userData: any | null;
}

interface Transact {
  _id: string;
  type: string;
  name: string;
  amount: number;
  color?: string;
}

interface CachedData {
  transactions: Transact[];
  timestamp: number;
}

export default function List() {
  const dispatch = useDispatch()
  const [transactions, setTransactions] = useState<Transact[]>([]);
  const [filtered, setFiltered] = useState<Transact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { toast } = useToast();
  const user = useSelector((state: { auth: AuthState })  => (state.auth?.userData))
  const CACHE_DURATION = 5 * 60 * 1000;

  const saveToCache = (transactions: Transact[]) => {
    const cacheData: CachedData = {
      transactions,
      timestamp: Date.now()
    };
    localStorage.setItem('transactionCache', JSON.stringify(cacheData));
  };

  const getFromCache = (): Transact[] | null => {
    const cachedData = localStorage.getItem('transactionCache');
    if (!cachedData) return null;

    const { transactions, timestamp }: CachedData = JSON.parse(cachedData);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem('transactionCache');
      return null;
    }

    return transactions;
  };

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);
      setDownloadError('');

      // Validate dates
      if (!startDate || !endDate) {
        throw new Error('Please select both start and end dates');
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('Start date must be before end date');
      }

      const response = await axios.post('/api/download_transaction', {
        userId: user.user._id,
        startDate,
        endDate,
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions-${startDate}-to-${endDate}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: "Transactions downloaded successfully",
        variant: "default"
      });
    } catch (err: any) {
      setDownloadError(err.message);
      toast({
        title: 'Failed',
        description: "Failed to download transactions",
        variant: "destructive"
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleClick = async (transactionId : string , transactionAmount : number) => {
    setLoading(true);
    try {
      const del = await axios.post(`/api/delete-transaction/${transactionId}` , {userId : user.user._id,spent : transactionAmount} );
      if (del.status === 200) {
        const updatedTransactions = transactions.filter(t => t._id !== transactionId);
        setTransactions(updatedTransactions);
        saveToCache(updatedTransactions);
        setFiltered(updatedTransactions)
        const updatedUser = {
          ...user,
          user: {
            ...user.user,
            spent: user.user.spent - transactionAmount
          }
        }
        dispatch(login(updatedUser));
        toast({
          title: 'Success',
          description: "Transaction Deleted",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: 'Failed',
        description: "Transaction not Deleted",
        variant: "destructive"
      });
      throw error
    } finally {
      setLoading(false);
    }
  };

  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    const selectedValue = event.target.value;

    if (selectedValue === "default") {
      setFiltered(transactions);
      return;
    }
    const filteredTransactions = transactions.filter((transaction) => transaction.type === selectedValue);
    setFiltered(filteredTransactions);
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.post('/api/get-transaction', { user: user.user._id});
      const fetchedTransactions = response.data.data;

      saveToCache(fetchedTransactions);
      setTransactions(fetchedTransactions);
      setFiltered(fetchedTransactions);
    } catch (error) {
      toast({
        title: 'Error',
        description: "Failed to fetch transactions",
        variant: "destructive"
      });
      throw error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions()
    const cachedTransactions = getFromCache();
    if (cachedTransactions) {
      setTransactions(cachedTransactions);
      setFiltered(cachedTransactions);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center space-y-4 mt-8 py-10">
        <Skeleton className="h-[100px] w-[800px] rounded-xl " />
        <Skeleton className="h-[100px] w-[800px] rounded-xl " />
        <Skeleton className="h-[100px] w-[800px] rounded-xl " />
        <div className="space-y-2">
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className='flex gap-20 w-full max-w-3xl'>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Transaction History
        </h1>
        <Select
          className="max-w-sm"
          items={filterOptions}
          label="Filter By"
          onChange={handleChange}
          defaultSelectedKeys={["default"]}
        >
          {(option) => <SelectItem>{option.label}</SelectItem>}
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Download</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Download Transactions
              </h3>
              
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-sm font-medium">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  className="w-full px-3 py-2 border rounded-md"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="endDate" className="text-sm font-medium">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  className="w-full px-3 py-2 border rounded-md"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {downloadError && (
                <Alert variant="destructive">
                  <AlertDescription>{downloadError}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleDownload}
                disabled={downloadLoading || !startDate || !endDate}
                className="w-full"
              >
                {downloadLoading ? 'Downloading...' : 'Download Excel'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {filtered.length === 0 && transactions.length == 0 ? (
        <h1 className="text-2xl font-bold text-gray-700 text-center mt-20">
          No Transactions
        </h1>
      ) : (
        <div className="w-full max-w-3xl space-y-4 py-4">
          {filtered.map((transaction) => (
            <div
              key={transaction._id}
              className="flex items-center justify-between bg-white shadow-md rounded-lg p-4 border-l-4"
              style={{
                borderColor: transaction.color ?? '#e5e5e5'
              }}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800">{transaction.name}</span>
                <span className="text-gray-600">Amount: ₹{transaction.amount}</span>
              </div>
              <button
                className="text-gray-500 hover:text-red-500 transition-colors"
                id={transaction._id}
                onClick={() => {
                  handleClick(transaction._id , transaction.amount)
                }}
                disabled={loading}
              >
                <Delete size={24} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}