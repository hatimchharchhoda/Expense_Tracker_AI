import mongoose, { Schema, Document } from 'mongoose';

// Define category interface
export interface Category extends Document {
  type: string;
  color: string;
}

// Define User interface
export interface Usertype extends Document {
  username: string;
  email: string;
  password: string;
  budget: number;
  spent: number;
}

// Transaction interface - with user reference
export interface Transaction extends Document {
  name: string;
  type: string;
  amount: number;
  color: string;
  user: Schema.Types.ObjectId | Usertype;
  date: Date;
  description?: string; // Added description field
}

// Budget interface for category-specific budgets
export interface Budget extends Document {
  user: Schema.Types.ObjectId | Usertype;
  category: string;
  amount: number;
  month: number;
  year: number;
}

// Define predefined categories we'll use throughout the application
// In your models/model.js file:
export const PREDEFINED_CATEGORIES = [
  { type: 'Housing', color: '#E57373' },
  { type: 'Food', color: '#81C784' },
  { type: 'Transportation', color: '#64B5F6' },
  { type: 'Entertainment', color: '#BA68C8' },
  { type: 'Healthcare', color: '#4DB6AC' },
  { type: 'Education', color: '#FFD54F' },
  { type: 'Shopping', color: '#F06292' },
  { type: 'Utilities', color: '#7986CB' },
  { type: 'Income', color: '#66BB6A' },
  { type: 'Savings', color: '#4FC3F7' }, 
  { type: 'Other', color: '#A1887F' }
];

// Create schemas only on the server side
const isServer = typeof window === 'undefined';

// Define schemas
const categories_model = new Schema<Category>({
  type: { type: String, required: true },
  color: { type: String, default: '#FCBE44' }
});

const transaction_model = new Schema<Transaction>({
  name: { type: String, default: 'Anonymous' },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  color: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

const budget_model = new Schema<Budget>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true }
});

const UserSchema = new Schema<Usertype>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/.+@.+\..+/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  budget: {
    type: Number,
    default: 0
  },
  spent: {
    type: Number,
    default: 0
  },
});

// Client-side safe exports
let Categories;
let Transaction;
let Budgets;
let UserModel;

if (isServer) {
  // Only create models on the server
  UserModel = mongoose.models.User || mongoose.model<Usertype>('User', UserSchema);
  Categories = mongoose.models.categories || mongoose.model<Category>('categories', categories_model);
  Transaction = mongoose.models.transaction || mongoose.model<Transaction>('transaction', transaction_model);
  Budgets = mongoose.models.budget || mongoose.model<Budget>('budget', budget_model);
} else {
  // On client-side, we just provide empty objects to prevent errors
  UserModel = {};
  Categories = {};
  Transaction = {};
  Budgets = {};
}

export { Categories, Transaction, Budgets };
export default UserModel;