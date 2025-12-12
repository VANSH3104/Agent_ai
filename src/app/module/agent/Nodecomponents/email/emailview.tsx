import { useState, useEffect } from 'react';

interface EmailConfig {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
}

interface EmailViewProps {
    initialData?: Partial<EmailConfig>;
    onSave?: (config: EmailConfig) => void;
    nodeData?: any; // For consistency with other components
}

export const EmailView: React.FC<EmailViewProps> = ({ initialData = {}, onSave }) => {
    const [emailConfig, setEmailConfig] = useState<EmailConfig>({
        to: initialData.to || '',
        subject: initialData.subject || '',
        body: initialData.body || '',
        cc: initialData.cc || '',
        bcc: initialData.bcc || ''
    });

    // Update effect to handle initialData changes (node switching)
    useEffect(() => {
        setEmailConfig({
            to: initialData.to || '',
            subject: initialData.subject || '',
            body: initialData.body || '',
            cc: initialData.cc || '',
            bcc: initialData.bcc || ''
        });
    }, [initialData]);

    const updateConfig = (field: keyof EmailConfig, value: string) => {
        setEmailConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (onSave) {
            onSave(emailConfig);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Email Configuration</h1>
                <p className="text-xs sm:text-sm text-gray-600">Configure email settings</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        To *
                    </label>
                    <input
                        type="email"
                        value={emailConfig.to}
                        onChange={(e) => updateConfig('to', e.target.value)}
                        placeholder="recipient@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                    </label>
                    <input
                        type="text"
                        value={emailConfig.subject}
                        onChange={(e) => updateConfig('subject', e.target.value)}
                        placeholder="Email Subject"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        CC
                    </label>
                    <input
                        type="email"
                        value={emailConfig.cc}
                        onChange={(e) => updateConfig('cc', e.target.value)}
                        placeholder="cc@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        BCC
                    </label>
                    <input
                        type="email"
                        value={emailConfig.bcc}
                        onChange={(e) => updateConfig('bcc', e.target.value)}
                        placeholder="bcc@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Body *
                    </label>
                    <textarea
                        value={emailConfig.body}
                        onChange={(e) => updateConfig('body', e.target.value)}
                        placeholder="Email content..."
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base resize-y"
                    />
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
