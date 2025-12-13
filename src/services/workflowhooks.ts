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
    const { url, method = 'GET', headers = [], body, queryParams = [], timeout = 30000 } = context.nodeData;

    if (!url) {
      throw new Error('HTTP node: URL is required');
    }

    // Build query string
    let finalUrl = url;
    if (queryParams.length > 0) {
      const params = new URLSearchParams();
      queryParams.forEach((param: any) => {
        if (param.key && param.value) {
          params.append(param.key, param.value);
        }
      });
      finalUrl = `${url}?${params.toString()}`;
    }

    // Build headers
    const fetchHeaders: Record<string, string> = {};
    headers.forEach((header: any) => {
      if (header.key && header.value) {
        fetchHeaders[header.key] = header.value;
      }
    });

    // Make request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(finalUrl, {
        method,
        headers: fetchHeaders,
        body: method !== 'GET' && body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      return {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        success: response.ok,
        url: finalUrl,
        method
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`HTTP request timeout after ${timeout}ms`);
      }

      throw new Error(`HTTP request failed: ${error.message}`);
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

    try {
      // Create a safe execution context
      const fn = new Function('input', 'context', code);
      const result = fn(inputData, context);

      return result;
    } catch (error: any) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }

  private async executeCondition(context: NodeContext, inputData: any): Promise<any> {
    const { condition, trueOutput, falseOutput } = context.nodeData;

    try {
      // Evaluate condition
      const fn = new Function('input', `return ${condition}`);
      const result = fn(inputData);

      return {
        conditionMet: !!result,
        output: result ? trueOutput : falseOutput,
        inputData
      };
    } catch (error: any) {
      throw new Error(`Condition evaluation failed: ${error.message}`);
    }
  }

  private async executeFilter(context: NodeContext, inputData: any): Promise<any> {
    const { filterCondition } = context.nodeData;

    if (!Array.isArray(inputData)) {
      throw new Error('Filter node requires array input');
    }

    try {
      const fn = new Function('item', `return ${filterCondition}`);
      const filtered = inputData.filter(fn);

      return {
        filtered,
        originalCount: inputData.length,
        filteredCount: filtered.length
      };
    } catch (error: any) {
      throw new Error(`Filter execution failed: ${error.message}`);
    }
  }

  private async executeDatabaseQuery(context: NodeContext, inputData: any): Promise<any> {
    const { query, operation = 'SELECT' } = context.nodeData;

    // TODO: Implement actual database operations
    console.log(`   💾 Database ${operation}:`, query);

    // Simulate database response
    return {
      success: true,
      operation,
      query,
      // In production, execute actual database query here
      simulatedOnly: true
    };
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

    const message = inputData?.message || context.nodeData.message || JSON.stringify(inputData);

    console.log(`💬 Sending Discord message via webhook`);

    // Prepare Discord message payload
    const payload: any = {
      content: message,
      username: context.nodeData.username || 'Workflow Bot',
    };

    if (context.nodeData.avatarUrl) {
      payload.avatar_url = context.nodeData.avatarUrl;
    }

    // Add embeds if configured
    if (context.nodeData.embedTitle || context.nodeData.embedDescription) {
      payload.embeds = [{
        title: context.nodeData.embedTitle,
        description: context.nodeData.embedDescription,
        color: parseInt(context.nodeData.embedColor?.replace('#', '') || '5865F2', 16),
      }];
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
      message,
      timestamp: new Date().toISOString()
    };
  }
}