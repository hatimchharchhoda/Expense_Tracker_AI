// app/add-transaction/page.tsx
'use client'

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, Coins, DollarSign, Loader2, ListPlus, Receipt, Tag } from "lucide-react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useTheme } from "next-themes";
import { PREDEFINED_CATEGORIES } from "@/models/model";

interface TransactionFormData {
  name: string;
  type: string; // Category
  amount: string;
  description: string;
}

function AddTransactionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, resetField, setValue, watch, formState: { errors } } = useForm<TransactionFormData>();
  const [categories, setCategories] = useState<{type: string, color: string}[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const selectedType = watch("type");
  const userData = useSelector((state: any) => state.auth?.userData);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state to true when component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only access theme-related variables after mounting to avoid hydration mismatch
  const isDark = mounted && theme === 'dark';
  
  // Get categories on component mount
  useEffect(() => {
    setCategories(PREDEFINED_CATEGORIES);
    // Set default category
    if (!selectedType) {
      setValue("type", "Other");
    }
  }, [setValue, selectedType]);

  // Memoize the color getter function
  const getCategoryColor = useCallback((categoryType: string): string => {
    const category = categories.find(cat => cat.type === categoryType);
    return category?.color || "#CCCCCC";
  }, [categories]);

  const onSubmit = useCallback(async (data: TransactionFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Get user from localStorage
      const storedSession = localStorage.getItem('session');
      if (!storedSession) {
        toast({
          title: "Error",
          description: "Please login to continue",
          variant: "destructive",
        });
        return;
      }
      
      const { user } = JSON.parse(storedSession);

      // Calculate color based on the category
      const color = getCategoryColor(data.type);
      
      // Format the transaction data
      const transaction = {
        name: data.name,
        type: data.type,
        amount: parseFloat(data.amount),
        description: data.description || "",
        color,
        user: user._id,
        date: new Date()
      };

      // Send to API
      const response = await axios.post("/api/create-transaction", transaction);

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Transaction added successfully",
          variant: "default",
        });

        // Update user spent amount if it's an expense
        if (data.type !== 'Income' && user._id) {
          try {
            await fetch('/api/add-spent', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user._id,
                spent: transaction.amount
              }),
            });
          } catch (error) {
            console.log("Error updating spent amount:", error);
          }
        }

        // Clear form fields
        resetField("name");
        resetField("amount");
        resetField("description");
        
        // Navigate to history page
        router.push('/history');
      }
    } catch (error) {
      console.error("Transaction error:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, toast, getCategoryColor, router, resetField, categories]);

  // Don't render UI until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen py-8 bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-center mb-6">
          <Link 
            href="/dashboard" 
            className="flex items-center px-4 py-2 rounded-full bg-secondary/20 text-secondary-foreground hover:bg-secondary/30 shadow-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Left Side - Tips */}
          <div className="md:col-span-2">
            <div className="rounded-xl shadow-lg bg-card">
              <div className="p-6 rounded-t-xl bg-gradient-to-r from-blue-600 to-blue-500">
                <h2 className="text-xl font-bold text-white mb-1">Transaction Guide</h2>
                <p className="text-blue-100 text-sm">Tips for managing your finances</p>
              </div>
              
              <div className="p-6">
                <ul className="space-y-4 text-card-foreground">
                  <li className="flex">
                    <div className="mr-3 mt-1">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">Income Tracking</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Use the "Income" category for all incoming money like salary, gifts, or refunds.</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="mr-3 mt-1">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">Categorize Precisely</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Choosing the right category helps with budget tracking and expense analysis.</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="mr-3 mt-1">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">Add Descriptions</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Detailed descriptions make it easier to remember transactions later.</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="mr-3 mt-1">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">Regular Updates</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Track transactions as they happen for the most accurate financial picture.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Right Side - Form */}
          <div className="md:col-span-3">
            <div className="rounded-xl shadow-lg overflow-hidden bg-card">
              {/* Header with blue gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 pt-6 pb-8 px-6 relative">
                <ListPlus className="h-8 w-8 text-white/90 mb-2" />
                <h1 className="text-2xl font-bold text-white">Add Transaction</h1>
                <p className="text-blue-100 mt-1 text-sm">Record your income or expense</p>
                
                {/* Category Pill */}
                <div className="absolute bottom-0 right-6 transform translate-y-1/2">
                  <div 
                    className="flex items-center space-x-2 px-4 py-2 rounded-full shadow-md bg-card"
                    style={{borderLeft: `4px solid ${getCategoryColor(selectedType)}`}}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{backgroundColor: getCategoryColor(selectedType)}}
                    />
                    <span className="font-medium text-sm text-card-foreground">{selectedType || 'Select Category'}</span>
                  </div>
                </div>
              </div>
              
              {/* Form Section */}
              <div className="p-6 pt-10">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Transaction Name Input */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-foreground">
                      <Receipt className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                      Transaction Name
                    </label>
                    <input
                      type="text"
                      {...register("name", { required: "Name is required" })}
                      placeholder="Groceries, Rent, Salary, etc."
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200 placeholder:text-muted-foreground"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive flex items-center mt-1">
                        <span className="h-1 w-1 rounded-full bg-destructive mr-2"></span>
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Description Input */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-foreground">
                      <Tag className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      {...register("description")}
                      placeholder="Add extra details about this transaction"
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200 placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Two Columns for Category and Amount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Category Selection */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-foreground">
                        <Coins className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                        Category
                      </label>
                      <div className="relative">
                        <select
                          {...register("type", { required: "Category is required" })}
                          className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200 appearance-none pr-10 text-foreground"
                        >
                          {categories.map((category) => (
                            <option key={category.type} value={category.type}>
                              {category.type}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {errors.type && (
                        <p className="text-sm text-destructive flex items-center mt-1">
                          <span className="h-1 w-1 rounded-full bg-destructive mr-2"></span>
                          {errors.type.message}
                        </p>
                      )}
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-foreground">
                        <DollarSign className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                        Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 font-medium text-muted-foreground">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          {...register("amount", {
                            required: "Amount is required",
                            min: { value: 0.01, message: "Amount must be positive" },
                            pattern: {
                              value: /^\d+(\.\d{1,2})?$/,
                              message: "Amount can have up to 2 decimal places"
                            }
                          })}
                          placeholder="0.00"
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200 font-medium text-foreground"
                        />
                      </div>
                      {errors.amount && (
                        <p className="text-sm text-destructive flex items-center mt-1">
                          <span className="h-1 w-1 rounded-full bg-destructive mr-2"></span>
                          {errors.amount.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Add Transaction</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                                    {/* Quick Links */}
                  <div className="flex justify-center mt-6 pt-4 border-t border-border">
                    <div className="flex space-x-5">
                      <Link
                        href="/history"
                        className="text-sm transition-colors flex items-center text-primary hover:text-primary/80"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Transaction History
                      </Link>
                      
                      <Link
                        href="/budget"
                        className="text-sm transition-colors flex items-center text-primary hover:text-primary/80"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Manage Budget
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Recent Transactions Shortcut */}
            {/* <div className="mt-5 rounded-xl shadow-md p-5 bg-card border border-border">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-card-foreground">
                  Quick Access
                </h3>
                <Link 
                  href="/dashboard" 
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Go to Dashboard
                </Link>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <Link 
                  href="/history" 
                  className="p-3 rounded-lg flex flex-col items-center justify-center text-center transition-colors bg-accent hover:bg-accent/80 text-accent-foreground"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-xs">History</span>
                </Link>
                
                <Link 
                  href="/budget" 
                  className="p-3 rounded-lg flex flex-col items-center justify-center text-center transition-colors bg-accent hover:bg-accent/80 text-accent-foreground"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs">Budget</span>
                </Link>
                
                <Link 
                  href="/dashboard" 
                  className="p-3 rounded-lg flex flex-col items-center justify-center text-center transition-colors bg-accent hover:bg-accent/80 text-accent-foreground"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="text-xs">Dashboard</span>
                </Link>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddTransactionPage;