'use client'
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast"
import axios from "axios";
// import Transactions from '@/components/TransactionForm'
import React from 'react'
function Page() {
  const { register, handleSubmit, resetField } = useForm();
  //const [addTransaction] = 
  // await dbConnect()
  const { toast } = useToast();
  const onSubmit = async (data:any) => {
      if (!data) return {};
      let color;
      if(data.type == "Investment"){
          color = '#FCBE44'
      }else if(data.type == "Expense"){
          color = '#ff0000'
      }else{
          color = "#90ee90";
      }
      const send = {
          "name" : data.name,
          "type" : data.type,
          "amount": data.amount,
          color
      }
      await axios.post('/api/create-transaction', send )
      toast({
          title: 'Success',
          description: "Transaction Added Succesfully",
          variant:"default"
        });
      resetField('name');
      resetField('amount');
  }

  return (
    <div className="flex items-center justify-center bg-slate-300 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h1 className="font-bold pb-4 text-xl">Transactions</h1>

          <form id="form" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4">
                  <div className="input-group">
                      <input type="text" {...register('name')} placeholder="Salary, House Rent, SIP" className="form-input border-2 border-slate-300"></input>
                  </div>
                  <select className="form-input" {...register('type')} defaultValue={'Investment'}>
                      <option value="Investment" >Investment</option>
                      <option value="Expense">Expense</option>
                      <option value="Savings">Savings</option>
                  </select>
                  <div className="input-group">
                      <input type="text" {...register('amount')} placeholder="Amount" className="form-input border-2"></input>
                  </div>
                  <div className="submit-btn">
                      <button className="border-slate-600 border py-2 text-black btn-blue w-full">Make Transaction</button>
                  </div>
              </div>
          </form>
      </div>
      </div>
  )
}

export default Page




// return (
//   <div className="flex items-center justify-center bg-slate-300 min-h-screen">
//     <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
//       <Transactions />
//     </div>
//   </div>
// )