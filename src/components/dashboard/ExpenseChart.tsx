'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface ExpenseChartProps {
  monthlyExpenseData: any;
  theme: string;
  selectedYear: number;
  selectedMonth: number;
  monthNames: string[];
  hasData: boolean;
}

export const ExpenseChart = memo(({ 
  monthlyExpenseData, 
  theme, 
  selectedYear, 
  selectedMonth, 
  monthNames,
  hasData 
}: ExpenseChartProps) => {
  return (
    <Card className="shadow-md border border-border hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              Monthly Expenses - {selectedYear}
            </CardTitle>
            <CardDescription>
              Your spending pattern throughout {selectedYear} (highlighted: {monthNames[selectedMonth - 1]})
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
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
            <p className="text-muted-foreground text-center mb-2">No expense data available for {selectedYear}</p>
            <Link href="/add-transaction" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Add your first transaction
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ExpenseChart.displayName = 'ExpenseChart';