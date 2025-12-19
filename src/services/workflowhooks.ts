import { KafkaService } from "./kafkaservice";
import nodemailer from "nodemailer";

export interface HookContext {
  workflowId: string;
  executionId: string;
  userId: string;
  mode: 'production' | 'test';
  triggerData: any;
}

export interface NodeContext extends HookContext {
  nodeId: string;
  nodeType: string;
  nodeData: any;
}

interface FilterCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'startsWith' | 'endsWith' | 'typeIs';
  value: string;
}

export interface HookResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export class WorkflowHooksService {
  private kafkaService: KafkaService;

  constructor(kafkaService: KafkaService) {
    this.kafkaService = kafkaService;
  }

  /**
   * Execute node directly without Kafka messaging
   * This is the actual node execution logic
   */
  async executeNode(
    context: NodeContext,
    inputData: any,
    skipKafka: boolean = false
  ): Promise<HookResult> {
    try {
      console.log(`   🔧 Executing ${context.nodeType} node...`);

      // Execute based on node type
      let result: any;

      switch (context.nodeType) {
        case 'MANUAL':
          result = await this.executeManualTrigger(context, inputData);
          break;

        case 'HTTP':
          result = await this.executeHttpRequest(context, inputData);
          break;

        case 'EMAIL':
          result = await this.executeSendEmail(context, inputData);
          break;

        case 'AI':
          result = await this.executeAI(context, inputData);
          break;

        case 'CODE':
          result = await this.executeCode(context, inputData);
          break;

        case 'CONDITION':
          result = await this.executeCondition(context, inputData);
          break;

        case 'FILTER':
          result = await this.executeFilter(context, inputData);
          break;

        case 'DATABASE':
          result = await this.executeDatabaseQuery(context, inputData);
          break;

        case 'WEBHOOK':
          result = await this.executeWebhook(context, inputData);
          break;

        case 'SCHEDULE':
          result = await this.executeSchedule(context, inputData);
          break;

        case 'INITIAL':
          result = await this.executeInitial(context, inputData);
          break;

        case 'GOOGLESHEET':
          result = await this.executeGoogleSheet(context, inputData);
          break;

        case 'SLACK':
          result = await this.executeSlack(context, inputData);
          break;

        case 'DISCORD':
          result = await this.executeDiscord(context, inputData);
          break;

        default:
          throw new Error(`Unknown node type: ${context.nodeType}`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          nodeType: context.nodeType,
          executionTime: new Date().toISOString()
        }
      };

    } catch (error: any) {
      console.error(`   ❌ Node execution error:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============ NODE TYPE IMPLEMENTATIONS ============

  private async executeManualTrigger(context: NodeContext, inputData: any): Promise<any> {
    // Manual trigger just passes through the input data
    return {
      ...inputData,
      triggeredAt: new Date().toISOString(),
      triggerType: 'manual'
    };
  }


  private async executeHttpRequest(context: NodeContext, inputData: any): Promise<any> {
    const {
      url,
      method = 'GET',
      headers = [],
      body,
      queryParams = [],
      timeout = 30000,
      authentication = 'none',
      authConfig = {}
    } = context.nodeData;

    if (!url) {
      throw new Error('HTTP node: URL is required');
    }

    console.log(`🌐 HTTP Request: ${method} ${url}`);
    console.log(`   Authentication: ${authentication}`);

    // Interpolate URL with variables from input
    let finalUrl = this.interpolateVariables(url, inputData);

    // Build query string with interpolation
    if (queryParams.length > 0) {
      const params = new URLSearchParams();
      queryParams.forEach((param: any) => {
        if (param.key && param.value) {
          const interpolatedKey = this.interpolateVariables(param.key, inputData);
          const interpolatedValue = this.interpolateVariables(param.value, inputData);
          params.append(interpolatedKey, interpolatedValue);
        }
      });
      const queryString = params.toString();
      if (queryString) {
        finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    console.log(`   Final URL: ${finalUrl}`);

    // Build headers with interpolation
    const fetchHeaders: Record<string, string> = {};
    headers.forEach((header: any) => {
      if (header.key && header.value) {
        const interpolatedKey = this.interpolateVariables(header.key, inputData);
        const interpolatedValue = this.interpolateVariables(header.value, inputData);
        fetchHeaders[interpolatedKey] = interpolatedValue;
      }
    });

    // Handle Authentication
    switch (authentication) {
      case 'basic':
        if (authConfig.username && authConfig.password) {
          const credentials = btoa(`${authConfig.username}:${authConfig.password}`);
          fetchHeaders['Authorization'] = `Basic ${credentials}`;
          console.log(`   ✔ Basic Auth configured`);
        }
        break;

      case 'bearer':
        if (authConfig.token) {
          const token = this.interpolateVariables(authConfig.token, inputData);

          // Check if token already has a prefix (Bearer/Token/etc)
          const tokenLower = token.toLowerCase().trim();
          if (tokenLower.startsWith('bearer ') || tokenLower.startsWith('token ')) {
            // Use token as-is if it already has a prefix
            fetchHeaders['Authorization'] = token;
            console.log(`   ✔ Auth token configured with existing prefix`);
          } else {
            // Default to Bearer prefix
            fetchHeaders['Authorization'] = `Bearer ${token}`;
            console.log(`   ✔ Bearer token configured`);
          }
        }
        break;

      case 'apiKey':
        if (authConfig.keyName && authConfig.keyValue) {
          const interpolatedKeyName = this.interpolateVariables(authConfig.keyName, inputData);
          const interpolatedKeyValue = this.interpolateVariables(authConfig.keyValue, inputData);

          if (authConfig.location === 'header') {
            fetchHeaders[interpolatedKeyName] = interpolatedKeyValue;
            console.log(`   ✔ API Key configured in header: ${interpolatedKeyName}`);
          } else if (authConfig.location === 'query') {
            const separator = finalUrl.includes('?') ? '&' : '?';
            finalUrl = `${finalUrl}${separator}${encodeURIComponent(interpolatedKeyName)}=${encodeURIComponent(interpolatedKeyValue)}`;
            console.log(`   ✔ API Key configured in query parameter: ${interpolatedKeyName}`);
          }
        }
        break;

      case 'none':
      default:
        // No authentication
        break;
    }

    // Prepare request body with interpolation
    let requestBody: string | undefined = undefined;

    if (method !== 'GET' && method !== 'HEAD') {
      if (body?.content) {
        // Interpolate body content
        requestBody = this.interpolateVariables(body.content, inputData);

        // Set appropriate Content-Type if not already set
        if (!fetchHeaders['Content-Type'] && !fetchHeaders['content-type']) {
          if (body.type === 'json') {
            fetchHeaders['Content-Type'] = 'application/json';

            // Validate JSON if type is json
            try {
              JSON.parse(requestBody);
            } catch (e) {
              console.warn(`   ⚠️ Body type is JSON but content is not valid JSON`);
            }
          } else if (body.type === 'form') {
            fetchHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
          } else if (body.type === 'raw') {
            fetchHeaders['Content-Type'] = 'text/plain';
          }
        }

        console.log(`   Body Type: ${body.type}`);
        console.log(`   Body Preview: ${requestBody.substring(0, 100)}${requestBody.length > 100 ? '...' : ''}`);
      } else if (inputData && typeof inputData === 'object' && Object.keys(inputData).length > 0) {
        // Use input data as body if no body is configured
        requestBody = JSON.stringify(inputData);
        if (!fetchHeaders['Content-Type'] && !fetchHeaders['content-type']) {
          fetchHeaders['Content-Type'] = 'application/json';
        }
        console.log(`   Using input data as request body`);
      }
    }

    console.log(`   Headers:`, Object.keys(fetchHeaders).join(', '));

    // Make request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`   📤 Sending ${method} request...`);

      const response = await fetch(finalUrl, {
        method,
        headers: fetchHeaders,
        body: requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`   ✔ Response received: ${response.status} ${response.statusText}`);

      // Try to parse response as JSON, fall back to text
      let responseData: any;
      const contentType = response.headers.get('content-type') || '';

      try {
        if (contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      } catch (parseError) {
        console.warn(`   ⚠️ Failed to parse response, using text`);
        responseData = await response.text();
      }

      return {
        statusCode: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData,
        data: responseData, // Alias for compatibility
        success: response.ok,
        url: finalUrl,
        method,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      clearTimeout(timeoutId);

      console.error(`   ❌ HTTP request failed:`, error.message);

      if (error.name === 'AbortError') {
        throw new Error(`HTTP request timeout after ${timeout}ms`);
      }

      // Provide helpful error messages
      let errorMessage = `HTTP request failed: ${error.message}`;

      if (error.message.includes('fetch failed')) {
        errorMessage += '\n\n🌐 Connection failed. Check:\n' +
          '1. URL is correct and accessible\n' +
          '2. Network connectivity\n' +
          '3. Server is running and accepting connections';
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage += '\n\n🔍 DNS lookup failed. The domain could not be resolved.';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage += '\n\n🚫 Connection refused. The server is not accepting connections on this port.';
      } else if (error.message.includes('certificate')) {
        errorMessage += '\n\n🔒 SSL/TLS certificate error. The server certificate may be invalid.';
      }

      throw new Error(errorMessage);
    }
  }

  private async executeSendEmail(context: NodeContext, inputData: any): Promise<any> {
    // Get configured values from nodeData, but allow inputData to override/provide dynamic values
    const to = inputData?.to || context.nodeData.to;
    const subject = inputData?.subject || context.nodeData.subject;
    const body = inputData?.body || inputData?.message || JSON.stringify(inputData, null, 2); // Use inputData as body
    const cc = inputData?.cc || context.nodeData.cc;
    const bcc = inputData?.bcc || context.nodeData.bcc;

    // Validate required fields
    if (!to) {
      throw new Error('Email node: "to" field is required (configure in node or pass from previous node)');
    }
    if (!subject) {
      throw new Error('Email node: "subject" field is required (configure in node or pass from previous node)');
    }
    if (!body) {
      throw new Error('Email node: "body" is empty - no data received from previous node');
    }

    // Get userId from context
    const userId = context.userId;
    if (!userId) {
      throw new Error('Email node: User ID is required to fetch credentials');
    }

    console.log(`   📧 Fetching SMTP credentials for user: ${userId}`);

    // Fetch SMTP credentials from database
    const { db } = await import('@/db');
    const { credentials } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');

    const credentialResult = await db
      .select()
      .from(credentials)
      .where(
        and(
          eq(credentials.userId, userId),
          eq(credentials.type, 'EMAIL_SMTP'),
          eq(credentials.isActive, true)
        )
      )
      .limit(1);

    if (credentialResult.length === 0) {
      throw new Error(
        'Email node: No SMTP credentials configured. Please configure email credentials in the email node settings.'
      );
    }

    const smtpCreds = credentialResult[0].data as any;

    if (!smtpCreds.host || !smtpCreds.user || !smtpCreds.password || !smtpCreds.fromEmail) {
      throw new Error('Email node: SMTP credentials are incomplete');
    }

    console.log(`   📧 Creating email transporter...`);
    console.log(`   ➤ Host: ${smtpCreds.host}`);
    console.log(`   ➤ Port: ${smtpCreds.port || 587}`);
    console.log(`   ➤ Secure (TLS/SSL): ${smtpCreds.secure || false}`);
    console.log(`   ➤ From: ${smtpCreds.fromEmail}`);
    console.log(`   ➤ To: ${to}`);
    console.log(`   ➤ Subject: ${subject}`);
    console.log(`   ➤ Body preview: ${body.substring(0, 100)}...`);

    // Create transporter with detailed config
    const transporter = nodemailer.createTransport({
      host: smtpCreds.host,
      port: smtpCreds.port || 587,
      secure: smtpCreds.secure || false,
      auth: {
        user: smtpCreds.user,
        pass: smtpCreds.password,
      },
      // Add timeout and connection settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
      // Enable debug output
      debug: true,
      logger: true,
    });

    // Verify SMTP connection
    console.log(`   🔍 Verifying SMTP connection...`);
    try {
      await transporter.verify();
      console.log(`   ✔ SMTP connection verified successfully!`);
    } catch (verifyError: any) {
      console.error(`   ❌ SMTP verification failed:`, verifyError.message);
      throw new Error(`SMTP connection failed: ${verifyError.message}. Please check your SMTP credentials.`);
    }

    // Prepare email options
    const mailOptions: any = {
      from: smtpCreds.fromName
        ? `"${smtpCreds.fromName}" <${smtpCreds.fromEmail}>`
        : smtpCreds.fromEmail,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'), // Simple text to HTML conversion
    };

    // Add CC and BCC if provided
    if (cc) {
      mailOptions.cc = cc;
      console.log(`   ➤ CC: ${cc}`);
    }
    if (bcc) {
      mailOptions.bcc = bcc;
      console.log(`   ➤ BCC: ${bcc}`);
    }

    try {
      console.log(`   📤 Sending email...`);

      // Send email
      const info = await transporter.sendMail(mailOptions);

      console.log(`   ✔ Email sent successfully!`);
      console.log(`   ✔ Message ID: ${info.messageId}`);
      console.log(`   ✔ Response: ${info.response}`);
      console.log(`   ✔ Accepted: ${JSON.stringify(info.accepted)}`);
      console.log(`   ✔ Rejected: ${JSON.stringify(info.rejected)}`);

      if (info.rejected && info.rejected.length > 0) {
        console.warn(`   ⚠️ Some recipients were rejected: ${JSON.stringify(info.rejected)}`);
      }

      return {
        sent: true,
        messageId: info.messageId,
        to,
        cc: cc || null,
        bcc: bcc || null,
        subject,
        from: smtpCreds.fromEmail,
        timestamp: new Date().toISOString(),
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (error: any) {
      console.error(`   ❌ Email send failed:`, error.message);
      console.error(`   ❌ Error code:`, error.code);
      console.error(`   ❌ Error command:`, error.command);

      // Provide helpful error messages
      let errorMessage = `Failed to send email: ${error.message}`;

      if (error.code === 'EAUTH') {
        errorMessage += '\n\n🔐 Authentication failed. For Gmail:\n' +
          '1. Enable 2-Factor Authentication\n' +
          '2. Generate an App Password (Google Account → Security → App Passwords)\n' +
          '3. Use the app password instead of your regular password';
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        errorMessage += '\n\n🌐 Connection failed. Check:\n' +
          '1. SMTP host is correct\n' +
          '2. Port is correct (587 for TLS, 465 for SSL)\n' +
          '3. Firewall is not blocking SMTP';
      } else if (error.responseCode === 550) {
        errorMessage += '\n\n📧 Recipient rejected. The email address may be invalid or blocked.';
      }

      throw new Error(errorMessage);
    }
  }

  // Helper function to validate and cap max_tokens based on provider limits
  private getValidatedMaxTokens(provider: string, configuredMaxTokens: number): number {
    const limits: Record<string, number> = {
      'openai': 4096,
      'anthropic': 4096,
      'google': 8192,
      'openrouter': 4096,
    };

    const limit = limits[provider] || 4096;

    if (configuredMaxTokens > limit) {
      console.warn(`max_tokens (${configuredMaxTokens}) exceeds ${provider} limit (${limit}). Capping to ${limit}.`);
      return limit;
    }

    return configuredMaxTokens;
  }

  private stripMarkdownCodeFences(text: string): string {
    // Remove markdown code fences (```json, ```javascript, ```, etc.)
    return text
      .replace(/^```(?:json|javascript|js|typescript|ts)?\s*\n?/gm, '')
      .replace(/\n?```\s*$/gm, '')
      .trim();
  }


  private async executeAI(context: NodeContext, inputData: any): Promise<any> {
    const systemPrompt = context.nodeData.systemPrompt || '';
    const configuredPrompt = context.nodeData.userPrompt || '';
    const temperature = context.nodeData.temperature ?? 0.7;
    const configuredMaxTokens = context.nodeData.maxTokens || 1000;

    let userPrompt = '';

    if (configuredPrompt && configuredPrompt.trim()) {
      userPrompt = configuredPrompt.trim();

      if (inputData && Object.keys(inputData).length > 0) {
        const inputDataStr = typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2);
        userPrompt += '\n\n' + inputDataStr;
      }
    } else {
      if (inputData?.prompt) {
        userPrompt = inputData.prompt;
      } else if (inputData?.message) {
        userPrompt = inputData.message;
      } else if (inputData && Object.keys(inputData).length > 0) {
        userPrompt = typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2);
      }
    }

    if (!userPrompt || userPrompt.trim() === '' || userPrompt === '{}') {
      throw new Error('AI node: No prompt provided. Either configure a default prompt or pass data from a previous node.');
    }

    const userId = context.userId;
    if (!userId) {
      throw new Error('AI node: User ID is required to fetch credentials');
    }

    console.log(`Fetching AI credentials for user: ${userId}`);

    const { db } = await import('@/db');
    const { credentials } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');

    const credentialResult = await db
      .select()
      .from(credentials)
      .where(
        and(
          eq(credentials.userId, userId),
          eq(credentials.type, 'AI_API'),
          eq(credentials.isActive, true)
        )
      )
      .limit(1);

    if (credentialResult.length === 0) {
      throw new Error(
        'AI node: No AI API credentials configured. Please configure AI credentials in the node settings.'
      );
    }

    const aiCreds = credentialResult[0].data as any;

    if (!aiCreds.provider || !aiCreds.apiKey) {
      throw new Error('AI node: AI credentials are incomplete');
    }

    // Normalize provider to lowercase for case-insensitive matching
    aiCreds.provider = aiCreds.provider.trim().toLowerCase();

    if (aiCreds.provider !== 'openrouter' && !aiCreds.model) {
      throw new Error('AI node: Model is required for this provider');
    }

    const maxTokens = this.getValidatedMaxTokens(aiCreds.provider, configuredMaxTokens);

    console.log(`Using AI provider: ${aiCreds.provider}`);
    console.log(`Model: ${aiCreds.model || '(OpenRouter will use default)'}`);
    console.log(`Temperature: ${temperature}`);
    console.log(`Max Tokens: ${maxTokens}${maxTokens !== configuredMaxTokens ? ` (capped from ${configuredMaxTokens})` : ''}`);
    console.log(`System Prompt:`, systemPrompt || '(none)');
    console.log(`Configured Prompt:`, configuredPrompt || '(none)');
    console.log(`Input Data:`, inputData ? JSON.stringify(inputData).substring(0, 100) + '...' : '(none)');
    console.log(`Final User Prompt (first 200 chars):`, userPrompt.substring(0, 200) + '...');

    try {
      let response: string;

      if (aiCreds.provider === 'openai') {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
          apiKey: aiCreds.apiKey,
        });

        const messages: any[] = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: userPrompt });

        console.log(`Sending request to OpenAI...`);
        const completion = await openai.chat.completions.create({
          model: aiCreds.model || 'gpt-3.5-turbo',
          messages,
          temperature,
          max_tokens: maxTokens,
        });

        response = completion.choices[0]?.message?.content || '';
        console.log(`OpenAI response received (${completion.usage?.total_tokens} tokens)`);

      } else if (aiCreds.provider === 'anthropic') {
        const response_fetch = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': aiCreds.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: aiCreds.model || 'claude-3-haiku-20240307',
            max_tokens: maxTokens,
            temperature,
            system: systemPrompt || undefined,
            messages: [
              { role: 'user', content: userPrompt }
            ],
          }),
        });

        if (!response_fetch.ok) {
          const errorText = await response_fetch.text();
          throw new Error(`Anthropic API error: ${response_fetch.status} - ${errorText}`);
        }

        const data = await response_fetch.json();
        response = data.content[0]?.text || '';
        console.log(`Anthropic response received`);

      } else if (aiCreds.provider === 'google') {
        let google_url;
        if (aiCreds.model?.includes('gemini-2.0') || aiCreds.model?.includes('gemini-2.5')) {
          google_url = `https://generativelanguage.googleapis.com/v1beta/models/${aiCreds.model}:generateContent?key=${aiCreds.apiKey}`;
        } else {
          google_url = `https://generativelanguage.googleapis.com/v1/models/${aiCreds.model || 'gemini-pro'}:generateContent?key=${aiCreds.apiKey}`;
        }

        const prompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;

        console.log(`Sending to Google Gemini...`);
        console.log(`Endpoint: ${google_url}`);
        console.log(`Prompt preview:`, prompt.substring(0, 200));

        const response_fetch = await fetch(google_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            },
          }),
        });

        if (!response_fetch.ok) {
          const errorText = await response_fetch.text();
          console.error(`Google Gemini error response:`, errorText);

          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error?.message) {
              throw new Error(`Google Gemini API error: ${response_fetch.status} - ${errorJson.error.message}`);
            }
          } catch {
            throw new Error(`Google Gemini API error: ${response_fetch.status} - ${errorText.substring(0, 200)}`);
          }
        }

        const data = await response_fetch.json();

        if (!data.candidates || data.candidates.length === 0) {
          if (data.promptFeedback?.blockReason) {
            throw new Error(`Response blocked: ${data.promptFeedback.blockReason}`);
          }
          throw new Error('No response candidates returned from Gemini');
        }

        response = data.candidates[0]?.content?.parts[0]?.text || '';
        console.log(`Google Gemini response received`);

      } else if (aiCreds.provider === 'openrouter') {
        console.log(`Sending request to OpenRouter...`);

        const siteUrl = context.siteUrl || 'https://app.n8n.io';
        const siteName = context.siteName || 'n8n Workflow';

        const headers: Record<string, string> = {
          'Authorization': `Bearer ${aiCreds.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': siteUrl,
          'X-Title': siteName,
        };

        if (aiCreds.openrouterProvider) {
          headers['X-OpenRouter-Provider'] = aiCreds.openrouterProvider;
        }

        const messages: any[] = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }

        if (inputData?.multimedia && Array.isArray(inputData.multimedia)) {
          const content: any[] = [
            { type: 'text', text: userPrompt }
          ];

          for (const media of inputData.multimedia) {
            if (media.type === 'image' && media.url) {
              content.push({
                type: 'image_url',
                image_url: { url: media.url }
              });
            } else if (media.type === 'audio' && media.data) {
              content.push({
                type: 'input_audio',
                input_audio: {
                  data: media.data,
                  format: media.format || 'wav'
                }
              });
            } else if (media.type === 'video' && media.url) {
              content.push({
                type: 'video_url',
                video_url: { url: media.url }
              });
            }
          }

          messages.push({
            role: 'user',
            content
          });
        } else {
          messages.push({ role: 'user', content: userPrompt });
        }

        const requestBody: any = {
          model: aiCreds.model || 'google/gemini-2.0-flash',
          messages,
          temperature,
          max_tokens: maxTokens,
        };

        if (aiCreds.top_p !== undefined) {
          requestBody.top_p = aiCreds.top_p;
        }
        if (aiCreds.top_k !== undefined) {
          requestBody.top_k = aiCreds.top_k;
        }
        if (aiCreds.frequency_penalty !== undefined) {
          requestBody.frequency_penalty = aiCreds.frequency_penalty;
        }
        if (aiCreds.presence_penalty !== undefined) {
          requestBody.presence_penalty = aiCreds.presence_penalty;
        }

        console.log(`Using model: ${requestBody.model}`);
        console.log(`Headers:`, Object.keys(headers).join(', '));

        const response_fetch = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!response_fetch.ok) {
          const errorText = await response_fetch.text();
          console.error(`OpenRouter error response:`, errorText);

          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error?.message) {
              throw new Error(`OpenRouter API error: ${response_fetch.status} - ${errorJson.error.message}`);
            }
          } catch {
            throw new Error(`OpenRouter API error: ${response_fetch.status} - ${errorText.substring(0, 200)}`);
          }
        }

        const data = await response_fetch.json();

        if (data.usage) {
          console.log(`OpenRouter usage - Prompt: ${data.usage.prompt_tokens}, Completion: ${data.usage.completion_tokens}, Total: ${data.usage.total_tokens}`);
        }

        if (data.model) {
          console.log(`Model used: ${data.model}`);
        }

        response = data.choices[0]?.message?.content || '';
        console.log(`OpenRouter response received`);

      } else {
        throw new Error(`Unsupported AI provider: ${aiCreds.provider}`);
      }

      console.log(`AI processing complete!`);
      console.log(`Response length: ${response.length} characters`);
      console.log(`Response preview:`, response.substring(0, 150) + '...');

      // IMPROVED JSON PARSING WITH MARKDOWN STRIPPING
      try {
        const trimmedResponse = response.trim();

        // Strip markdown code fences before parsing
        const cleanedResponse = this.stripMarkdownCodeFences(trimmedResponse);

        if ((cleanedResponse.startsWith('{') && cleanedResponse.endsWith('}')) ||
          (cleanedResponse.startsWith('[') && cleanedResponse.endsWith(']'))) {
          const parsed = JSON.parse(cleanedResponse);
          console.log(`Response parsed as JSON`);
          return parsed;
        }
      } catch (e) {
        console.log(`Response is plain text (JSON parse failed: ${e})`);
      }

      return response;

    } catch (error: any) {
      console.error(`AI execution failed:`, error.message);
      console.error(`Stack trace:`, error.stack);

      let errorMessage = `Failed to get AI response: ${error.message}`;

      if (error.message.includes('401') || error.message.includes('authentication')) {
        errorMessage += '\n\nAuthentication failed. Please check your API key.';
      } else if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('limit') || error.message.includes('rate limit')) {
        errorMessage += '\n\nAPI quota/rate limit exceeded. Check your account limits.';

        if (aiCreds.provider === 'google') {
          errorMessage += '\n\nGoogle Gemini free tier: 20 requests/day per model';
          errorMessage += '\nUpgrade at: https://makersuite.google.com/app/apikey';
        } else if (aiCreds.provider === 'openrouter') {
          errorMessage += '\n\nCheck OpenRouter usage: https://openrouter.ai/usage';
        }
      } else if (error.message.includes('model')) {
        errorMessage += '\n\nModel error. Verify the model name is correct.';
        if (aiCreds.provider === 'openrouter') {
          errorMessage += '\nAvailable models: https://openrouter.ai/models';
        }
      } else if (error.message.includes('invalid api key') || error.message.includes('API key not valid')) {
        errorMessage += '\n\nInvalid API key. Please check your credentials.';

        if (aiCreds.provider === 'openrouter') {
          errorMessage += '\nGet OpenRouter key: https://openrouter.ai/keys';
        } else if (aiCreds.provider === 'google') {
          errorMessage += '\nGet Gemini key: https://makersuite.google.com/app/apikey';
        } else if (aiCreds.provider === 'openai') {
          errorMessage += '\nGet OpenAI key: https://platform.openai.com/api-keys';
        } else if (aiCreds.provider === 'anthropic') {
          errorMessage += '\nGet Anthropic key: https://console.anthropic.com/account/keys';
        }
      }

      throw new Error(errorMessage);
    }
  }
  private async executeCode(context: NodeContext, inputData: any): Promise<any> {
    const { code, language = 'javascript' } = context.nodeData;

    if (language !== 'javascript') {
      throw new Error(`Code execution only supports JavaScript, got: ${language}`);
    }
    console.log('Executing code:', code);
    try {
      const fn = new Function('inputData', 'context', code);
      const result = fn(inputData, context);

      return result;
    } catch (error: any) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }

  private async executeCondition(context: NodeContext, inputData: any): Promise<any> {
    const { condition, conditions, combineOperation, trueOutputSource, falseOutputSource } = context.nodeData;

    console.log('🔀 Condition Node Execution');
    console.log('   Input Data:', JSON.stringify(inputData, null, 2).substring(0, 200));
    console.log('   True Output Source:', trueOutputSource || '(none)');
    console.log('   False Output Source:', falseOutputSource || '(none)');

    try {
      // Check if we're in Array Splitter Mode (both output sources configured)
      const isSplitterMode = !!(trueOutputSource && falseOutputSource);

      if (isSplitterMode) {
        console.log(' Array Splitter Mode ACTIVE');

        // Extract arrays from specified paths
        const trueData = this.getNestedValue(inputData, trueOutputSource);
        const falseData = this.getNestedValue(inputData, falseOutputSource);

        console.log('   True Data:', Array.isArray(trueData) ? `Array(${trueData.length})` : typeof trueData);
        console.log('   False Data:', Array.isArray(falseData) ? `Array(${falseData.length})` : typeof falseData);

        // In splitter mode, send both outputs simultaneously
        return {
          conditionMet: true, // Not used in splitter mode
          isSplitterMode: true,

          // Main outputs
          true: trueData,
          false: falseData,

          // Aliases for compatibility
          passed: trueData,
          failed: falseData,

          // Metadata
          trueCount: Array.isArray(trueData) ? trueData.length : (trueData ? 1 : 0),
          falseCount: Array.isArray(falseData) ? falseData.length : (falseData ? 1 : 0),
          mode: 'splitter'
        };
      }

      // Array Filtering Logic: If input is array, split items based on conditions
      if (Array.isArray(inputData) && conditions && conditions.length > 0 && !isSplitterMode) {
        console.log(`   🔄 Processing Array Input (${inputData.length} items)`);

        const passed: any[] = [];
        const failed: any[] = [];

        inputData.forEach((item: any, idx: number) => {
          // Reuse logic - Extract simple evaluation to helper if possible, or duplicate safely
          const results = conditions.map((cond: any) => {
            const { field, operator, value } = cond;
            const itemValue = this.getNestedValue(item, field);

            let result = false;
            switch (operator) {
              case 'equals': result = String(itemValue) === value; break;
              case 'notEquals': result = String(itemValue) !== value; break;
              case 'greaterThan': result = Number(itemValue) > Number(value); break;
              case 'lessThan': result = Number(itemValue) < Number(value); break;
              case 'greaterOrEqual': result = Number(itemValue) >= Number(value); break;
              case 'lessOrEqual': result = Number(itemValue) <= Number(value); break;
              case 'contains': result = String(itemValue).toLowerCase().includes(value.toLowerCase()); break;
              case 'startsWith': result = String(itemValue).toLowerCase().startsWith(value.toLowerCase()); break;
              case 'endsWith': result = String(itemValue).toLowerCase().endsWith(value.toLowerCase()); break;
              case 'typeIs':
                if (value === 'string') result = typeof itemValue === 'string';
                else if (value === 'number') result = typeof itemValue === 'number' && !isNaN(itemValue);
                else if (value === 'boolean') result = typeof itemValue === 'boolean';
                else if (value === 'array') result = Array.isArray(itemValue);
                else if (value === 'object') result = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
                else if (value === 'null') result = itemValue === null;
                else if (value === 'undefined') result = itemValue === undefined;
                break;
              default: result = false;
            }
            console.log(`      Item[${idx}] Field "${field}": ${itemValue} (${typeof itemValue}) ${operator} ${value} -> ${result}`);
            return result;
          });

          const isMatch = (combineOperation === 'OR') ? results.some(r => r) : results.every(r => r);
          if (isMatch) passed.push(item);
          else failed.push(item);
        });

        console.log(`   ✅ Array Split Complete: ${passed.length} Passed, ${failed.length} Failed`);

        return {
          conditionMet: passed.length > 0,
          isSplitterMode: false,
          isArrayMode: true,
          true: passed,
          false: failed,
          passed: passed,
          failed: failed,
          trueCount: passed.length,
          falseCount: failed.length,
          mode: 'array_filter'
        };
      }

      // Boolean Branching Mode - Evaluate conditions
      console.log('   🔀 Boolean Branching Mode');
      let isTrue = false;

      // Modern Condition Builder (array of conditions)
      if (Array.isArray(conditions) && conditions.length > 0) {
        console.log(`   Evaluating ${conditions.length} condition(s) with ${combineOperation} logic`);

        const results = conditions.map((cond: any, idx: number) => {
          const { field, operator, value } = cond;
          const itemValue = this.getNestedValue(inputData, field);

          let result = false;
          switch (operator) {
            case 'equals':
              result = String(itemValue) === value;
              break;
            case 'notEquals':
              result = String(itemValue) !== value;
              break;
            case 'greaterThan':
              result = Number(itemValue) > Number(value);
              break;
            case 'lessThan':
              result = Number(itemValue) < Number(value);
              break;
            case 'greaterOrEqual':
              result = Number(itemValue) >= Number(value);
              break;
            case 'lessOrEqual':
              result = Number(itemValue) <= Number(value);
              break;
            case 'contains':
              result = String(itemValue).toLowerCase().includes(value.toLowerCase());
              break;
            case 'startsWith':
              result = String(itemValue).toLowerCase().startsWith(value.toLowerCase());
              break;
            case 'endsWith':
              result = String(itemValue).toLowerCase().endsWith(value.toLowerCase());
              break;
            default:
              result = false;
          }

          console.log(`   Condition ${idx + 1}: ${field} ${operator} "${value}" → ${itemValue} → ${result}`);
          return result;
        });

        isTrue = (combineOperation === 'OR') ? results.some(r => r) : results.every(r => r);
        console.log(`   Combined Result (${combineOperation}): ${isTrue}`);

      } else if (condition) {
        // Legacy eval mode
        console.log('   Using legacy condition evaluation');
        const fn = new Function('input', `return ${condition}`);
        isTrue = !!fn(inputData);
      }

      // Extract output data based on configuration
      const trueData = trueOutputSource ? this.getNestedValue(inputData, trueOutputSource) : inputData;
      const falseData = falseOutputSource ? this.getNestedValue(inputData, falseOutputSource) : inputData;

      console.log(`   Condition Met: ${isTrue}`);
      console.log(`   Routing to: ${isTrue ? 'TRUE' : 'FALSE'} output`);

      // Boolean branching - only send to one output
      return {
        conditionMet: isTrue,
        isSplitterMode: false,

        // Main outputs - only one will have data
        true: isTrue ? trueData : null,
        false: isTrue ? null : falseData,

        // Aliases
        passed: isTrue ? trueData : null,
        failed: isTrue ? null : falseData,

        // Legacy compatibility
        val: isTrue,

        // Metadata
        mode: 'boolean',
        evaluatedConditions: conditions?.length || 0
      };

    } catch (error: any) {
      console.error('   ❌ Condition evaluation failed:', error.message);
      throw new Error(`Condition evaluation failed: ${error.message}`);
    }
  }
  private async executeFilter(context: NodeContext, inputData: any): Promise<any> {
    const { conditions, combineOperation, arrayPath } = context.nodeData;

    let itemsToFilter = inputData;

    // Parse if string (handling double-encoding if necessary)
    if (typeof itemsToFilter === 'string') {
      try {
        itemsToFilter = JSON.parse(itemsToFilter);
        // Check if it's still a string (double encoded)
        if (typeof itemsToFilter === 'string') {
          itemsToFilter = JSON.parse(itemsToFilter);
        }
      } catch (e) {
        console.warn('Filter received string input but failed to parse as JSON:', e);
      }
    }

    // 1. Explicit Path Strategy: If user configured a path, try to use it
    if (arrayPath && itemsToFilter && typeof itemsToFilter === 'object') {
      console.log(`Filter using configured array path: "${arrayPath}"`);
      const extracted = this.getNestedValue(itemsToFilter, arrayPath);

      if (Array.isArray(extracted)) {
        itemsToFilter = extracted;
        console.log(`✅ Found array at "${arrayPath}"`);
      } else {
        console.warn(`⚠️ Configured path "${arrayPath}" did not resolve to an array. Value:`, extracted);
      }
    }

    // 2. Smart Extraction Strategy: If still not array, try auto-detection
    if (!Array.isArray(itemsToFilter)) {
      console.log('Filter input is object, attempting smart extraction...');

      if (Array.isArray(itemsToFilter.body)) {
        itemsToFilter = itemsToFilter.body;
        console.log('✅ Found array in "body" property');
      } else if (Array.isArray(itemsToFilter.data)) {
        itemsToFilter = itemsToFilter.data;
        console.log('✅ Found array in "data" property');
      } else if (Array.isArray(itemsToFilter.items)) {
        itemsToFilter = itemsToFilter.items;
        console.log('✅ Found array in "items" property');
      } else if (Array.isArray(itemsToFilter.rows)) {
        itemsToFilter = itemsToFilter.rows;
        console.log('✅ Found array in "rows" property');
      } else {
        // Try to reconstruct array if it looks like an array spread into object (e.g. { "0": {...}, "1": {...} })
        const keys = Object.keys(itemsToFilter).filter(k => /^\d+$/.test(k));
        if (keys.length > 0 && keys.length === Object.keys(itemsToFilter).filter(k => k !== 'triggeredAt' && k !== 'triggerType' && k !== 'metadata').length) {
          // It looks like a spread array
          itemsToFilter = keys.sort((a, b) => Number(a) - Number(b)).map(k => itemsToFilter[k]);
          console.log('✅ Reconstructed array from indexed object properties');
        }
      }
    }

    // 3. Fallback for Single Object: If input is an object but not an array, treat it as a single item
    if (!Array.isArray(itemsToFilter) && typeof itemsToFilter === 'object' && itemsToFilter !== null) {
      console.log('Filter received single object, treating as 1-item array for filtering');
      itemsToFilter = [itemsToFilter];
    }

    if (!Array.isArray(itemsToFilter)) {
      console.error('Filter node input:', JSON.stringify(inputData, null, 2));
      throw new Error(`Filter node requires an Array or Object input. Received: ${typeof inputData}.
         If your data is inside a property (like "body"), please configure the "Array Path" in the node settings (e.g., set it to "body").`);
    }

    if (!conditions || conditions.length === 0) {
      return {
        filtered: itemsToFilter,
        originalCount: itemsToFilter.length,
        filteredCount: itemsToFilter.length,
        count: itemsToFilter.length,
        passed: itemsToFilter,
        removed: []
      };
    }

    try {
      const filterFn = (item: any) => {
        const results = conditions.map((condition: FilterCondition) => {
          const { field, operator, value } = condition;
          const itemValue = this.getNestedValue(item, field);

          switch (operator) {
            case 'equals':
              return String(itemValue) === value;
            case 'notEquals':
              return String(itemValue) !== value;
            case 'greaterThan':
              return Number(itemValue) > Number(value);
            case 'lessThan':
              return Number(itemValue) < Number(value);
            case 'contains':
              return String(itemValue).toLowerCase().includes(value.toLowerCase());
            case 'startsWith':
              return String(itemValue).toLowerCase().startsWith(value.toLowerCase());
            case 'endsWith':
              return String(itemValue).toLowerCase().endsWith(value.toLowerCase());
            case 'typeIs':
              return typeof itemValue === value;
            default:
              return false;
          }
        });

        return combineOperation === 'AND'
          ? results.every(r => r)
          : results.some(r => r);
      };

      const passed = itemsToFilter.filter(filterFn);
      const filteredOut = itemsToFilter.filter((item: any) => !filterFn(item));

      return {
        filtered: passed,
        originalCount: itemsToFilter.length,
        filteredCount: passed.length,
        count: passed.length, // Match nodetypes.ts 'count' output
        passed,
        removed: filteredOut, // Match nodetypes.ts 'removed' output
        conditions,
        combineOperation
      };
    } catch (error: any) {
      throw new Error(`Filter execution failed: ${error.message}`);
    }
  }

  private getNestedValue(obj: any, path: string): any {
    if (!path) return undefined;
    if (path.includes('[')) {
      // Handle array indexing like 'users[0].name'
      return path.replace(/\]/g, '').split(/[.\[]/).reduce((current, key) => {
        if (current && typeof current === 'object' && key in current) {
          return current[key];
        }
        return undefined;
      }, obj);
    }
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  private async executeDatabaseQuery(context: NodeContext, inputData: any): Promise<any> {
    const userId = context.userId;
    if (!userId) {
      throw new Error('Database node: User ID is required to fetch credentials');
    }

    console.log('🔴 DATABASE NODE - Received nodeData:', JSON.stringify(context.nodeData, null, 2));
    console.log('🔍 Condition checks:');
    console.log(`   - operation: ${context.nodeData.operation}`);
    console.log(`   - rawSql: ${context.nodeData.rawSql ? 'present' : 'missing'}`);
    console.log(`   - multipleQueries: ${context.nodeData.multipleQueries}`);
    console.log(`   - queries length: ${context.nodeData.queries?.length || 0}`);
    console.log(`   - insertMode: ${context.nodeData.insertMode}`);
    console.log(`   - tableName: ${context.nodeData.tableName}`);

    let query: string;
    let params: any[] | undefined;

    // Check for raw SQL mode first
    if (context.nodeData.operation === 'raw' && context.nodeData.rawSql) {
      console.log('✅ Matched: Raw SQL Mode');
      query = context.nodeData.rawSql;

      // Replace template variables with actual input data
      // Support {{input}} for full JSON and {{input.field}} for specific fields
      query = query.replace(/\\{\\{input\\}\\}/g, () => {
        return JSON.stringify(inputData).replace(/'/g, "''"); // Escape single quotes
      });

      query = query.replace(/\\{\\{input\\.(\\w+)\\}\\}/g, (match, fieldName) => {
        const value = inputData?.[fieldName];
        if (value === undefined) {
          console.warn(`   ⚠️ Field "${fieldName}" not found in input data`);
          return 'NULL';
        }
        if (typeof value === 'object') {
          return JSON.stringify(value).replace(/'/g, "''");
        }
        return String(value).replace(/'/g, "''"); // Escape single quotes
      });

      console.log(`   ⚡ Raw SQL Mode - executing custom query`);
      console.log(`   ➤ Query: ${query.substring(0, 200)}${query.length > 200 ? '...' : ''}`);
    }
    // Check if using multiple inserts mode
    else if (context.nodeData.multipleQueries && context.nodeData.queries && context.nodeData.queries.length > 0) {
      console.log('✅ Matched: Multiple Columns Mode');
      console.log(`   📊 Multiple Columns Mode - ${context.nodeData.queries.length} columns`);

      // Get the table name from the first query (all should use same table)
      const tableName = context.nodeData.queries[0]?.tableName;
      if (!tableName) {
        throw new Error('Database node: Table name is required');
      }

      // Collect all columns and values
      const columns: string[] = [];
      const values: any[] = [];
      const placeholders: string[] = [];

      context.nodeData.queries.forEach((queryConfig: any, index: number) => {
        const { columnName = 'data', insertMode = 'fullJson', fieldToExtract } = queryConfig;

        // Verify all queries use the same table
        if (queryConfig.tableName !== tableName) {
          console.warn(`   ⚠️ Query #${index + 1} uses different table (${queryConfig.tableName}), expected ${tableName}. Using ${tableName}.`);
        }

        let dataToInsert;
        if (insertMode === 'fullJson') {
          dataToInsert = JSON.stringify(inputData);
        } else if (insertMode === 'specificField') {
          if (!fieldToExtract) {
            throw new Error(`Database node: Field to extract is required for column #${index + 1}`);
          }
          dataToInsert = inputData?.[fieldToExtract];
          if (dataToInsert === undefined) {
            throw new Error(`Database node: Field "${fieldToExtract}" not found in input data for column #${index + 1}`);
          }
          if (typeof dataToInsert === 'object' && dataToInsert !== null) {
            dataToInsert = JSON.stringify(dataToInsert);
          }
        }

        columns.push(`"${columnName}"`);
        values.push(dataToInsert);
        placeholders.push(`$${index + 1}`);

        console.log(`   ➤ Column #${index + 1}: "${columnName}" = ${String(dataToInsert).substring(0, 50)}...`);
      });

      // Generate single INSERT query with multiple columns
      query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
      params = values;

      console.log(`   ✍️ Generated multi-column INSERT with ${columns.length} columns`);
      console.log(`   ➤ Query: ${query}`);
    }
    // Check if using new simplified insert config
    else if (context.nodeData.operation === 'insert' || context.nodeData.insertMode) {
      console.log('✅ Matched: Simplified Insert Mode');
      const insertMode = context.nodeData.insertMode || 'fullJson';
      const tableName = context.nodeData.tableName;
      const columnName = context.nodeData.columnName || 'data';

      console.log(`   💾 Insert Mode: ${insertMode}`);

      if (!tableName) {
        throw new Error('Database node: Table name is required');
      }

      let dataToInsert;

      if (insertMode === 'fullJson') {
        // Insert entire input as JSON string
        dataToInsert = JSON.stringify(inputData);
        console.log(`   📦 Inserting full JSON data`);
      } else if (insertMode === 'specificField') {
        // Extract specific field from input
        const fieldToExtract = context.nodeData.fieldToExtract;
        if (!fieldToExtract) {
          throw new Error('Database node: Field to extract is required for specificField mode');
        }

        dataToInsert = inputData?.[fieldToExtract];
        if (dataToInsert === undefined) {
          throw new Error(`Database node: Field "${fieldToExtract}" not found in input data. Available fields: ${Object.keys(inputData || {}).join(', ')}`);
        }

        // If the extracted field is an object, stringify it
        if (typeof dataToInsert === 'object' && dataToInsert !== null) {
          dataToInsert = JSON.stringify(dataToInsert);
        }

        console.log(`   📝 Extracting field "${fieldToExtract}": ${String(dataToInsert).substring(0, 50)}...`);
      }

      // Generate INSERT query
      query = `INSERT INTO ${tableName} ("${columnName}") VALUES ($1) RETURNING *`;
      params = [dataToInsert];

      console.log(`   ✍️ Generated query: ${query}`);
      console.log(`   ➤ Data preview: ${String(dataToInsert).substring(0, 100)}${String(dataToInsert).length > 100 ? '...' : ''}`);
    } else {
      // Legacy mode - backward compatibility
      console.log('⚠️ Matched: Legacy Mode (backward compatibility)');

      // Check if this looks like it should be using the new mode but isn't configured properly
      if (context.nodeData.queries && Array.isArray(context.nodeData.queries)) {
        console.error('🔥 ERROR: Node has queries array but multipleQueries is not true!');
        console.error('   This looks like a multi-column insert configuration issue.');
        console.error('   queries array:', context.nodeData.queries);
        console.error('   multipleQueries:', context.nodeData.multipleQueries);
        throw new Error('Database node: Configuration error - queries array found but multipleQueries not enabled. Please re-save your database node configuration.');
      }

      if (context.nodeData.tableName && !context.nodeData.query) {
        console.error('🔥 ERROR: Node has tableName but no operation mode set!');
        console.error('   This looks like a simplified insert configuration issue.');
        console.error('   tableName:', context.nodeData.tableName);
        console.error('   operation:', context.nodeData.operation);
        console.error('   insertMode:', context.nodeData.insertMode);
        throw new Error('Database node: Configuration error - tableName found but no operation/insertMode set. Please ensure operation="insert" is saved in your configuration.');
      }

      const querySource = context.nodeData.querySource || 'ui';
      console.log(`   💾 Query Source Mode (Legacy): ${querySource}`);

      switch (querySource) {
        case 'ui':
          query = context.nodeData.query;
          if (!query) {
            throw new Error('Database node (UI mode): Query must be configured in the node settings.');
          }
          console.log(`   📋 Using UI-configured query`);
          break;

        case 'input':
          if (typeof inputData === 'string') {
            query = inputData;
          } else if (inputData?.query) {
            query = inputData.query;
          } else {
            throw new Error('Database node (Input mode): No query found in input data.');
          }
          console.log(`   📥 Using query from input data`);
          break;

        case 'combined':
          query = context.nodeData.query;
          if (!query) {
            throw new Error('Database node (Combined mode): Query template must be configured in UI.');
          }

          if (inputData?.params && Array.isArray(inputData.params)) {
            params = inputData.params;
          } else if (inputData?.parameters && Array.isArray(inputData.parameters)) {
            params = inputData.parameters;
          } else if (Array.isArray(inputData)) {
            params = inputData;
          }

          console.log(`   🔗 Using UI query template with ${params?.length || 0} parameter(s)`);
          break;

        default:
          throw new Error(`Database node: Unknown query source mode: ${querySource}`);
      }
    }

    const operation = context.nodeData.operation || 'INSERT';

    console.log(`   💾 Fetching database credentials for user: ${userId}`);

    // Fetch Database credentials
    const { db } = await import('@/db');
    const { credentials } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');

    const credentialResult = await db
      .select()
      .from(credentials)
      .where(
        and(
          eq(credentials.userId, userId),
          eq(credentials.type, 'DATABASE'),
          eq(credentials.isActive, true)
        )
      )
      .limit(1);

    if (credentialResult.length === 0) {
      throw new Error(
        'Database node: No database credentials configured. Please configure database credentials in the node settings.'
      );
    }

    const dbCreds = credentialResult[0].data as any;
    const { connectionType, connectionUrl, host, port, database, username, password, ssl } = dbCreds;

    if (!connectionType) {
      throw new Error('Database node: Connection type is required');
    }

    console.log(`   💾 Executing ${operation} query on ${connectionType} database`);
    console.log(`   ➤ Query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);

    try {
      let result: any;

      switch (connectionType) {
        case 'postgres': {
          const { default: pg } = await import('pg');
          const { Pool } = pg;

          const poolConfig: any = connectionUrl
            ? { connectionString: connectionUrl, ssl: ssl ? { rejectUnauthorized: false } : false }
            : { host, port: port || 5432, database, user: username, password, ssl: ssl ? { rejectUnauthorized: false } : false };

          const pool = new Pool(poolConfig);

          try {
            // Execute single query with or without parameters
            const queryResult = params && params.length > 0
              ? await pool.query(query, params)
              : await pool.query(query);

            result = {
              rows: queryResult.rows,
              rowCount: queryResult.rowCount,
              fields: queryResult.fields?.map((f: any) => f.name) || []
            };
            console.log(`   ✔ PostgreSQL query executed successfully (${queryResult.rowCount} rows)${params ? ` with ${params.length} parameter(s)` : ''}`);
          } finally {
            await pool.end();
          }
          break;
        }

        case 'mysql': {
          const mysql = await import('mysql2/promise');

          const connectionConfig: any = connectionUrl
            ? connectionUrl
            : { host, port: port || 3306, database, user: username, password, ssl: ssl ? {} : undefined };

          const connection = await mysql.createConnection(connectionConfig);

          try {
            // Execute query with or without parameters
            const [rows, fields] = params && params.length > 0
              ? await connection.execute(query, params)
              : await connection.execute(query);

            result = {
              rows: Array.isArray(rows) ? rows : [],
              rowCount: Array.isArray(rows) ? rows.length : 0,
              fields: Array.isArray(fields) ? fields.map((f: any) => f.name) : []
            };
            console.log(`   ✔ MySQL query executed successfully (${result.rowCount} rows)${params ? ` with ${params.length} parameter(s)` : ''}`);
          } finally {
            await connection.end();
          }
          break;
        }

        case 'mongodb': {
          const { MongoClient } = await import('mongodb');

          const mongoUrl = connectionUrl || `mongodb://${username}:${password}@${host}:${port || 27017}/${database}`;
          const client = new MongoClient(mongoUrl);

          try {
            await client.connect();
            console.log(`   🔗 Connected to MongoDB`);

            const dbInstance = client.db(database);

            // Parse MongoDB query (expecting JSON format)
            let parsedQuery;
            try {
              parsedQuery = typeof query === 'string' ? JSON.parse(query) : query;
            } catch (e) {
              throw new Error('MongoDB query must be valid JSON. Example: {"collection": "users", "operation": "find", "filter": {"age": {"$gt": 18}}}');
            }

            const { collection: collectionName, operation: mongoOp = 'find', filter = {}, data, options = {} } = parsedQuery;

            if (!collectionName) {
              throw new Error('MongoDB query must specify a "collection" field');
            }

            const collection = dbInstance.collection(collectionName);

            let mongoResult;
            switch (mongoOp.toLowerCase()) {
              case 'find':
                mongoResult = await collection.find(filter, options).toArray();
                result = { rows: mongoResult, rowCount: mongoResult.length };
                break;
              case 'findone':
                mongoResult = await collection.findOne(filter, options);
                result = { rows: mongoResult ? [mongoResult] : [], rowCount: mongoResult ? 1 : 0 };
                break;
              case 'insertone':
                mongoResult = await collection.insertOne(data);
                result = { insertedId: mongoResult.insertedId, acknowledged: mongoResult.acknowledged, rowCount: 1 };
                break;
              case 'insertmany':
                mongoResult = await collection.insertMany(data);
                result = { insertedIds: mongoResult.insertedIds, insertedCount: mongoResult.insertedCount, rowCount: mongoResult.insertedCount };
                break;
              case 'updateone':
                mongoResult = await collection.updateOne(filter, data);
                result = { matchedCount: mongoResult.matchedCount, modifiedCount: mongoResult.modifiedCount, rowCount: mongoResult.modifiedCount };
                break;
              case 'updatemany':
                mongoResult = await collection.updateMany(filter, data);
                result = { matchedCount: mongoResult.matchedCount, modifiedCount: mongoResult.modifiedCount, rowCount: mongoResult.modifiedCount };
                break;
              case 'deleteone':
                mongoResult = await collection.deleteOne(filter);
                result = { deletedCount: mongoResult.deletedCount, rowCount: mongoResult.deletedCount };
                break;
              case 'deletemany':
                mongoResult = await collection.deleteMany(filter);
                result = { deletedCount: mongoResult.deletedCount, rowCount: mongoResult.deletedCount };
                break;
              case 'aggregate':
                mongoResult = await collection.aggregate(filter).toArray();
                result = { rows: mongoResult, rowCount: mongoResult.length };
                break;
              default:
                throw new Error(`Unsupported MongoDB operation: ${mongoOp}`);
            }

            console.log(`   ✔ MongoDB ${mongoOp} executed successfully`);
          } finally {
            await client.close();
          }
          break;
        }

        case 'sqlite': {
          const sqlite3 = await import('sqlite3');
          const { open } = await import('sqlite');

          const dbPath = database || './database.sqlite';
          const dbInstance = await open({
            filename: dbPath,
            driver: sqlite3.default.Database
          });

          try {
            const isSelect = operation.toUpperCase().startsWith('SELECT') || query.trim().toUpperCase().startsWith('SELECT');

            if (isSelect) {
              const rows = await dbInstance.all(query);
              result = {
                rows,
                rowCount: rows.length,
                fields: rows.length > 0 ? Object.keys(rows[0]) : []
              };
              console.log(`   ✔ SQLite query executed successfully (${rows.length} rows)`);
            } else {
              const runResult = await dbInstance.run(query);
              result = {
                changes: runResult.changes,
                lastID: runResult.lastID,
                rowCount: runResult.changes || 0
              };
              console.log(`   ✔ SQLite query executed successfully (${runResult.changes} changes)`);
            }
          } finally {
            await dbInstance.close();
          }
          break;
        }

        default:
          throw new Error(`Unsupported database type: ${connectionType}`);
      }

      return {
        success: true,
        connectionType,
        operation,
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        ...result,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      console.error(`   ❌ Database query failed:`, error.message);

      let errorMessage = `Database query failed: ${error.message}`;

      if (error.code === 'ECONNREFUSED') {
        errorMessage += '\n\n🌐 Connection refused. Check:\n' +
          '1. Database server is running\n' +
          '2. Host and port are correct\n' +
          '3. Firewall is not blocking the connection';
      } else if (error.code === '28P01' || error.code === 'ER_ACCESS_DENIED_ERROR') {
        errorMessage += '\n\n🔐 Authentication failed. Check:\n' +
          '1. Username is correct\n' +
          '2. Password is correct\n' +
          '3. User has proper permissions';
      } else if (error.code === '3D000' || error.code === 'ER_BAD_DB_ERROR') {
        errorMessage += '\n\n📦 Database does not exist';
      } else if (error.message.includes('syntax')) {
        errorMessage += '\n\n📝 SQL syntax error in your query';
      }

      throw new Error(errorMessage);
    }
  }

  private async executeWebhook(context: NodeContext, inputData: any): Promise<any> {
    // Webhook trigger - passes through data
    return {
      ...inputData,
      triggeredAt: new Date().toISOString(),
      triggerType: 'webhook'
    };
  }

  private async executeSchedule(context: NodeContext, inputData: any): Promise<any> {
    // Schedule trigger - passes through data
    return {
      ...inputData,
      triggeredAt: new Date().toISOString(),
      triggerType: 'schedule',
      scheduledTime: context.nodeData.scheduledTime
    };
  }

  private async executeInitial(context: NodeContext, inputData: any): Promise<any> {
    // Initial trigger - passes through data
    return {
      ...inputData,
      triggeredAt: new Date().toISOString(),
      triggerType: 'initial'
    };
  }

  // ============ WORKFLOW LIFECYCLE HOOKS ============

  async completeWorkflow(context: HookContext, result: any): Promise<HookResult> {
    try {
      console.log(`   🎉 Workflow ${context.workflowId} completed`);

      // Optionally send completion event to Kafka
      const completionTopic = `workflow.${context.workflowId}.complete`;

      await this.kafkaService.createTopic(completionTopic, 1);
      await this.kafkaService.sendMessage(
        completionTopic,
        context.executionId,
        {
          executionId: context.executionId,
          result,
          status: 'COMPLETED',
          timestamp: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: { message: 'Workflow completed successfully' }
      };
    } catch (error: any) {
      console.error('Failed to send completion event:', error.message);
      // Don't fail the workflow if event sending fails
      return {
        success: true,
        data: { message: 'Workflow completed (event send failed)' }
      };
    }
  }

  async handleError(context: NodeContext, error: Error): Promise<HookResult> {
    try {
      console.error(`   ❌ Error in node ${context.nodeId}:`, error.message);

      // Optionally send error event to Kafka
      const errorTopic = `workflow.${context.workflowId}.error`;

      await this.kafkaService.createTopic(errorTopic, 1);
      await this.kafkaService.sendMessage(
        errorTopic,
        context.executionId,
        {
          executionId: context.executionId,
          nodeId: context.nodeId,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      );

      return {
        success: true,
        data: { message: 'Error logged successfully' }
      };
    } catch (kafkaError: any) {
      console.error('Failed to log error to Kafka:', kafkaError.message);
      // Don't fail if logging fails
      return {
        success: true,
        data: { message: 'Error occurred (logging failed)' }
      };
    }
  }

  async log(
    context: NodeContext,
    message: string,
    level: 'INFO' | 'WARN' | 'ERROR' = 'INFO',
    metadata?: any
  ): Promise<HookResult> {
    try {
      console.log(`   📝 [${level}] ${message}`);

      // Optionally send log to Kafka
      const logTopic = `workflow.${context.workflowId}.logs`;

      await this.kafkaService.createTopic(logTopic, 1);
      await this.kafkaService.sendMessage(
        logTopic,
        context.executionId,
        {
          executionId: context.executionId,
          nodeId: context.nodeId,
          level,
          message,
          metadata,
          timestamp: new Date().toISOString()
        }
      );

      return { success: true };
    } catch (error: any) {
      console.error('Kafka logging failed:', error.message);
      // Don't throw - logging failure shouldn't stop execution
      return { success: true };
    }
  }

  // ============ GOOGLE SHEET EXECUTION ============
  private async executeGoogleSheet(context: NodeContext, inputData: any): Promise<any> {
    const { spreadsheetId, sheetName = 'Sheet1', operation = 'append' } = context.nodeData;

    if (!spreadsheetId) {
      throw new Error('Google Sheet node: Spreadsheet ID is required');
    }

    // For now, return a placeholder response
    // TODO: Implement actual Google Sheets API integration
    console.log(`📊 Google Sheet operation: ${operation}`);
    console.log(`   Spreadsheet ID: ${spreadsheetId}`);
    console.log(`   Sheet Name: ${sheetName}`);
    console.log(`   Data:`, inputData);

    return {
      success: true,
      operation,
      spreadsheetId,
      sheetName,
      message: 'Google Sheet integration pending implementation',
      data: inputData
    };
  }

  // ============ SLACK EXECUTION ============
  private async executeSlack(context: NodeContext, inputData: any): Promise<any> {
    const userId = context.userId;
    if (!userId) {
      throw new Error('Slack node: User ID is required to fetch credentials');
    }

    // Fetch Slack credentials
    const { db } = await import('@/db');
    const { credentials } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');

    const credentialResult = await db
      .select()
      .from(credentials)
      .where(
        and(
          eq(credentials.userId, userId),
          eq(credentials.type, 'SLACK'),
          eq(credentials.isActive, true)
        )
      )
      .limit(1);

    if (credentialResult.length === 0) {
      throw new Error('Slack node: No Slack credentials configured');
    }

    const slackCreds = credentialResult[0].data as any;
    const { botToken } = slackCreds;

    if (!botToken) {
      throw new Error('Slack node: Bot token is required');
    }

    const message = inputData?.message || context.nodeData.message || JSON.stringify(inputData);
    const channel = context.nodeData.channel || '#general';

    console.log(`📨 Sending Slack message to ${channel}`);

    // Send message to Slack
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        text: message,
        username: context.nodeData.username || 'Workflow Bot',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return {
      sent: true,
      channel,
      message,
      timestamp: data.ts,
      slackResponse: data
    };
  }

  // ============ DISCORD EXECUTION ============
  private interpolateVariables(template: string, variables: any): string {
    if (!template) return '';
    return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const path = key.trim().split('.');
      let value = variables;

      for (const part of path) {
        if (value === undefined || value === null) break;
        value = value[part];
      }

      if (value !== undefined) {
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
      }
      return match;
    });
  }

  private async executeDiscord(context: NodeContext, inputData: any): Promise<any> {
    const userId = context.userId;
    if (!userId) {
      throw new Error('Discord node: User ID is required to fetch credentials');
    }

    // Fetch Discord credentials
    const { db } = await import('@/db');
    const { credentials } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');

    const credentialResult = await db
      .select()
      .from(credentials)
      .where(
        and(
          eq(credentials.userId, userId),
          eq(credentials.type, 'DISCORD'),
          eq(credentials.isActive, true)
        )
      )
      .limit(1);

    if (credentialResult.length === 0) {
      throw new Error('Discord node: No Discord webhook configured');
    }

    const discordCreds = credentialResult[0].data as any;
    const { webhookUrl } = discordCreds;

    if (!webhookUrl) {
      throw new Error('Discord node: Webhook URL is required');
    }

    // Prepare variables for interpolation
    const variables = { ...inputData };

    console.log(`💬 Sending Discord message via webhook`, { nodeData: context.nodeData, inputData });

    // Helper to extract nested data using path notation (e.g., "metadata.path", "user.name")
    const extractByPath = (obj: any, path: string): any => {
      if (!path) return obj;

      const keys = path.split('.');
      let result = obj;

      for (const key of keys) {
        if (result === null || result === undefined) {
          return undefined;
        }
        result = result[key];
      }

      return result;
    };

    // Enhanced interpolation that supports path extraction
    const interpolate = (text: string): string => {
      if (!text) return '';

      // Match {{path.to.data}} patterns
      return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const trimmedPath = path.trim();
        const value = extractByPath(variables, trimmedPath);

        if (value === undefined || value === null) {
          return match; // Keep original if not found
        }

        // Handle objects/arrays by stringifying
        if (typeof value === 'object') {
          return JSON.stringify(value, null, 2);
        }

        return String(value);
      });
    };

    // 1. Handle Message Content
    let content = context.nodeData.content || '';
    if (!content && context.nodeData.message) {
      content = context.nodeData.message;
    }

    // If content is empty, check if there's a specific path to extract
    if (!content && context.nodeData.dataPath) {
      const extractedData = extractByPath(inputData, context.nodeData.dataPath);
      content = typeof extractedData === 'string'
        ? extractedData
        : JSON.stringify(extractedData, null, 2);
    }

    // Final fallback to full input data
    if (!content && !context.nodeData.useEmbed && !context.nodeData.embed) {
      content = typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2);
    }

    content = interpolate(content);

    // 2. Prepare Payload
    const payload: any = {
      content: content,
      username: interpolate(context.nodeData.username || 'Workflow Bot'),
    };

    if (context.nodeData.avatarUrl) {
      payload.avatar_url = interpolate(context.nodeData.avatarUrl);
    }

    // 3. Handle Embeds
    const useEmbed = context.nodeData.useEmbed ?? (!!context.nodeData.embedTitle || !!context.nodeData.embed);

    if (useEmbed) {
      const embedConfig = context.nodeData.embed || {};
      const flatTitle = context.nodeData.embedTitle;
      const flatDescription = context.nodeData.embedDescription;
      const flatColor = context.nodeData.embedColor;

      const title = interpolate(embedConfig.title || flatTitle || '');
      const description = interpolate(embedConfig.description || flatDescription || '');

      if (title || description || (embedConfig.fields && embedConfig.fields.length > 0)) {
        const colorHex = embedConfig.color || flatColor || '#5865F2';
        const colorInt = parseInt(colorHex.replace('#', ''), 16);

        const embed: any = {
          title: title,
          description: description,
          color: isNaN(colorInt) ? 5793266 : colorInt,
        };

        if (embedConfig.footer) {
          embed.footer = { text: interpolate(embedConfig.footer) };
        }

        if (embedConfig.timestamp) {
          embed.timestamp = new Date().toISOString();
        }

        if (embedConfig.fields && Array.isArray(embedConfig.fields)) {
          embed.fields = embedConfig.fields.map((field: any) => ({
            name: interpolate(field.name || ''),
            value: interpolate(field.value || ''),
            inline: !!field.inline
          }));
        }

        payload.embeds = [embed];
      }
    }

    // Send to Discord webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord webhook error: ${response.status} - ${errorText}`);
    }

    return {
      sent: true,
      content,
      timestamp: new Date().toISOString()
    };
  }
}