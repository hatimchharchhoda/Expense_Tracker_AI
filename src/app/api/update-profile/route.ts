import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/model';

export async function PUT(request: Request) {
  await dbConnect();

  try {
    const { userId, username, budget } = await request.json();

    if (!userId) {
      return Response.json(
        {
          success: false,
          message: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await UserModel.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return Response.json(
          {
            success: false,
            message: 'Username is already taken',
          },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updateData: any = {};
    if (username) updateData.username = username;
    if (budget !== undefined) updateData.budget = budget;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return Response.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    return Response.json(
      {
        success: false,
        message: 'Error updating profile',
      },
      { status: 500 }
    );
  }
}