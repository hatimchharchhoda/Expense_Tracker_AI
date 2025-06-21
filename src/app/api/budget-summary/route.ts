import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Transaction, Budgets } from '@/models/model';

// Force this route to be dynamic
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Get URL parameters using NextRequest
    const { searchParams } = request.nextUrl;
    const month = parseInt(searchParams.get('month') || currentMonth.toString());
    const year = parseInt(searchParams.get('year') || currentYear.toString());
    const userId = searchParams.get('userId'); // Add userId parameter
    
    // Validate userId if provided
    if (userId) {
      // Get budgets for specific user
      const budgets = await Budgets.find({ 
        month, 
        year, 
        user: userId 
      });
      
      // Create start and end date for the specified month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      // Get transactions for specific user and month
      const transactions = await Transaction.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate },
        type: { $ne: 'Income' }
      });
      
      // Calculate spending by category
      const spendingByCategory: Record<string, number> = {};
      transactions.forEach((transaction: any) => {
        const { type, amount } = transaction;
        if (!spendingByCategory[type]) {
          spendingByCategory[type] = 0;
        }
        spendingByCategory[type] += amount;
      });
      
      // Combine budget and spending data
      const summary = budgets.map((budget: any) => {
        const { category, amount } = budget;
        const spent = spendingByCategory[category] || 0;
        const remaining = amount - spent;
        const percentage = amount > 0 ? (spent / amount) * 100 : 0;
        
        return {
          category,
          budgeted: amount,
          spent,
          remaining,
          percentage: Math.min(percentage, 100)
        };
      });
      
      // Add categories that have spending but no budget
      Object.keys(spendingByCategory).forEach(category => {
        const hasBudget = summary.some((item: any) => item.category === category);
        if (!hasBudget) {
          summary.push({
            category,
            budgeted: 0,
            spent: spendingByCategory[category],
            remaining: -spendingByCategory[category],
            percentage: 100
          });
        }
      });
      
      return NextResponse.json({
        success: true,
        month,
        year,
        userId,
        summary
      });
    } else {
      // If no userId, return general data (for static generation)
      return NextResponse.json({
        success: true,
        month: currentMonth,
        year: currentYear,
        message: 'Please provide userId parameter',
        summary: []
      });
    }
    
  } catch (error) {
    console.error('Error fetching budget summary:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch budget summary' 
    }, { status: 500 });
  }
}