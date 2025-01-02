import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { getLabels } from '@/helper/graphData';
import { useSession } from 'next-auth/react';

interface Labels {
    type: string;
    total: number;
    percent: number;
}

export default function Label() {
    const [transactions, setTransactions] = useState([]);
    const {data:session} = useSession()
    const getTransactions = useCallback(async () => {
        try {
            const userId = session?.user?._id;
            const data = {
                "user" : userId
            }
            const res = await axios.post('/api/get-transaction',data);
            setTransactions(res.data.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }, [session]);

    useEffect(() => {
        getTransactions();
    }, [getTransactions]);

    const labelData = getLabels(transactions,'type');
    return (
        <>
            {labelData.length > 0 ? (
                labelData.map((label, index) => (
                    <LabelComponent key={index} data={label}  />
                ))
            ) : (
                <p>No data available</p>
            )}
        </>
    );
}

function LabelComponent( data : any ) {
    if (!data) return null;
    return (
        <div className="labels flex justify-between items-center my-2">
            <div className="flex gap-2 items-center">
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: data.data.color ?? '#f9c74f' }}
                ></div>
                <h3 className="text-sm font-medium">{data.data.type ?? 'Unknown'}</h3>
            </div>
            <h3 className="font-bold text-sm">{Math.round(data.data.percent) ?? 0}%</h3>
        </div>
    );
}
