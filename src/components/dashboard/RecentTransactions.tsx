'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  name: string;
  color: string;
  date: Date;
  description?: string;
}

interface RecentTransactionsProps {
  recentTransactions: Transaction[];
  filteredTransactions: Transaction[];
  selectedMonth: number;
  selectedYear: number;
  monthNames: string[];
}

export const RecentTransactions = memo(({
  recentTransactions,
  filteredTransactions,
  selectedMonth,
  selectedYear,
  monthNames
}: RecentTransactionsProps) => {
  return (
    <Card className="shadow-md border border-border hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              Recent Transactions
            </CardTitle>
            <CardDescription>
              Latest transactions for {monthNames[selectedMonth - 1]} {selectedYear}
            </CardDescription>
          </div>
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
            {filteredTransactions.length > 5 && (
              <div className="pt-4 text-center">
                <Link 
                  href="/history" 
                  className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300"
                >
                  View all transactions for {monthNames[selectedMonth - 1]}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[260px] p-6 bg-accent/30 rounded-lg">
            <Clock className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center mb-2">No transactions for {monthNames[selectedMonth - 1]} {selectedYear}</p>
            <Link href="/add-transaction" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Add your first transaction
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

RecentTransactions.displayName = 'RecentTransactions';