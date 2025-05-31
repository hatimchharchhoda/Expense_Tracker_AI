import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/model';
import { z } from 'zod';
import { usernameValidation } from '@/schemas/signUpSchema';

const UsernameQuerySchema = z.object({
  username: usernameValidation,
});

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const queryParams = {
      username: request.nextUrl.searchParams.get('username'),
    };

    const result = UsernameQuerySchema.safeParse(queryParams);

    if (!result.success) {
      const usernameErrors = result.error.format().username?._errors || [];
      return NextResponse.json(
        {
          success: false,
          message:
            usernameErrors.length > 0
              ? usernameErrors.join(', ')
              : 'Invalid query parameters',
        },
        { status: 400 }
      );
    }

    const { username } = result.data;

    const existingUser = await UserModel.findOne({ username });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username is already taken',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Username is unique',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error checking username',
      },
      { status: 500 }
    );
  }
}