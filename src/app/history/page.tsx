'use client'
import React, { useEffect, useState } from 'react';
import { Select, SelectItem } from "@nextui-org/select";
import { Delete, Calendar } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { useDispatch, useSelector } from 'react-redux';
import { filterOptions } from '@/constants/filterOptions';
import { login } from '@/store/authSlice';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

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
  date: string;
}

const timeFrameOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'month', label: 'Last Month' },
  { value: 'quarter', label: 'Last 3 Months' },
  { value: 'year', label: 'Last Year' }
];

export default function List() {
  const dispatch = useDispatch();
  const [transactions, setTransactions] = useState<Transact[]>([]);
  const [filtered, setFiltered] = useState<Transact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeFrame, setTimeFrame] = useState('');
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('default');
  const user = useSelector((state: { auth: AuthState }) => state.auth?.userData);

  const filterByTimeFrame = (transactionsToFilter: Transact[]) => {
    const now = new Date();
    const filterDate = new Date();

    switch (timeFrame) {
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return transactionsToFilter;
    }

    return transactionsToFilter.filter(t => new Date(t.date) >= filterDate);
  };

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);
      setDownloadError('');

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

  const handleClick = async (transactionId: string, transactionAmount: number) => {
    setLoading(true);
    try {
      const del = await axios.post(`/api/delete-transaction/${transactionId}`, {
        userId: user.user._id,
        spent: transactionAmount
      });
      if (del.status === 200) {
        const updatedTransactions = transactions.filter(t => t._id !== transactionId);
        setTransactions(updatedTransactions);
        setFiltered(updatedTransactions);
        const updatedUser = {
          ...user,
          user: {
            ...user.user,
            spent: user.user.spent - transactionAmount
          }
        };
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let updatedTransactions = transactions;

    if (selectedCategory !== "default") {
      updatedTransactions = transactions.filter(t => t.type === selectedCategory);
    }

    setFiltered(filterByTimeFrame(updatedTransactions));
  }, [timeFrame, selectedCategory, transactions]);

  const handleTimeFrameChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    setTimeFrame(event.target.value);
  };

  const handleCategoryChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    setSelectedCategory(event.target.value);
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.post('/api/get-transaction', { user: user.user._id });
        const fetchedTransactions = response.data.data;
        setTransactions(fetchedTransactions);
        setFiltered(fetchedTransactions);
      } catch (error) {
        toast({
          title: 'Error',
          description: "Failed to fetch transactions",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user.user._id, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center space-y-4 mt-8 py-10">
        <Skeleton className="h-[100px] w-[800px] rounded-xl" />
        <Skeleton className="h-[100px] w-[800px] rounded-xl" />
        <Skeleton className="h-[100px] w-[800px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-md max-w-4xl mx-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-col justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Transaction History</h1>
            <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
            <Select
              label="Category"
              className="w-20 sm:w-80 pb-3 flex-grow sm:flex-grow-0"
              onChange={handleCategoryChange}
              defaultSelectedKeys={["default"]}
            >
              {filterOptions.map((option) => (
                <SelectItem key={option.key} value={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Time Period"
              className="w-20 sm:w-80 pb-3 flex-grow sm:flex-grow-0"
              onChange={handleTimeFrameChange}
              defaultSelectedKeys={["all"]}
            >
              {timeFrameOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex-grow sm:flex-grow-0">
                  <Calendar className="w-4 h-4 mr-2" />
                    Download
                </Button>
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
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-600">No Transactions Found</h2>
            <p className="text-gray-500 mt-2">Start adding transactions to see them here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between bg-white shadow-sm rounded-lg p-3 border-l-4 hover:shadow-md transition-shadow"
                style={{
                  borderColor: transaction.color ?? '#e5e5e5'
                }}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">{transaction.name}</span>
                  <span className="text-gray-600 text-sm">₹{transaction.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{transaction.type}</span>
                  <button
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => handleClick(transaction._id, transaction.amount)}
                    disabled={loading}
                  >
                    <Delete size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}