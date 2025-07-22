import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";

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
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === NODES ===
export const nodes = pgTable("nodes", {
  id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
  workflowId: text("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // e.g., webhook, httpRequest, subflow
  name: text("name").notNull(),
  position: text("position").notNull(), // JSON string: { x: 100, y: 200 }
  parameters: text("parameters").notNull(), // JSON string
  credentials: text("credentials"), // JSON string
  subWorkflowId: text("sub_workflow_id").references(() => workflows.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === CONNECTIONS ===
export const connections = pgTable("connections", {
  id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
  fromNodeId: text("from_node_id").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  toNodeId: text("to_node_id").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  outputIndex: integer("output_index").default(0),
});

// === EXECUTIONS ===
export const executions = pgTable("executions", {
  id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
  workflowId: text("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  parentExecutionId: text("parent_execution_id"),
  status: text("status").notNull(), // success, error, running
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
  data: text("data"), // JSON string of input/output
  error: text("error"),
});

// === CREDENTIALS ===
export const credentials = pgTable("credentials", {
  id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // e.g., httpBasicAuth, OAuth2
  name: text("name").notNull(),
  data: text("data").notNull(), // Encrypted JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === NODE TYPES (PLUGIN-LIKE SYSTEM) ===
export const nodeTypes = pgTable("node_types", {
  id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
  name: text("name").notNull(),
  description: text("description"),
  schema: text("schema").notNull(), // JSON definition
});

// === RELATIONS ===
export const executionsRelations = relations(executions, ({ one }) => ({
  parentExecution: one(executions, {
    fields: [executions.parentExecutionId],
    references: [executions.id],
    relationName: "parentExecution",
  }),
  workflow: one(workflows, {
    fields: [executions.workflowId],
    references: [workflows.id],
  }),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  user: one(user, {
    fields: [workflows.userId],
    references: [user.id],
  }),
  executions: many(executions),
  nodes: many(nodes, { relationName: "workflowNodes" }),
  subWorkflowNodes: many(nodes, { relationName: "subWorkflowNodes" }),
}));

export const nodesRelations = relations(nodes, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [nodes.workflowId],
    references: [workflows.id],
    relationName: "workflowNodes",
  }),
  subWorkflow: one(workflows, {
    fields: [nodes.subWorkflowId],
    references: [workflows.id],
    relationName: "subWorkflowNodes",
  }),
  connectionsFrom: many(connections, { relationName: "fromNodeConnections" }),
  connectionsTo: many(connections, { relationName: "toNodeConnections" }),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  fromNode: one(nodes, {
    fields: [connections.fromNodeId],
    references: [nodes.id],
    relationName: "fromNodeConnections",
  }),
  toNode: one(nodes, {
    fields: [connections.toNodeId],
    references: [nodes.id],
    relationName: "toNodeConnections",
  }),
}));