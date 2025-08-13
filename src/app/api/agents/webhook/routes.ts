import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
    try {
        const body = await req.json();
        const {workflowId , payload} = body;
        if (!workflowId || !payload) {
        return NextResponse.json({ error: "workflowId and payload required" }, { status: 400 });
        };
         
        //calling kafka 
        return NextResponse.json({message: "webhook queued"});
    } catch (error) {
        console.error("webhook failed to execute" , error);
        return NextResponse.json({error: "failed to execute webhook"}),{status: 500};
    }
}