'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Doughnut } from 'react-chartjs-2';
import { PieChart } from 'lucide-react';
import { getTotal } from '@/helper/graphData';
import Label from '@/components/Labels';

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  name: string;
  color: string;
  date: Date;
  description?: string;
}

interface TransactionDistributionProps {
  filteredTransactions: Transaction[];
  selectedMonth: number;
  selectedYear: number;
    monthNames: string[];
}

export const TransactionDistribution = memo(({
  filteredTransactions,
  selectedMonth,
  selectedYear,
  monthNames
}: TransactionDistributionProps) => {
  return (
    <Card className="shadow-md border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <PieChart className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
          Transaction Distribution
        </CardTitle>
        <CardDescription>
          Overview of {monthNames[selectedMonth - 1]} {selectedYear} transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col items-center">
          {/* Centered Total */}
          <div className="relative w-[250px] h-[250px]">
            <div className="absolute inset-0 flex flex-col justify-center items-center z-10">
              <h3 className="text-sm font-medium text-muted-foreground">Total</h3>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                ₹{getTotal(filteredTransactions) ?? 0}
              </span>
            </div>
            
            {/* Doughnut Chart */}
            <Doughnut 
              data={
                {
                  datasets: [{
                      data: filteredTransactions.map(v => v.amount),
                      backgroundColor: filteredTransactions.map(v => v.color),
                      hoverOffset: 4,
                      borderRadius: 30,
                      spacing: 10
                  }],
                  labels: filteredTransactions.map(v => v.type)
                }
              }
              options={{
                cutout: '60%',
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
          
          <div className="flex flex-col pt-2 gap-2 w-full max-w-xs">
            <Label />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TransactionDistribution.displayName = 'TransactionDistribution';