import * as cron from 'node-cron';
import { db } from '@/db';
import { buildNodes, workflows } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getWorkflowExecutionService } from './Workflowexecution';

interface ScheduleConfig {
    scheduleType: 'interval' | 'cron' | 'daily' | 'weekly';
    interval?: number;
    cronExpression?: string;
    timezone?: string;
    dailyTime?: string;
    weeklyDay?: string;
    weeklyTime?: string;
}

export class SchedulerService {
    private static instance: SchedulerService | null = null;
    private schedulers: Map<string, cron.ScheduledTask> = new Map();

    private constructor() {
        // Initialize schedulers for all RUNNING workflows on startup
        this.initializeAllSchedulers();
    }

    static getInstance(): SchedulerService {
        if (!SchedulerService.instance) {
            SchedulerService.instance = new SchedulerService();
        }
        return SchedulerService.instance;
    }

    private async initializeAllSchedulers() {
        try {
            const runningWorkflows = await db
                .select()
                .from(workflows)
                .where(eq(workflows.flowStatus, 'RUNNING'));

            console.log(`🕐 Initializing schedulers for ${runningWorkflows.length} running workflows...`);

            for (const workflow of runningWorkflows) {
                await this.startScheduler(workflow.id, workflow.userId);
            }

            console.log('✅ All schedulers initialized');
        } catch (error: any) {
            console.error('❌ Error initializing schedulers:', error.message);
        }
    }

    async startScheduler(workflowId: string, userId: string) {
        // Stop existing scheduler if any
        this.stopScheduler(workflowId);

        try {
            // Get the first SCHEDULE node for this workflow
            const scheduleNodes = await db
                .select()
                .from(buildNodes)
                .where(
                    and(
                        eq(buildNodes.workflowId, workflowId),
                        eq(buildNodes.types, 'SCHEDULE')
                    )
                )
                .limit(1);

            if (!scheduleNodes.length) {
                console.log(`⏭️  No SCHEDULE node found for workflow ${workflowId}`);
                return;
            }

            const scheduleNode = scheduleNodes[0];
            const config = typeof scheduleNode.data === 'string'
                ? JSON.parse(scheduleNode.data)
                : scheduleNode.data;

            // Convert schedule config to cron expression
            const cronExpression = this.getCronExpression(config);

            if (!cronExpression) {
                console.error(`❌ Invalid schedule configuration for workflow ${workflowId}`);
                return;
            }

            console.log(`🕐 Starting scheduler for workflow ${workflowId} with cron: ${cronExpression}`);

            // Create cron job
            const task = cron.schedule(cronExpression, async () => {
                try {
                    console.log(`\n⏰ Scheduler triggered for workflow: ${workflowId}`);

                    const workflowService = getWorkflowExecutionService();
                    await workflowService.triggerWorkflow(
                        workflowId,
                        userId,
                        {
                            source: 'scheduler',
                            scheduledAt: new Date().toISOString(),
                            scheduleType: config.scheduleType
                        },
                        'production' // Scheduled executions run in production mode
                    );

                    console.log(`✅ Scheduled execution completed for workflow: ${workflowId}\n`);
                } catch (error: any) {
                    console.error(`❌ Scheduled execution failed for workflow ${workflowId}:`, error.message);
                }
            }, {
                timezone: config.timezone || 'UTC'
            });

            // Store the task
            this.schedulers.set(workflowId, task);
            console.log(`✅ Scheduler started for workflow: ${workflowId}`);

        } catch (error: any) {
            console.error(`❌ Failed to start scheduler for workflow ${workflowId}:`, error.message);
        }
    }

    stopScheduler(workflowId: string) {
        const task = this.schedulers.get(workflowId);

        if (task) {
            task.stop();
            this.schedulers.delete(workflowId);
            console.log(`🛑 Scheduler stopped for workflow: ${workflowId}`);
        }
    }

    private getCronExpression(config: ScheduleConfig): string | null {
        switch (config.scheduleType) {
            case 'interval':
                // Convert minutes to cron expression
                const minutes = config.interval || 60;
                return `*/${minutes} * * * *`;

            case 'cron':
                return config.cronExpression || null;

            case 'daily':
                // Parse time (HH:MM format)
                const [hour, minute] = (config.dailyTime || '09:00').split(':');
                return `${minute} ${hour} * * *`;

            case 'weekly':
                // Parse day and time
                const weekDays: { [key: string]: number } = {
                    'sunday': 0,
                    'monday': 1,
                    'tuesday': 2,
                    'wednesday': 3,
                    'thursday': 4,
                    'friday': 5,
                    'saturday': 6
                };
                const dayNum = weekDays[config.weeklyDay || 'monday'];
                const [wHour, wMinute] = (config.weeklyTime || '09:00').split(':');
                return `${wMinute} ${wHour} * * ${dayNum}`;

            default:
                return null;
        }
    }

    cleanup() {
        // Stop all schedulers
        for (const [workflowId, task] of this.schedulers.entries()) {
            task.stop();
            console.log(`Stopped scheduler for workflow: ${workflowId}`);
        }
        this.schedulers.clear();
    }
}

export function getSchedulerService(): SchedulerService {
    return SchedulerService.getInstance();
}
