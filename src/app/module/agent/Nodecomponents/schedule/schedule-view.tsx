'use client';

import { useState, useEffect } from 'react';
import { Clock, Copy } from 'lucide-react';

interface ScheduleConfig {
    scheduleType: 'interval' | 'cron' | 'daily' | 'weekly';
    interval?: number;
    cronExpression?: string;
    timezone?: string;
    dailyTime?: string;
    weeklyDay?: string;
    weeklyTime?: string;
}

interface ScheduleViewProps {
    initialData?: Partial<ScheduleConfig>;
    onSave?: (config: ScheduleConfig) => void;
    nodeData?: any;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ initialData = {}, onSave }) => {
    const [config, setConfig] = useState<ScheduleConfig>({
        scheduleType: initialData.scheduleType || 'interval',
        interval: initialData.interval || 60,
        cronExpression: initialData.cronExpression || '0 0 * * *',
        timezone: initialData.timezone || 'UTC',
        dailyTime: initialData.dailyTime || '09:00',
        weeklyDay: initialData.weeklyDay || 'monday',
        weeklyTime: initialData.weeklyTime || '09:00',
    });

    useEffect(() => {
        setConfig({
            scheduleType: initialData.scheduleType || 'interval',
            interval: initialData.interval || 60,
            cronExpression: initialData.cronExpression || '0 0 * * *',
            timezone: initialData.timezone || 'UTC',
            dailyTime: initialData.dailyTime || '09:00',
            weeklyDay: initialData.weeklyDay || 'monday',
            weeklyTime: initialData.weeklyTime || '09:00',
        });
    }, [initialData]);

    const updateConfig = (field: keyof ScheduleConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (onSave) {
            onSave(config);
        }
    };

    const commonCronExamples = [
        { label: 'Every minute', value: '* * * * *' },
        { label: 'Every hour', value: '0 * * * *' },
        { label: 'Every day at midnight', value: '0 0 * * *' },
        { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
        { label: 'Every 1st of month', value: '0 0 1 * *' },
    ];

    const timezones = [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Kolkata',
        'Australia/Sydney',
    ];

    const weekDays = [
        { label: 'Monday', value: 'monday' },
        { label: 'Tuesday', value: 'tuesday' },
        { label: 'Wednesday', value: 'wednesday' },
        { label: 'Thursday', value: 'thursday' },
        { label: 'Friday', value: 'friday' },
        { label: 'Saturday', value: 'saturday' },
        { label: 'Sunday', value: 'sunday' },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white">
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock size={24} />
                    Schedule Configuration
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">Configure when this workflow should run automatically</p>
            </div>

            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                        💡 <strong>Trigger:</strong> This node will automatically execute the workflow based on the schedule you configure below.
                    </p>
                </div>

                {/* Schedule Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule Type *
                    </label>
                    <select
                        value={config.scheduleType}
                        onChange={(e) => updateConfig('scheduleType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                        <option value="interval">Interval (Run every X minutes)</option>
                        <option value="cron">Cron Expression (Advanced)</option>
                        <option value="daily">Daily (Run once per day)</option>
                        <option value="weekly">Weekly (Run once per week)</option>
                    </select>
                </div>

                {/* Interval Configuration */}
                {config.scheduleType === 'interval' && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Interval Settings</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Run every (minutes) *
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={config.interval}
                                onChange={(e) => updateConfig('interval', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Workflow will run every {config.interval} minute{config.interval !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                )}

                {/* Cron Configuration */}
                {config.scheduleType === 'cron' && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Cron Expression</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cron Expression *
                            </label>
                            <input
                                type="text"
                                value={config.cronExpression}
                                onChange={(e) => updateConfig('cronExpression', e.target.value)}
                                placeholder="0 0 * * *"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Format: minute hour day month weekday
                            </p>
                        </div>

                        <div className="mt-4">
                            <p className="text-xs font-medium text-gray-700 mb-2">Common Examples:</p>
                            <div className="space-y-1">
                                {commonCronExamples.map((example) => (
                                    <button
                                        key={example.value}
                                        onClick={() => updateConfig('cronExpression', example.value)}
                                        className="flex items-center justify-between w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                    >
                                        <span className="text-gray-700">{example.label}</span>
                                        <code className="text-blue-600 font-mono">{example.value}</code>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Daily Configuration */}
                {config.scheduleType === 'daily' && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Daily Settings</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time (24-hour format) *
                            </label>
                            <input
                                type="time"
                                value={config.dailyTime}
                                onChange={(e) => updateConfig('dailyTime', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Workflow will run every day at {config.dailyTime}
                            </p>
                        </div>
                    </div>
                )}

                {/* Weekly Configuration */}
                {config.scheduleType === 'weekly' && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Weekly Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Day of Week *
                                </label>
                                <select
                                    value={config.weeklyDay}
                                    onChange={(e) => updateConfig('weeklyDay', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    {weekDays.map(day => (
                                        <option key={day.value} value={day.value}>{day.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Time (24-hour format) *
                                </label>
                                <input
                                    type="time"
                                    value={config.weeklyTime}
                                    onChange={(e) => updateConfig('weeklyTime', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Workflow will run every {weekDays.find(d => d.value === config.weeklyDay)?.label} at {config.weeklyTime}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Timezone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                    </label>
                    <select
                        value={config.timezone}
                        onChange={(e) => updateConfig('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                        {timezones.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        All times will be interpreted in this timezone
                    </p>
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
