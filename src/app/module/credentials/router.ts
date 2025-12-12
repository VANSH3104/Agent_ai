import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { credentials } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const emailCredentialsSchema = z.object({
    host: z.string().min(1, "SMTP host is required"),
    port: z.number().int().positive("SMTP port must be positive"),
    secure: z.boolean().default(true),
    user: z.string().min(1, "SMTP user is required"),
    password: z.string().min(1, "SMTP password is required"),
    fromEmail: z.string().email("Valid email address is required"),
    fromName: z.string().optional(),
});

export const credentialsRouter = createTRPCRouter({
    // Get user's email SMTP credentials
    getEmailCredentials: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
        if (!userId) throw new Error("Unauthorized");

        const result = await db
            .select()
            .from(credentials)
            .where(
                and(
                    eq(credentials.userId, userId),
                    eq(credentials.type, "EMAIL_SMTP"),
                    eq(credentials.isActive, true)
                )
            )
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return {
            id: result[0].id,
            name: result[0].name,
            data: result[0].data as any,
        };
    }),

    // Save or update email SMTP credentials
    saveEmailCredentials: protectedProcedure
        .input(emailCredentialsSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
            if (!userId) throw new Error("Unauthorized");

            // Check if credentials already exist
            const existing = await db
                .select()
                .from(credentials)
                .where(
                    and(
                        eq(credentials.userId, userId),
                        eq(credentials.type, "EMAIL_SMTP")
                    )
                )
                .limit(1);

            const credentialData = {
                host: input.host,
                port: input.port,
                secure: input.secure,
                user: input.user,
                password: input.password,
                fromEmail: input.fromEmail,
                fromName: input.fromName,
            };

            if (existing.length > 0) {
                // Update existing credentials
                await db
                    .update(credentials)
                    .set({
                        data: credentialData,
                        isActive: true,
                        updatedAt: new Date(),
                    })
                    .where(eq(credentials.id, existing[0].id));

                return {
                    success: true,
                    message: "Email credentials updated successfully",
                    id: existing[0].id,
                };
            } else {
                // Create new credentials
                const result = await db
                    .insert(credentials)
                    .values({
                        userId,
                        name: "Email SMTP",
                        type: "EMAIL_SMTP",
                        data: credentialData,
                        description: "SMTP credentials for sending emails",
                        isActive: true,
                    })
                    .returning();

                return {
                    success: true,
                    message: "Email credentials saved successfully",
                    id: result[0].id,
                };
            }
        }),
});
