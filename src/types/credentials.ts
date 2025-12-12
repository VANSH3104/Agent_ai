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

export interface CredentialData {
    EMAIL_SMTP?: EmailSMTPCredentials;
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
