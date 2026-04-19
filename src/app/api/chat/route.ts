import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Convert from AI SDK v4 parts format to core message format
  const coreMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: google('gemini-2.0-flash'),
    system: `You are DataLens, an AI assistant for an AI Growth Strategy Engine.
You help users understand their data, interpret ML model predictions, and make data-driven decisions.
You can discuss:
- Data analysis and visualization
- Machine learning concepts and model performance
- Churn prediction and customer retention strategies
- Action recommendations based on predictions
- General questions about the dataset or predictions

Be concise, helpful, and focus on the user's data context.`,
    messages: coreMessages,
  });

  return result.toUIMessageStreamResponse();
}