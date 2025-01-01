import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/model';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  await dbConnect();
  console.log("DB connected");
  try {
    const { username, email, password } = await request.json();

    const user = await UserModel.findOne({
      username
    });

    if (user) {
      return Response.json(
        {
          success: false,
          message: 'Username is already taken',
        },
        { status: 400 }
      );
    }

    const existingUserByEmail = await UserModel.findOne({ email });

    if (existingUserByEmail) {
        return Response.json(
          {
            success: false,
            message: 'User already exists with this email',
          },
          { status: 400 }
        );
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
      });

      await newUser.save();

      return Response.json(
        {
          success: true,
          message: 'User registered successfully. Please login to your account.',
        },
        { status: 201 }
      );
    } 
  } catch (error) {
    console.error('Error registering user:', error);
    return Response.json(
      {
        success: false,
        message: 'Error registering user',
      },
      { status: 500 }
    );
  }
}