// Type definitions for credential management

export interface EmailSMTPCredentials {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromEmail: string;
    fromName?: string;
}

export interface AICredentials {
    provider: 'openai' | 'anthropic' | 'google' | 'custom';
    apiKey: string;
    baseUrl?: string;
    model?: string;
}

export interface DatabaseCredentials {
    connectionType: 'postgres' | 'mysql' | 'mongodb' | 'sqlite';
    connectionUrl?: string; // For env variable support
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
}

export interface SlackCredentials {
    botToken: string;
    workspaceId?: string;
}

export interface DiscordCredentials {
    webhookUrl: string;
}

export type CredentialData =
    | { type: 'EMAIL_SMTP'; data: EmailSMTPCredentials }
    | { type: 'AI'; data: AICredentials }
    | { type: 'DATABASE'; data: DatabaseCredentials }
    | { type: 'SLACK'; data: SlackCredentials }
    | { type: 'DISCORD'; data: DiscordCredentials };

export interface SaveEmailCredentialsInput {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromEmail: string;
    fromName?: string;
}

export interface SaveDatabaseCredentialsInput {
    connectionType: 'postgres' | 'mysql' | 'mongodb' | 'sqlite';
    connectionUrl?: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
}
