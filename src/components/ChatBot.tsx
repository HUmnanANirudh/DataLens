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
  PromptInputMessage,
} from './ai-elements/prompt-input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import type { UIMessage } from 'ai';
import { ChatBotProps, ChatContext } from '@/types';

export function ChatBot({ isOpen, onClose, context }: ChatBotProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<ChatContext | undefined>(context);

  // Update context when it changes
  useEffect(() => {
    setChatContext(context);
  }, [context]);

  const { messages, sendMessage, status, error: chatError } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  useEffect(() => {
    if (chatError) {
      setError(chatError.message);
    }
  }, [chatError]);

  // Build context info string to prepend to messages
  const getContextInfo = (ctx: ChatContext | undefined): string => {
    if (!ctx) return '';
    const parts: string[] = [];
    if (ctx.churnRate !== undefined) parts.push(`Current churn rate: ${ctx.churnRate}%`);
    if (ctx.highRiskCount !== undefined) parts.push(`High-risk customers: ${ctx.highRiskCount}`);
    if (ctx.topDrivers && ctx.topDrivers.length > 0) {
      parts.push(`Top drivers: ${ctx.topDrivers.slice(0, 3).join(', ')}`);
    }
    if (ctx.actions && ctx.actions.length > 0) {
      parts.push(`Actions: ${ctx.actions.map(a => a.title).join('; ')}`);
    }
    if (ctx.chartData) {
      parts.push(`Chart context: ${ctx.chartData.description || ctx.chartData.type}`);
    }
    return parts.length > 0 ? `[Context: ${parts.join(' | ')}]\n\n` : '';
  };

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text.trim()) return;
      const contextInfo = getContextInfo(chatContext);
      const fullMessage = contextInfo + message.text;
      sendMessage({ text: fullMessage });
      setInput('');
    },
    [sendMessage, setInput, chatContext]
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
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full max-w-full p-0 flex flex-col">
        <SheetHeader className="border-b px-4 py-3 shrink-0">
          <SheetTitle className="flex items-center gap-2">
            DataLens Assistant
          </SheetTitle>
          {chatContext && (
            <p className="text-xs text-muted-foreground">
              Ask about your data, actions, or charts
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <Conversation>
              <ConversationContent>
                {error && (
                  <div className="mx-auto max-w-md rounded-lg bg-destructive/10 p-4 text-destructive text-sm my-4">
                    {error}
                  </div>
                )}
                {messages.length === 0 && !error && (
                  <ConversationEmptyState
                    title="Chat with DataLens"
                    description={
                      chatContext
                        ? "Ask questions about your data, actions, or specific charts"
                        : "Upload data and run analysis to get contextual insights"
                    }
                  />
                )}
                {messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      <MessageResponse>
                        {getTextFromMessage(message)}
                      </MessageResponse>
                    </MessageContent>

                    {/* Bottom toolbar with copy button (always visible for user messages) */}
                    <MessageToolbar className={message.role === 'user' ? 'justify-end mb-0' : 'justify-start opacity-0 group-hover:opacity-100 transition-opacity'}>
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
          </ScrollArea>
        </div>

        <div className="border-t p-4 shrink-0">
          <PromptInput onSubmit={handleSubmit} className="w-full">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}