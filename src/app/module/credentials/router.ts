import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { credentials } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

const emailCredentialsSchema = z.object({
    host: z.string().min(1, "SMTP host is required"),
    port: z.number().int().positive("SMTP port must be positive"),
    secure: z.boolean().default(true),
    user: z.string().min(1, "SMTP user is required"),
    password: z.string().min(1, "SMTP password is required"),
    fromEmail: z.string().email("Valid email address is required"),
    fromName: z.string().optional(),
});

const aiCredentialsSchema = z.object({
    provider: z.string().min(1, "AI provider is required"),
    apiKey: z.string().min(1, "API key is required"),
    model: z.string().min(1, "Model is required"),
});

const databaseCredentialsSchema = z.object({
    connectionType: z.enum(["postgres", "mysql", "mongodb", "sqlite"]),
    connectionUrl: z.string().optional(),
    host: z.string().optional(),
    port: z.number().int().positive().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    ssl: z.boolean().optional(),
});

export const credentialsRouter = createTRPCRouter({
    // Get all user credentials
    getAllCredentials: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
        if (!userId) throw new Error("Unauthorized");

        const result = await db
            .select()
            .from(credentials)
            .where(eq(credentials.userId, userId))
            .orderBy(desc(credentials.createdAt));

        return result.map(cred => ({
            id: cred.id,
            name: cred.name,
            type: cred.type,
            description: cred.description,
            data: typeof cred.data === 'string' ? JSON.parse(cred.data) : cred.data,
            createdAt: cred.createdAt,
            updatedAt: cred.updatedAt
        }));
    }),
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

    // Get user's AI API credentials
    getAICredentials: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
        if (!userId) throw new Error("Unauthorized");

        const result = await db
            .select()
            .from(credentials)
            .where(
                and(
                    eq(credentials.userId, userId),
                    eq(credentials.type, "AI_API"),
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

    // Save or update AI API credentials
    saveAICredentials: protectedProcedure
        .input(aiCredentialsSchema)
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
                        eq(credentials.type, "AI_API")
                    )
                )
                .limit(1);

            const credentialData = {
                provider: input.provider,
                apiKey: input.apiKey,
                model: input.model,
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
                    message: "AI credentials updated successfully",
                    id: existing[0].id,
                };
            } else {
                // Create new credentials
                const result = await db
                    .insert(credentials)
                    .values({
                        userId,
                        name: "AI API",
                        type: "AI_API",
                        data: credentialData,
                        description: "API credentials for AI services",
                        isActive: true,
                    })
                    .returning();

                return {
                    success: true,
                    message: "AI credentials saved successfully",
                    id: result[0].id,
                };
            }
        }),

    // Get user's database credentials
    getDatabaseCredentials: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
        if (!userId) throw new Error("Unauthorized");

        const result = await db
            .select()
            .from(credentials)
            .where(
                and(
                    eq(credentials.userId, userId),
                    eq(credentials.type, "DATABASE"),
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

    // Save or update database credentials
    saveDatabaseCredentials: protectedProcedure
        .input(databaseCredentialsSchema)
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
                        eq(credentials.type, "DATABASE")
                    )
                )
                .limit(1);

            const credentialData = {
                connectionType: input.connectionType,
                connectionUrl: input.connectionUrl,
                host: input.host,
                port: input.port,
                database: input.database,
                username: input.username,
                password: input.password,
                ssl: input.ssl,
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
                    message: "Database credentials updated successfully",
                    id: existing[0].id,
                };
            } else {
                // Create new credentials
                const result = await db
                    .insert(credentials)
                    .values({
                        userId,
                        name: "Database",
                        type: "DATABASE",
                        data: credentialData,
                        description: "Database connection credentials",
                        isActive: true,
                    })
                    .returning();

                return {
                    success: true,
                    message: "Database credentials saved successfully",
                    id: result[0].id,
                };
            }
        }),

    // Slack Credentials
    getSlackCredentials: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
        if (!userId) throw new Error("Unauthorized");

        const result = await db
            .select()
            .from(credentials)
            .where(
                and(
                    eq(credentials.userId, userId),
                    eq(credentials.type, "SLACK"),
                    eq(credentials.isActive, true)
                )
            )
            .limit(1);

        if (result.length === 0) return null;
        const creds = result[0];
        return typeof creds.data === 'string' ? JSON.parse(creds.data) : creds.data;
    }),

    saveSlackCredentials: protectedProcedure
        .input(z.object({ credentials: z.object({ botToken: z.string(), workspaceId: z.string().optional() }) }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
            if (!userId) throw new Error("Unauthorized");

            const existing = await db
                .select()
                .from(credentials)
                .where(
                    and(
                        eq(credentials.userId, userId),
                        eq(credentials.type, "SLACK")
                    )
                );

            if (existing.length > 0) {
                await db
                    .update(credentials)
                    .set({ data: input.credentials, isActive: true, updatedAt: new Date() })
                    .where(eq(credentials.id, existing[0].id));
            } else {
                await db.insert(credentials).values({
                    userId,
                    type: "SLACK",
                    name: "Slack Bot Credentials",
                    data: input.credentials,
                    isActive: true,
                });
            }

            return { success: true };
        }),

    // Discord Credentials
    getDiscordCredentials: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
        if (!userId) throw new Error("Unauthorized");

        const result = await db
            .select()
            .from(credentials)
            .where(
                and(
                    eq(credentials.userId, userId),
                    eq(credentials.type, "DISCORD"),
                    eq(credentials.isActive, true)
                )
            )
            .limit(1);

        if (result.length === 0) return null;
        const creds = result[0];
        return typeof creds.data === 'string' ? JSON.parse(creds.data) : creds.data;
    }),

    saveDiscordCredentials: protectedProcedure
        .input(z.object({ credentials: z.object({ webhookUrl: z.string().url() }) }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
            if (!userId) throw new Error("Unauthorized");

            const existing = await db
                .select()
                .from(credentials)
                .where(
                    and(
                        eq(credentials.userId, userId),
                        eq(credentials.type, "DISCORD")
                    )
                );

            if (existing.length > 0) {
                await db
                    .update(credentials)
                    .set({ data: input.credentials, isActive: true, updatedAt: new Date() })
                    .where(eq(credentials.id, existing[0].id));
            } else {
                await db.insert(credentials).values({
                    userId,
                    type: "DISCORD",
                    name: "Discord Webhook Credentials",
                    data: input.credentials,
                    isActive: true,
                });
            }

            return { success: true };
        }),

    // Delete credential
    deleteCredential: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user?.user?.id ?? ctx.user?.session?.userId;
            if (!userId) throw new Error("Unauthorized");

            // Verify the credential belongs to the user before deleting
            const credential = await db
                .select()
                .from(credentials)
                .where(
                    and(
                        eq(credentials.id, input.id),
                        eq(credentials.userId, userId)
                    )
                )
                .limit(1);

            if (credential.length === 0) {
                throw new Error("Credential not found or unauthorized");
            }

            // Delete the credential
            await db
                .delete(credentials)
                .where(eq(credentials.id, input.id));

            return {
                success: true,
                message: "Credential deleted successfully",
            };
        }),
});
