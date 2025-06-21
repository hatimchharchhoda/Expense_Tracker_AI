'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Wallet, Coins, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  incomeCount: number;
  expenseCount: number;
  savingsCount: number;
}

export const SummaryCards = memo(({
  totalIncome,
  totalExpenses,
  totalSavings,
  incomeCount,
  expenseCount,
  savingsCount
}: SummaryCardsProps) => {
  const remainingBalance = totalIncome - totalExpenses - totalSavings;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <div className="h-8 w-8 rounded-full bg-green-500/20 dark:bg-green-500/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center mt-1">
            <p className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
              {incomeCount} transactions
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
          <div className="text-2xl font-bold text-foreground">
            ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center mt-1">
            <p className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
              {expenseCount} transactions
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          <div className="h-8 w-8 rounded-full bg-purple-500/20 dark:bg-purple-500/10 flex items-center justify-center">
            <Coins className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ₹{totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center mt-1">
            <p className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
              {savingsCount} transactions
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
            remainingBalance >= 0 
              ? 'bg-blue-500/20 dark:bg-blue-500/10' 
              : 'bg-amber-500/20 dark:bg-amber-500/10'
          }`}>
            {remainingBalance >= 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ₹{Math.abs(remainingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center mt-1">
            <p className={`text-xs px-2 py-0.5 rounded-full ${
              remainingBalance >= 0 
                ? 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
                : 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30'
            }`}>
              {remainingBalance >= 0 ? 'Available funds' : 'Deficit'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

SummaryCards.displayName = 'SummaryCards';