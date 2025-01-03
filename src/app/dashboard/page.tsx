'use client'
import { Chart, ArcElement } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { chartData, getLabels, getTotal } from '@/helper/graphData';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import Label from '@/components/Labels';
import { useSession } from 'next-auth/react';

Chart.register(ArcElement)

function Page() {
    const [transactions, setTransactions] = useState([]);
    const { data: session } = useSession();
    const storedSession = localStorage.getItem('session');
    if (!storedSession) {
        console.log("Sesson error");
        return;
    }
    const getTransactions = useCallback(async () => {
        const { user } = JSON.parse(storedSession);
        const userId = user._id;
        try {
            const response = await axios.post('/api/get-transaction', { user: userId });
            setTransactions(response.data.data);
        } catch (error) {
            console.log(error)
        }
    }, [session]);
    useEffect(() => {
        getTransactions()
    }, []); // Empty dependency array ensures it runs once when the component is mounted
    return (
        <div className="flex justify-center py-8  min-h-screen">
            <div className="item relative max-w-xs mx-auto">
                {/* Render Doughnut chart directly */}
                {transactions.length > 0 ? (
                    <div className="chart relative">
                        {/* Centered Total */}
                        <div className="absolute inset-0 flex flex-col justify-center items-center z-10">
                            <h3 className="text-lg font-bold">Total</h3>
                            <span className="text-3xl text-emerald-400">
                                ${getTotal(transactions) ?? 0}
                            </span>
                        </div>
                        {/* Doughnut Chart */}
                        <Doughnut {...chartData(transactions)} />
                    </div>
                ) : (
                    <p>No transactions available</p> // Display message if no transactions are found
                )}
                <div className="flex flex-col py-10 gap-4">
                    {/* Additional Labels or other components */}
                    <Label></Label>
                </div>
            </div>
        </div>
    )
}

export default Page;
