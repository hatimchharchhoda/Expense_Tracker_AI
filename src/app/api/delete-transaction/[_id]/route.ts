import dbConnect from '@/lib/dbConnect';
import {Transaction} from '@/models/model';

export async function DELETE(request:Request,{params} : any) {
    const {_id} = await params;
    await dbConnect();
    try {
        
        const Delete = await Transaction.deleteOne({
            _id
        })
        if(Delete.deletedCount === 0 ){
            return Response.json({
                success: false,
                message : "Transaction not found",
            },
            { status: 404 });
        }
        return Response.json({
            success: true,
            message : "Transaction Deleted",
        },
        { status: 200 });
    } catch (error) {
        console.log('Error deleting Transaction:', error);
        return Response.json({
            success: false,
            message : "Error while deleting Transaction",
        },
        { status: 500 });
    }
}