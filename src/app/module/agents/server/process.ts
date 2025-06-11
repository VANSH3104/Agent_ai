import { db } from "@/db";
import { aiAgents } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";

export const agentsRouter = createTRPCRouter({
    getMany: baseProcedure.query(async ()=> {
        const data = await db.select().from(aiAgents);
        return data;
    })
})