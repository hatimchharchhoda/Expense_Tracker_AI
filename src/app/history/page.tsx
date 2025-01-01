'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast"

interface Transact {
  _id: string; // Define the type of _id
  name: string;
  amount: number;
  color?: string; // Optional field
}

export default function List() {
  const [transactions, setTransactions] = useState<Transact[]>([]);
   const { toast } = useToast();

  const handleClick = async (e : any) => {
    await axios.delete(`/api/delete-transaction/${e.target.id}`)
    toast({
      title: 'Success',
      description: "Transaction Deleted",
      variant:"default"
    });
  };


  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get('/api/get-transaction');
        setTransactions(response.data.data); // Assuming response data contains the list
      } catch (error) {
        console.error(error);
      }
    };

    fetchTransactions();
  }, []); 


  return (
      <div className='flex items-center flex-col  bg-slate-300 min-h-screen py-4'>
        {transactions.map((transaction) => {
          return <div className="max-w-md w-full item flex justify-center bg-slate-100 m-3 p-3 rounded-r"
            style={{ borderRight: `8px solid ${transaction.color ?? '#e5e5e5'}` }}>
            <button
              className="px-3 text-black"
              id={transaction._id ?? ''}
              onClick={handleClick}
            >
              🗑️
            </button>
            <span className="block w-full">
              {transaction.name} - {transaction.amount}
            </span>
          </div>; // Example JSX for each transaction
        })}
      </div>
  );

}

// function Transaction({category, handler}: any) {
//   if (!category) return null;
// }




// transactions.map((transaction) => {
//   <div
//     className="item flex justify-center bg-gray-50 py-2 rounded-r"
//     style={{ borderRight: `8px solid ${transaction['color'] ?? '#e5e5e5'}` }}
//   >
//     {/* {transaction['name']}
//     <button
//       className="px-3 text-black"
//       data-id={transaction['_id'] ?? ''}
//       onClick={handleClick}
//     >
//       🗑️
//     </button>
//     <span className="block w-full">
//       {transaction['name']} - {transaction['amount']}
//     </span> */}
//   </div>
//   })