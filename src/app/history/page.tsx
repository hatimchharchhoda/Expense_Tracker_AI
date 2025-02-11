'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { Delete } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectItem } from "@nextui-org/select";
import { useDispatch, useSelector } from 'react-redux';
import { filterOptions } from '@/constants/filterOptions'
import { login } from '@/store/authSlice';

export interface AuthState {
  status: boolean;
  userData: any | null; // Replace `any` with a more specific type if you know the structure of userData
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
  const { toast } = useToast();
  const user = useSelector((state: { auth: AuthState })  => (state.auth?.userData))
  // Cache duration (5 minutes)
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
    // Filter transactions based on selected value
    const filteredTransactions = transactions.filter((transaction) => transaction.type === selectedValue);

    // Update the state with the filtered transactions
    setFiltered(filteredTransactions);
  };


  const fetchTransactions = async () => {

    try {
      const response = await axios.post('/api/get-transaction', { user: user.user._id});
      const fetchedTransactions = response.data.data;

      saveToCache(fetchedTransactions);
      setTransactions(fetchedTransactions);
      setFiltered(fetchedTransactions); // Update filtered state with new transactions
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
      // Fetch in background to update cach
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