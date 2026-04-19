import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const model = google('gemini-3.1-pro-preview');

  const result = streamText({
    model: model,
    system: `You are DataLens, an AI assistant for an AI Growth Strategy Engine.
You help users understand their data, interpret ML model predictions, and make data-driven decisions.
You can discuss:
- Data analysis and visualization
- Machine learning concepts and model performance
- Churn prediction and customer retention strategies
- Action recommendations based on predictions
- General questions about the dataset or predictions

Be concise, helpful, and focus on the user's data context.`,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
