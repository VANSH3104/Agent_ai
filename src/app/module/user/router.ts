import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export const UserRouter = createTRPCRouter({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const [currentUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, ctx.user.user.id));

    return currentUser ?? null;
  }),
});
