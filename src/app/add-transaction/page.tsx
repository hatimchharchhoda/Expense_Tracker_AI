'use client'
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function Page() {
  const { register, handleSubmit, resetField } = useForm();
  const { toast } = useToast();
  const { data: session } = useSession();
  const userId = session?.user?._id;
  const router = useRouter();
  const onSubmit = async (data: any) => {
    if (!data) return {};
    let color;
    if (data.type === "Investment") {
      color = "#FCBE44";
    } else if (data.type === "Expense") {
      color = "#FF0000";
    } else {
      color = "#90EE90";
    }
    const send = {
      name: data.name,
      type: data.type,
      amount: data.amount,
      user: userId,
      color,
    };
    const response = await axios.post("/api/create-transaction", send);
    if (response) {
      toast({
        title: "Success",
        description: "Transaction Added Successfully",
        variant: "default",
      });
    } else {
      toast({
        title: "Failed",
        description: "Transaction Failed",
        variant: "destructive",
      });
    }
    resetField("name");
    resetField("amount");
    router.replace('/history');
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Add Transaction
        </h1>
        <form id="form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6">
            {/* Input for Transaction Name */}
            <div>
              <input
                type="text"
                {...register("name")}
                placeholder="Salary, House Rent, SIP"
                className="w-full px-4 py-2 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Dropdown for Transaction Type */}
            <div>
              <select
                className="w-full px-4 py-2 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("type")}
                defaultValue={"Investment"}
              >
                <option value="Investment">Investment</option>
                <option value="Expense">Expense</option>
                <option value="Savings">Savings</option>
              </select>
            </div>
            {/* Input for Transaction Amount */}
            <div>
              <input
                type="text"
                {...register("amount")}
                placeholder="Amount"
                className="w-full px-4 py-2 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 transition-all"
              >
                Make Transaction
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Page;
