'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CopyIcon, CheckIcon, MessageSquareIcon, SendIcon } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import type { UIMessage } from 'ai';
import { ChatBotProps, ChatContext } from '@/types';
import { cn } from '@/lib/utils';

export function ChatBot({ isOpen, onClose, context }: ChatBotProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<ChatContext | undefined>(context);

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

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === 'streaming') return;
    const contextInfo = getContextInfo(chatContext);
    const fullMessage = contextInfo + input;
    sendMessage({ text: fullMessage });
    setInput('');
  }, [input, sendMessage, chatContext, status]);

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
            <MessageSquareIcon className="size-5" />
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
            <div className="p-4 space-y-4">
              {error && (
                <div className="mx-auto max-w-md rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
                  {error}
                </div>
              )}
              {messages.length === 0 && !error && (
                <div className="text-center py-12">
                  <MessageSquareIcon className="mx-auto size-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg mb-2">Chat with DataLens</h3>
                  <p className="text-sm text-muted-foreground">
                    {chatContext
                      ? "Ask questions about your data, actions, or specific charts"
                      : "Upload data and run analysis to get contextual insights"}
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "group flex w-full max-w-[85%] flex-col gap-2",
                    message.role === 'user' ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-3 text-sm",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {getTextFromMessage(message)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleCopy(getTextFromMessage(message), message.id)}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      message.role === 'user' && "ml-auto"
                    )}
                  >
                    {copiedId === message.id ? (
                      <CheckIcon className="size-4" />
                    ) : (
                      <CopyIcon className="size-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="border-t p-4 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your data..."
              className="flex-1 min-h-15 max-h-30 **:resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || status === 'streaming'}>
              <SendIcon className="size-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}