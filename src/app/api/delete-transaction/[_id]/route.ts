import { NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Transaction } from '@/models/model';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string } }
): Promise<Response> {
  await dbConnect();

  try {
    const deleteResult = await Transaction.deleteOne({ _id: params.type });

    if (deleteResult.deletedCount === 0) {
      return Response.json(
        {
          success: false,
          message: 'Transaction not found',
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'Transaction Deleted',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting Transaction:', error);
    return Response.json(
      {
        success: false,
        message: 'Error while deleting Transaction',
      },
      { status: 500 }
    );
  }
}