'use client';

import { lazy, memo,Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  name: string;
  color: string;
  date: Date;
  description?: string;
}

interface CategoryBreakdownProps {
  expenseTransactions: Transaction[];
  createDoughnutChartData: any;
  totalExpenses: number;
  theme: string;
  selectedMonth: number;
  selectedYear: number;
  monthNames: string[];
}

const Doughnut = lazy(() => import('react-chartjs-2').then(mod => ({ default: mod.Doughnut })));

export const CategoryBreakdown = memo(({
  expenseTransactions,
  createDoughnutChartData,
  totalExpenses,
  theme,
  selectedMonth,
  selectedYear,
  monthNames
}: CategoryBreakdownProps) => {
  return (
    <Card className="shadow-md border border-border hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              Spending by Category
            </CardTitle>
            <CardDescription>
              Breakdown for {monthNames[selectedMonth - 1]} {selectedYear}
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
                <h3 className="text-xs font-medium text-muted-foreground">Monthly Expenses</h3>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </span>
              </div>
            </div>
            
            {/* Doughnut Chart */}
            <div className="relative h-[300px] flex items-center justify-center" style={{ overflow: 'visible' }}>
              <div className="h-[290px] w-[290px]">
                                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-[290px] w-[290px] rounded-full" />
                  </div>
                }>

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
                            const percentage = totalExpenses > 0 ? ((value as number) / totalExpenses * 100).toFixed(1) : '0';
                            return `₹${(value as number).toLocaleString('en-IN')} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
                </Suspense>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] p-6 bg-accent/30 rounded-lg">
            <PieChart className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center mb-2">No category data available for {monthNames[selectedMonth - 1]} {selectedYear}</p>
            <Link href="/add-transaction" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Add your first transaction
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CategoryBreakdown.displayName = 'CategoryBreakdown';