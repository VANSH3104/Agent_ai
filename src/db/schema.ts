import {relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, uniqueIndex, pgEnum, jsonb } from "drizzle-orm/pg-core";

import { nanoid } from "nanoid";
// Update your nodeTypesEnum to match all node types
export const nodeTypesEnum = pgEnum("node_types", [
  "INITIAL",
  "WEBHOOK",
  "MANUAL", 
  "SCHEDULE",
  "HTTP",
  "DATABASE",
  "EMAIL",
  "CODE",
  "CONDITION",
  "FILTER"
]);
// === USERS ===
export const user = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
});

// === SESSIONS ===
export const session = pgTable("session", {
  id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

// === AUTH ACCOUNTS ===
export const account = pgTable("account", {
  id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === EMAIL VERIFICATION ===
export const verification = pgTable("verification", {
  id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === WORKFLOWS ===
export const workflows = pgTable("workflows", {
  id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const buildNodes = pgTable('build_nodes', {
  id: text('id').primaryKey().$defaultFn(() => nanoid(12)),
  agentId: text('agent_id'),
  name: text('name').notNull(),
  types: nodeTypesEnum("types").notNull(),
  data: jsonb("data").default({}).notNull(),
  position: jsonb("position").$type<{ x: number; y: number }>().default({ x: 0, y: 0 }).notNull(),
  workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const nodeConnections = pgTable('node_connections', {
  id: text('id').primaryKey().$defaultFn(() => nanoid(12)),
  sourceNodeId: text('source_node_id').notNull().references(() => buildNodes.id, { onDelete: 'cascade' }),
  targetNodeId: text('target_node_id').notNull().references(() => buildNodes.id, { onDelete: 'cascade' }),
  fromOutput: text('from_output'), // assuming this is text type based on your Prisma
  toInput: text('to_input'), // assuming this is text type based on your Prisma
  type: text('type').default('buttonedge'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('node_connections_unique_idx').on(table.sourceNodeId, table.targetNodeId, table.toInput, table.fromOutput)
]);

// Define relations
export const buildNodesRelations = relations(buildNodes, ({ many, one }) => ({
  workflow: one(workflows, {
    fields: [buildNodes.workflowId],
    references: [workflows.id]
  }),
  outputConnections: many(nodeConnections, { relationName: 'sourceNode' }),
  inputConnections: many(nodeConnections, { relationName: 'targetNode' })
}));

export const nodeConnectionsRelations = relations(nodeConnections, ({ one }) => ({
  sourceNode: one(buildNodes, {
    fields: [nodeConnections.sourceNodeId],
    references: [buildNodes.id],
    relationName: 'sourceNode'
  }),
  targetNode: one(buildNodes, {
    fields: [nodeConnections.targetNodeId],
    references: [buildNodes.id],
    relationName: 'targetNode'
  })
}));

