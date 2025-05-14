// app/api/budgets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Budgets } from '@/models/model';

// Get all budgets for a user
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const budgets = await Budgets.find({ user: userId });
    return NextResponse.json(budgets, { status: 200 });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

// Create a new budget
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { category, amount, month, year, user } = body;
    
    if (!category || !amount || !month || !year || !user) {
      return NextResponse.json(
        { error: 'All fields are required (category, amount, month, year, user)' }, 
        { status: 400 }
      );
    }
    
    // Check if budget already exists for this category, month, and year
    const existingBudget = await Budgets.findOne({
      user,
      category,
      month,
      year
    });
    
    if (existingBudget) {
      return NextResponse.json(
        { error: 'A budget for this category and period already exists' }, 
        { status: 400 }
      );
    }
    
    // Create new budget
    const newBudget = await Budgets.create({
      category,
      amount,
      month,
      year,
      user
    });
    
    return NextResponse.json(newBudget, { status: 201 });
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
  }
}