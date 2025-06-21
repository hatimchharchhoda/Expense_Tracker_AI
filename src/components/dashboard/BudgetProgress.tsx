'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { PREDEFINED_CATEGORIES } from '@/models/model';

interface BudgetItem {
  category: string;
  actual: number;
  budget: number;
  remaining: number;
}

interface BudgetProgressProps {
  budgetVsActualData: BudgetItem[];
  selectedMonth: number;
  selectedYear: number;
  monthNames: string[];
}

export const BudgetProgress = memo(({
  budgetVsActualData,
  selectedMonth,
  selectedYear,
  monthNames
}: BudgetProgressProps) => {
  return (
    <Card className="shadow-md border border-border hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              Budget Progress
            </CardTitle>
            <CardDescription>
              {monthNames[selectedMonth - 1]} {selectedYear} spending vs budget
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {budgetVsActualData.some(item => item.budget > 0) ? (
          <div className="space-y-5 mt-3">
            {budgetVsActualData
              .filter(item => item.budget > 0)
              .map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-2"
                        style={{ 
                          backgroundColor: PREDEFINED_CATEGORIES.find(
                            cat => cat.type === item.category
                          )?.color || '#ccc' 
                        }}
                      />
                      <span className="text-sm font-medium text-foreground">{item.category}</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        item.actual > item.budget 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-foreground'
                      }`}>
                        ₹{item.actual.toLocaleString('en-IN')}
                      </span>
                      <span className="text-muted-foreground mx-1">/</span>
                      <span className="text-sm text-muted-foreground">
                        ₹{item.budget.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        item.actual > item.budget 
                          ? 'bg-red-500' 
                          : item.actual > item.budget * 0.8
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, (item.actual / item.budget) * 100)}%`,
                        transition: 'width 1s ease-in-out'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {Math.min(100, Math.round((item.actual / item.budget) * 100))}% used
                    </span>
                    {item.remaining > 0 && (
                      <span className="text-green-600 dark:text-green-400">
                        ₹{item.remaining.toLocaleString('en-IN')} remaining
                      </span>
                    )}
                    {item.remaining < 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        ₹{Math.abs(item.remaining).toLocaleString('en-IN')} over budget
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[260px] p-6 bg-accent/30 rounded-lg">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center mb-2">No budget data for {monthNames[selectedMonth - 1]} {selectedYear}</p>
            <Link href="/budget" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Set up your budget
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

BudgetProgress.displayName = 'BudgetProgress';