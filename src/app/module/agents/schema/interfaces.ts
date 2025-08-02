// schema-types.ts

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
}

export interface Account {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  idToken?: string | null;
  accessTokenExpiresAt?: Date | null;
  refreshTokenExpiresAt?: Date | null;
  scope?: string | null;
  password?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Verification {
  id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Node {
  id: string;
  workflowId: string;
  type: string;
  name: string;
  position: {
    x: string ,
    y: string,
  },
  parameters: string; // JSON string
  credentials?: string | null; // JSON string
  subWorkflowId?: string | null;
  createdAt: Date;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  outputIndex: number;
}

export interface Execution {
  id: string;
  workflowId: string;
  parentExecutionId?: string | null;
  status: "success" | "error" | "running" | string;
  startedAt: Date;
  finishedAt?: Date | null;
  data?: string | null; // JSON string
  error?: string | null;
}

export interface Credential {
  id: string;
  userId: string;
  type: string;
  name: string;
  data: string; // Encrypted JSON string
  createdAt: Date;
}

export interface NodeType {
  id: string;
  name: string;
  description?: string | null;
  schema: string; // JSON definition
}


export interface ParsedPosition {
  x: number;
  y: number;
}

export interface ParsedParameters {
  [key: string]: string;
}

export interface ParsedCredentials {
  [key: string]: string;
}

export interface NodeParsed extends Omit<Node, 'position' | 'parameters' | 'credentials'> {
  position: ParsedPosition;
  parameters: ParsedParameters;
  credentials?: ParsedCredentials | null;
}
