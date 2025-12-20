'use client';

import { useState, useEffect } from 'react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';

interface EmailConfig {
    to: string;
    subject: string;
    body?: string;
    cc?: string;
    bcc?: string;
}

interface SMTPConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromEmail: string;
    fromName: string;
}

interface EmailViewProps {
    initialData?: Partial<EmailConfig>;
    onSave?: (config: EmailConfig & { smtp?: SMTPConfig }) => void;
    nodeData?: any;
}

interface ValidationErrors {
    to?: string;
    subject?: string;
    host?: string;
    port?: string;
    user?: string;
    password?: string;
    fromEmail?: string;
}

export const EmailView: React.FC<EmailViewProps> = ({ initialData = {}, onSave }) => {
    const trpc = useTRPC();

    const [emailConfig, setEmailConfig] = useState<EmailConfig>({
        to: initialData.to || '',
        subject: initialData.subject || '',
        body: initialData.body || '',
        cc: initialData.cc || '',
        bcc: initialData.bcc || ''
    });

    const [smtpConfig, setSMTPConfig] = useState<SMTPConfig>({
        host: '',
        port: 587,
        secure: false,
        user: '',
        password: '',
        fromEmail: '',
        fromName: ''
    });

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [showSMTPFields, setShowSMTPFields] = useState(false);
    const [credentialsSaved, setCredentialsSaved] = useState(false);

    // Fetch existing credentials
    const { data: existingCredentials, isLoading } = useQuery(
        trpc.credentials.getEmailCredentials.queryOptions()
    );
    const saveCredentialsMutation = useMutation(
        trpc.credentials.saveEmailCredentials.mutationOptions()
    );

    // Load credentials when available
    useEffect(() => {
        if (existingCredentials?.data) {
            const creds = existingCredentials.data;
            setSMTPConfig({
                host: creds.host || '',
                port: creds.port || 587,
                secure: creds.secure ?? false,
                user: creds.user || '',
                password: creds.password || '',
                fromEmail: creds.fromEmail || '',
                fromName: creds.fromName || ''
            });
            setCredentialsSaved(true);
        }
    }, [existingCredentials]);

    // Update email config from initialData
    useEffect(() => {
        setEmailConfig({
            to: initialData.to || '',
            subject: initialData.subject || '',
            body: initialData.body || '',
            cc: initialData.cc || '',
            bcc: initialData.bcc || ''
        });
    }, [initialData]);

    const updateEmailConfig = (field: keyof EmailConfig, value: string) => {
        setEmailConfig(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field as keyof ValidationErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const updateSMTPConfig = (field: keyof SMTPConfig, value: string | number | boolean) => {
        setSMTPConfig(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field as keyof ValidationErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateFields = (): boolean => {
        const newErrors: ValidationErrors = {};

        // Validate email fields - support comma-separated emails
        if (!emailConfig.to.trim()) {
            newErrors.to = 'Recipient email is required';
        } else {
            // Validate each email in comma-separated list
            const emails = emailConfig.to.split(',').map(e => e.trim());
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmails = emails.filter(email => !emailRegex.test(email));
            if (invalidEmails.length > 0) {
                newErrors.to = `Invalid email address${invalidEmails.length > 1 ? 'es' : ''}: ${invalidEmails.join(', ')}`;
            }
        }


        // Validate SMTP fields
        if (!smtpConfig.host.trim()) {
            newErrors.host = 'SMTP host is required';
        }

        if (!smtpConfig.port || smtpConfig.port <= 0) {
            newErrors.port = 'Valid SMTP port is required';
        }

        if (!smtpConfig.user.trim()) {
            newErrors.user = 'SMTP username is required';
        }

        if (!smtpConfig.password.trim()) {
            newErrors.password = 'SMTP password is required';
        }

        if (!smtpConfig.fromEmail.trim()) {
            newErrors.fromEmail = 'From email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpConfig.fromEmail)) {
            newErrors.fromEmail = 'Invalid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveCredentials = async () => {
        // Validate only SMTP fields
        const smtpErrors: ValidationErrors = {};

        if (!smtpConfig.host.trim()) smtpErrors.host = 'SMTP host is required';
        if (!smtpConfig.port || smtpConfig.port <= 0) smtpErrors.port = 'Valid SMTP port is required';
        if (!smtpConfig.user.trim()) smtpErrors.user = 'SMTP username is required';
        if (!smtpConfig.password.trim()) smtpErrors.password = 'SMTP password is required';
        if (!smtpConfig.fromEmail.trim()) {
            smtpErrors.fromEmail = 'From email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpConfig.fromEmail)) {
            smtpErrors.fromEmail = 'Invalid email address';
        }

        if (Object.keys(smtpErrors).length > 0) {
            setErrors(smtpErrors);
            return;
        }

        try {
            await saveCredentialsMutation.mutateAsync(smtpConfig);
            setCredentialsSaved(true);
            setShowSMTPFields(false);
            alert('SMTP credentials saved successfully!');
        } catch (error) {
            alert('Failed to save credentials. Please try again.');
        }
    };

    const handleSave = () => {
        if (!validateFields()) {
            return;
        }

        if (onSave) {
            onSave({
                ...emailConfig,
                smtp: smtpConfig
            });
        }
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
                <div className="text-center py-8">Loading credentials...</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Email Configuration</h1>
                <p className="text-xs sm:text-sm text-gray-600">Configure email settings and SMTP credentials</p>
            </div>

            <div className="space-y-6">
                {/* SMTP Credentials Section */}
                <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            SMTP Credentials
                            {credentialsSaved && (
                                <span className="ml-2 text-sm text-green-600">✓ Saved</span>
                            )}
                        </h2>
                        <button
                            onClick={() => setShowSMTPFields(!showSMTPFields)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                        >
                            {showSMTPFields ? 'Hide' : credentialsSaved ? 'Edit' : 'Show'}
                        </button>
                    </div>

                    {showSMTPFields && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        From Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={smtpConfig.fromEmail}
                                        onChange={(e) => updateSMTPConfig('fromEmail', e.target.value)}
                                        placeholder="sender@example.com"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.fromEmail ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.fromEmail && (
                                        <p className="mt-1 text-sm text-red-600">{errors.fromEmail}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        From Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={smtpConfig.fromName}
                                        onChange={(e) => updateSMTPConfig('fromName', e.target.value)}
                                        placeholder="Your Name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        SMTP Host *
                                    </label>
                                    <input
                                        type="text"
                                        value={smtpConfig.host}
                                        onChange={(e) => updateSMTPConfig('host', e.target.value)}
                                        placeholder="smtp.gmail.com"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.host ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.host && (
                                        <p className="mt-1 text-sm text-red-600">{errors.host}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        SMTP Port *
                                    </label>
                                    <input
                                        type="number"
                                        value={smtpConfig.port}
                                        onChange={(e) => updateSMTPConfig('port', parseInt(e.target.value))}
                                        placeholder="587"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.port ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.port && (
                                        <p className="mt-1 text-sm text-red-600">{errors.port}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        SMTP Username *
                                    </label>
                                    <input
                                        type="text"
                                        value={smtpConfig.user}
                                        onChange={(e) => updateSMTPConfig('user', e.target.value)}
                                        placeholder="username"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.user ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.user && (
                                        <p className="mt-1 text-sm text-red-600">{errors.user}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        SMTP Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={smtpConfig.password}
                                        onChange={(e) => updateSMTPConfig('password', e.target.value)}
                                        placeholder="••••••••"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.password ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="secure"
                                    checked={smtpConfig.secure}
                                    onChange={(e) => updateSMTPConfig('secure', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="secure" className="text-sm text-gray-700">
                                    Use TLS/SSL (recommended for port 465)
                                </label>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleSaveCredentials}
                                    disabled={saveCredentialsMutation.isPending}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                                >
                                    {saveCredentialsMutation.isPending ? 'Saving...' : 'Save SMTP Credentials'}
                                </button>
                            </div>
                        </div>
                    )}

                    {!showSMTPFields && credentialsSaved && (
                        <p className="text-sm text-gray-600">
                            Credentials configured for: <span className="font-medium">{smtpConfig.fromEmail}</span>
                        </p>
                    )}

                    {!showSMTPFields && !credentialsSaved && (
                        <p className="text-sm text-amber-600">
                            ⚠ SMTP credentials not configured. Please add credentials to send emails.
                        </p>
                    )}
                </div>

                {/* Email Content Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Email Content</h2>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            💡 You can use <code>{'{{variable}}'}</code> to insert data from previous nodes.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            To * <span className="text-xs text-gray-500 font-normal">(comma-separated for multiple)</span>
                        </label>
                        <input
                            type="text"
                            value={emailConfig.to}
                            onChange={(e) => updateEmailConfig('to', e.target.value)}
                            placeholder="user@example.com, {{user.email}}"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.to ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.to && (
                            <p className="mt-1 text-sm text-red-600">{errors.to}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject *
                        </label>
                        <input
                            type="text"
                            value={emailConfig.subject}
                            onChange={(e) => updateEmailConfig('subject', e.target.value)}
                            placeholder="Subject: {{issue.title}}"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${errors.subject ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.subject && (
                            <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message / Body
                        </label>
                        <textarea
                            value={emailConfig.body}
                            onChange={(e) => updateEmailConfig('body', e.target.value)}
                            placeholder="Hello {{user.name}},\n\nHere is the update you requested..."
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base font-mono"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Leave empty to send the entire input data as the email body.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            CC <span className="text-xs text-gray-500 font-normal">(comma-separated)</span>
                        </label>
                        <input
                            type="text"
                            value={emailConfig.cc}
                            onChange={(e) => updateEmailConfig('cc', e.target.value)}
                            placeholder="manager@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            BCC <span className="text-xs text-gray-500 font-normal">(comma-separated)</span>
                        </label>
                        <input
                            type="text"
                            value={emailConfig.bcc}
                            onChange={(e) => updateEmailConfig('bcc', e.target.value)}
                            placeholder="archive@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t mt-6">
                <button
                    onClick={handleSave}
                    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                    Save Configuration
                </button>
            </div>
        </div>
    );
};
