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

export interface CredentialData {
    EMAIL_SMTP?: EmailSMTPCredentials;
    DATABASE?: DatabaseCredentials;
    [key: string]: any;
}

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
