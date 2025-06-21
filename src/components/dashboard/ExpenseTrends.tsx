'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Chart as Area } from '@/components/AreaGraph';

interface ExpenseTrendsProps {
  areaChartData: any[];
  selectedMonth: number;
  selectedYear: number;
  monthNames: string[];
}

export const ExpenseTrends = memo(({
  areaChartData,
  selectedMonth,
  selectedYear,
  monthNames
}: ExpenseTrendsProps) => {
  return (
    <Card className="shadow-md border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
          Expense Trends
        </CardTitle>
        <CardDescription>
          Expense patterns for {monthNames[selectedMonth - 1]} {selectedYear}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[300px]">
          <Area chartData={areaChartData} />
        </div>
      </CardContent>
    </Card>
  );
});

ExpenseTrends.displayName = 'ExpenseTrends';