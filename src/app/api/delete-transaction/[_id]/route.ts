import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Transaction } from '@/models/model';
import mongoose from 'mongoose';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { _id: string } }
): Promise<NextResponse> {
  await dbConnect();

  const { _id } = params;

  // Validate transactionId format
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return NextResponse.json(
      {
        success: false,
        message: 'Invalid transaction ID format',
      },
      { status: 400 }
    );
  }

  try {
    // Attempt to delete the transaction
    const deleteResult = await Transaction.deleteOne({ _id: _id });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Transaction not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Transaction deleted',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error while deleting transaction',
      },
      { status: 500 }
    );
  }
}
