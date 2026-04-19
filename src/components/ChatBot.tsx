'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from './ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageToolbar,
  MessageAction,
} from './ai-elements/message';
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from './ai-elements/prompt-input';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { UIMessage } from 'ai';

export function ChatBot() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim()) return;
      sendMessage({ text: input });
      setInput('');
    },
    [input, sendMessage, setInput]
  );

  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const getTextFromMessage = (message: UIMessage): string =>
    message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('');

  return (
    <div className="flex flex-col h-150 max-w-2xl mx-auto border rounded-lg overflow-hidden bg-background">
      <div className="flex-1 overflow-hidden">
        <Conversation>
          <ConversationContent>
            {messages.length === 0 && (
              <ConversationEmptyState
                title="Chat with DataLens"
                description="Ask me anything about your data, ML models, or predictions"
              />
            )}
            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  <MessageResponse>
                  {getTextFromMessage(message)}
                  </MessageResponse>
                </MessageContent>
                <MessageToolbar>
                  <MessageAction
                    onClick={() =>
                      handleCopy(getTextFromMessage(message), message.id)
                    }
                    tooltip={copiedId === message.id ? 'Copied!' : 'Copy'}
                  >
                    {copiedId === message.id ? (
                      <CheckIcon className="size-4" />
                    ) : (
                      <CopyIcon className="size-4" />
                    )}
                  </MessageAction>
                </MessageToolbar>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSubmit}>
          <PromptInput
            onSubmit={() => {}}
            className="w-full"
          >
            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your data..."
                className="flex-1"
              />
            </PromptInputBody>
            <PromptInputFooter>
              <div className="flex justify-end">
                <PromptInputSubmit status={status} />
              </div>
            </PromptInputFooter>
          </PromptInput>
        </form>
      </div>
    </div>
  );
}
