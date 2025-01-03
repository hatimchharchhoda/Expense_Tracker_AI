'use client'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface TransactionFormData {
  name: string;
  type: "Investment" | "Expense" | "Savings";
  amount: string;
}

interface Transaction extends TransactionFormData {
  user: string;
  color: string;
}

function Page() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, resetField, formState: { errors } } = useForm<TransactionFormData>();
  const { toast } = useToast();
  const router = useRouter();

  const getTransactionColor = (type: string): string => {
    const colors = {
      Investment: "#FCBE44",
      Expense: "#FF0000",
      Savings: "#90EE90"
    };
    return colors[type as keyof typeof colors] || "#90EE90";
  };

  const updateLocalCache = (newTransaction: Transaction) => {
    try {
      const cachedData = localStorage.getItem('dashboardCache');
      if (cachedData) {
        const { transactions, timestamp } = JSON.parse(cachedData);
        transactions.push(newTransaction);
        localStorage.setItem('dashboardCache', JSON.stringify({
          transactions,
          timestamp
        }));
      }
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
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
      const transaction: Transaction = {
        ...data,
        user: user._id,
        color: getTransactionColor(data.type)
      };

      const response = await axios.post("/api/create-transaction", transaction);
      
      if (response.status === 200) {
        updateLocalCache(response.data.transaction);
        
        toast({
          title: "Success",
          description: "Transaction added successfully",
          variant: "default",
        });
        
        resetField("name");
        resetField("amount");
        router.replace('/history');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md px-8 py-10 mx-4 bg-white rounded-2xl shadow-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Add Transaction
          </h1>
          <p className="mt-2 text-gray-600 text-center">
            Enter the details of your new transaction
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Transaction Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Transaction Name
            </label>
            <input
              type="text"
              {...register("name", { required: "Name is required" })}
              placeholder="Salary, House Rent, SIP"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Transaction Type Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Transaction Type
            </label>
            <select
              {...register("type")}
              defaultValue="Investment"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="Investment">Investment</option>
              <option value="Expense">Expense</option>
              <option value="Savings">Savings</option>
            </select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₹
              </span>
              <input
                type="number"
                {...register("amount", { 
                  required: "Amount is required",
                  min: { value: 0, message: "Amount must be positive" }
                })}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Add Transaction</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Page;