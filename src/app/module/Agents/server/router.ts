import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { generateSlug } from "random-word-slugs";
import { db } from '@/db/index';
import { workflows } from '@/db/schema';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
export const Agentrouter = createTRPCRouter({
  create: protectedProcedure.mutation(async ({ ctx }) => {
      const [newAgent] = await db.insert(workflows).values({
        name: generateSlug(3),
        userId: ctx.user.user.id,
      }).returning();
      
      return newAgent;
  }),
  remove : protectedProcedure.input(z.object({id: z.string()})).mutation(({ctx, input})=>{
    return db.delete(workflows).where(
      and(
        eq(workflows.userId, ctx.user.user.id),
        eq(workflows.id, input.id)  
      )
    ).execute();
  }),
  updateName: protectedProcedure.input(z.object({id: z.string(), name: z.string().min(2).max(100)})).mutation(async({ctx, input})=>{
   const update = await db.update(workflows).set({name: input.name}).where(
      and(
        eq(workflows.userId, ctx.user.user.id),
        eq(workflows.id, input.id)  
      )
    ).returning();
    return update[0]; 
  }),
  getOne: protectedProcedure.input(z.object({ id: z.string() })).query(({ ctx, input }) => {
    return db
      .select().from(workflows).where(
        and(
          eq(workflows.userId, ctx.user.user.id),
          eq(workflows.id, input.id)
        )
      );
  }),
  getMany: protectedProcedure.query(({ ctx }) => {
    return db
      .select().from(workflows).where(
          eq(workflows.userId, ctx.user.user.id),
      );
  }),
})