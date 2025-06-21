// /app/api/create-transaction/route.ts
import dbConnect from '@/lib/dbConnect';
import { Transaction } from '@/models/model';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { name, type, amount, user, color, description, date } = await request.json();

    const Create = new Transaction({
      name,
      type,
      amount,
      user,
      color,
      description: description || '', // Handle optional description
      date: date ? new Date(date) : new Date() // Handle the date field
    });
    
    await Create.save();
    
    return Response.json({
      success: true,
      message: "Transaction Created",
    }, { status: 200 });
  } catch (error) {
    console.error('Error creating Transaction:', error);
    return Response.json({
      success: false,
      message: 'Error creating Transaction',
    }, { status: 500 });
  }
}