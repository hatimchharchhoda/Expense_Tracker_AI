// app/add-transaction/page.tsx

// Move 'use client' to a separate client component
'use client'
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Switch } from "@nextui-org/switch";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useDispatch, useSelector } from "react-redux";
import { AuthState, login } from "@/store/authSlice";

// Separate the AI initialization outside the component
const genAI = new GoogleGenerativeAI("AIzaSyAf61goeFziI7H9cMRqKFmzjT_YfRdyAQs");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Move color mapping outside component
const transactionColors = {
  Investment: "#FCBE44",
  Expense: "#FF0000",
  Savings: "#90EE90",
} as const;

interface TransactionFormData {
  name: string;
  type: string;
  amount: string;
  AI: boolean;
}

interface Transaction extends TransactionFormData {
  user: string;
  color: string;
}

function AddTransactionPage() {
  const dispatch = useDispatch()
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, resetField, formState: { errors } } = useForm<TransactionFormData>();
  const [generate, setGenerate] = useState(false);
  const [type, setType] = useState("Investment");
  const userData = useSelector((state: any) => state.auth?.userData);
  const { toast } = useToast();
  const router = useRouter();
  const userId = userData?.user._id
  // Memoize the color getter function
  const getTransactionColor = useCallback((type: string): string => {
    return transactionColors[type as keyof typeof transactionColors] || "#01F4FC";
  }, []);

  const onSubmit = useCallback(async (data: TransactionFormData) => {
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

      if (data.AI) {
        const categories = [
          "Food & Dining", "Shopping", "Transportation",
          "Bills & Utilities", "Entertainment", "Healthcare",
          "Travel", "Business", "Other"
        ];

        const prompt = `You have to categorize this expense : ${data.name} based on given ${categories} and answer in only one category`;

        try {
          const result = await model.generateContent(prompt);
          if (result.response.candidates) {
            const type = result.response.candidates[0].content.parts[0].text;
            if (type) {
              data.type = type;
              setType(type);
            }
          }
        } catch (error) {
          console.error("Error making request:", error);
        }
      }

      const { user } = JSON.parse(storedSession);
      const transaction: Transaction = {
        ...data,
        user: user._id,
        color: getTransactionColor(data.type)
      };
      // if((transaction.amount + userData.user.spent) > userData.user.budget){
      //   toast({
      //     title: "Error",
      //     description: "Amount excedds budget",
      //     variant: "destructive",
      //   });
      //   throw "Amount exceeds budget"
      // }
      const response = await axios.post("/api/create-transaction", transaction);

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Transaction added successfully",
          variant: "default",
        });
        try {
          const response = await fetch('/api/add-spent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              spent: transaction.amount
            }),
          });
          const data = await response.json();

          if (data.success) {
            const updatedUser = {
              ...userData,
              user: {
                ...user,
                spent: data.user.spent
              }

            }
            console.log(updatedUser)
            dispatch(login(updatedUser));
          }
        } catch {
          console.log("error adding spent")
        }

        resetField("name");
        resetField("amount");
        router.replace('/history');
      }
    } catch (error) {
      if(error != "Amount exceeds budget"){
        toast({
          title: "Error",
          description: "Failed to add transaction. Please try again.",
          variant: "destructive",
        });
      }
      throw error
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, toast, getTransactionColor, router, resetField]);

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
            <div className="flex space-x-10">
              <label className="text-sm font-medium text-gray-700">
                Transaction Type
              </label>
              <div>
                <Switch
                  {...register("AI")}
                  onValueChange={() => setGenerate(!generate)}
                  size="sm"
                >
                  Automatic Generate
                </Switch>
              </div>
            </div>
            <select
              {...register("type")}
              disabled={generate}
              defaultValue={type}
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

export default AddTransactionPage;