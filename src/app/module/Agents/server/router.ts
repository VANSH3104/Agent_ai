import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { generateSlug } from "random-word-slugs";
import { db } from '@/db/index';
import { workflows } from '@/db/schema';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
export const Agentrouter = createTRPCRouter({
  create: protectedProcedure.mutation(({ctx})=>{
    return db.insert(workflows).values({
      name: generateSlug(4),
      userId: ctx.user.user.id,
    })
  }),
  remove : protectedProcedure.input(z.object({id: z.string().uuid()})).mutation(({ctx, input})=>{
    return db.delete(workflows).where(
      and(
        eq(workflows.userId, ctx.user.user.id),
        eq(workflows.id, input.id)  
      )
    ).execute();
  }),
  updateName: protectedProcedure.input(z.object({id: z.string().uuid(), name: z.string().min(2).max(100)})).mutation(({ctx, input})=>{
    return db.update(workflows).set({name: input.name}).where(
      and(
        eq(workflows.userId, ctx.user.user.id),
        eq(workflows.id, input.id)  
      )
    ).execute();
  }),
  getOne: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(({ ctx, input }) => {
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