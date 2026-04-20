import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { ChatContext } from '@/types';
export const maxDuration = 120;

export async function POST(req: Request) {
  const { messages, context } = await req.json();

  const coreMessages = await convertToModelMessages(messages);

  // Build context-aware system prompt
  const systemPrompt = buildSystemPrompt(context);

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: systemPrompt,
    messages: coreMessages,
  });

  return result.toUIMessageStreamResponse();
}

function buildSystemPrompt(context?: ChatContext): string {
  const basePrompt = `You are DataLens, an AI assistant for an AI Growth Strategy Engine.
You help users understand their data, interpret ML model predictions, and make data-driven decisions.
You can discuss:
- Data analysis and visualization
- Machine learning concepts and model performance
- Churn prediction and customer retention strategies
- Action recommendations based on predictions
- General questions about the dataset or predictions

IMPORTANT: Do NOT use markdown formatting like **bold**, *italics*, bullet lists with -, or any markdown syntax. Use plain text with clear line breaks. For lists, use simple lines separated by newlines. Never wrap text in ** markers.`;

  if (!context) {
    return basePrompt;
  }

  // Add context-specific information
  const contextParts: string[] = [];

  if (context.churnRate !== undefined) {
    contextParts.push(`Current churn rate: ${context.churnRate}%`);
  }

  if (context.highRiskCount !== undefined) {
    contextParts.push(`High-risk customers: ${context.highRiskCount}`);
  }

  if (context.topDrivers && context.topDrivers.length > 0) {
    contextParts.push(`Top churn drivers: ${context.topDrivers.join(', ')}`);
  }

  if (context.actions && context.actions.length > 0) {
    const actionTitles = context.actions.map((a: { title: string }) => a.title).join('; ');
    contextParts.push(`Recommended actions: ${actionTitles}`);
  }

  if (context.segments) {
    contextParts.push(`Risk segments: High=${context.segments.highRisk}, Medium=${context.segments.mediumRisk}, Low=${context.segments.lowRisk}`);
  }

  if (context.chartData) {
    contextParts.push(`User is asking about: ${context.chartData.type} chart - ${context.chartData.description || 'data point'}`);
  }

  if (contextParts.length === 0) {
    return basePrompt;
  }

  return `${basePrompt}

CURRENT ANALYSIS CONTEXT:
${contextParts.join('\n')}

When answering questions:
- Reference specific numbers and features from the context above
- Tie explanations to the recommended actions when relevant
- If the user asks about a chart, explain what the data means for their business`;
}