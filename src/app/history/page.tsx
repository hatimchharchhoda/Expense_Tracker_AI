'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { useSession } from 'next-auth/react';
import { Delete } from 'lucide-react';

interface Transact {
  _id: string;
  name: string;
  amount: number;
  color?: string;
}

export default function List() {
  const [transactions, setTransactions] = useState<Transact[]>([]);
  const [Loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { data: session } = useSession();

  const handleClick = async (e: any) => {
    setLoading(true);
    const del = await axios.delete(`/api/delete-transaction/${e.target.id}`);
    if (del.status === 200) {
      toast({
        title: 'Success',
        description: "Transaction Deleted",
        variant: "default"
      });
      setTransactions(transactions.filter(t => t._id !== e.target.id));
    } else {
      toast({
        title: 'Failed',
        description: "Transaction not Deleted",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      const storedSession = localStorage.getItem('session');
      if (!storedSession) {
        toast({
          title: 'Error',
          description: "No session found. Please log in.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      const { user } = JSON.parse(storedSession);
      const userId = user._id;
      try {
        const response = await axios.post('/api/get-transaction', { user: userId });
        setTransactions(response.data.data);
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
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {transactions.length === 0 ? (
        <h1 className="text-2xl font-bold text-gray-700 text-center mt-20">
          No Transactions
        </h1>
      ) : (
        <div className="flex flex-col items-center py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Transaction History</h1>
          <div className="w-full max-w-3xl space-y-4">
            {transactions.map((transaction) => (
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
                  id={transaction._id ?? ''}
                  onClick={handleClick}
                >
                  <Delete size={24} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
