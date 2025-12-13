import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { node, workflow } from '@/db/schema';
import { eq, and } from 'drizzle-orm';


// Dynamic webhook handler - accepts any path
export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return handleWebhookRequest(request, params, 'GET');
}

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return handleWebhookRequest(request, params, 'POST');
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return handleWebhookRequest(request, params, 'PUT');
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    return handleWebhookRequest(request, params, 'DELETE');
}

async function handleWebhookRequest(
    request: NextRequest,
    params: { path: string[] },
    method: string
) {
    try {
        // Get workflow ID from query parameters
        const { searchParams } = new URL(request.url);
        const workflowId = searchParams.get('workflowId');

        if (!workflowId) {
            return NextResponse.json(
                { error: 'Missing workflowId parameter' },
                { status: 400 }
            );
        }

        // Construct the webhook path from params
        const webhookPath = '/' + (params.path?.join('/') || '');

        // Find the webhook node for this workflow and path
        const webhookNodes = await db
            .select()
            .from(node)
            .where(
                and(
                    eq(node.workflowId, workflowId),
                    eq(node.type, 'WEBHOOK')
                )
            );

        // Find the matching webhook node by path and method
        const webhookNode = webhookNodes.find((node: any) => {
            const nodeData = typeof node.data === 'string' ? JSON.parse(node.data) : node.data;
            return nodeData?.path === webhookPath && nodeData?.method === method;
        });

        if (!webhookNode) {
            return NextResponse.json(
                { error: 'Webhook not found for this path and method' },
                { status: 404 }
            );
        }

        // Parse webhook configuration
        const webhookConfig = typeof webhookNode.data === 'string'
            ? JSON.parse(webhookNode.data)
            : webhookNode.data;

        // Authenticate the request
        const authResult = await authenticateRequest(request, webhookConfig);
        if (!authResult.success) {
            return NextResponse.json(
                { error: authResult.error },
                {
                    status: 401,
                    headers: authResult.headers
                }
            );
        }

        // Extract request data
        let body = null;
        try {
            if (method !== 'GET') {
                body = await request.json();
            }
        } catch (e) {
            // Body might not be JSON, that's okay
        }

        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const queryParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            if (key !== 'workflowId') {
                queryParams[key] = value;
            }
        });

        // Prepare webhook data to pass to workflow
        const webhookData = {
            body,
            headers,
            query: queryParams,
            method,
            path: webhookPath,
            timestamp: new Date().toISOString(),
        };

        // TODO: Trigger workflow execution with webhookData
        // This would integrate with your existing workflow execution system
        // For now, we'll return a success response

        console.log('Webhook triggered:', {
            workflowId,
            path: webhookPath,
            method,
            data: webhookData
        });

        // Return response based on configuration
        const response = await formatWebhookResponse(
            webhookConfig.responseMode || 'custom',
            webhookConfig.customResponse,
            webhookData
        );

        return NextResponse.json(response, { status: 200 });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}

async function authenticateRequest(
    request: NextRequest,
    config: any
): Promise<{ success: boolean; error?: string; headers?: Record<string, string> }> {
    const authType = config.authentication || 'none';

    // No authentication required
    if (authType === 'none') {
        return { success: true };
    }

    // API Key authentication
    if (authType === 'apikey') {
        const apiKey = request.headers.get('x-api-key');
        if (!apiKey || apiKey !== config.apiKey) {
            return {
                success: false,
                error: 'Invalid or missing API key',
            };
        }
        return { success: true };
    }

    // Basic Auth authentication
    if (authType === 'basic') {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return {
                success: false,
                error: 'Missing authorization header',
                headers: { 'WWW-Authenticate': 'Basic realm="Webhook"' },
            };
        }

        try {
            const base64Credentials = authHeader.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
            const [username, password] = credentials.split(':');

            if (username !== config.username || password !== config.password) {
                return {
                    success: false,
                    error: 'Invalid credentials',
                    headers: { 'WWW-Authenticate': 'Basic realm="Webhook"' },
                };
            }

            return { success: true };
        } catch (e) {
            return {
                success: false,
                error: 'Invalid authorization format',
                headers: { 'WWW-Authenticate': 'Basic realm="Webhook"' },
            };
        }
    }

    return { success: false, error: 'Unknown authentication type' };
}

async function formatWebhookResponse(
    responseMode: string,
    customResponse: string | undefined,
    webhookData: any
) {
    switch (responseMode) {
        case 'custom':
            if (customResponse) {
                try {
                    return JSON.parse(customResponse);
                } catch (e) {
                    return { status: 'success', message: customResponse };
                }
            }
            return { status: 'success', message: 'Webhook received' };

        case 'lastNode':
            // TODO: Get the last node output from workflow execution
            return {
                status: 'success',
                message: 'Workflow triggered',
                webhookData
            };

        case 'firstSucceeding':
            // TODO: Get the first succeeding node output
            return {
                status: 'success',
                message: 'Workflow triggered',
                webhookData
            };

        default:
            return {
                status: 'success',
                message: 'Webhook received',
                data: webhookData
            };
    }
}
