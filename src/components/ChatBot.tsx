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
import { useState, useCallback, useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { ChatBotProps, ChatContext, ChartContextType } from '@/types';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatBot({ isOpen, onClose, context, chartContext }: ChatBotProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<ChatContext | undefined>(context);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getContextInfo = (ctx: ChatContext | undefined, chart: ChartContextType | null | undefined): string => {
    const parts: string[] = [];

    // If no context at all, user hasn't uploaded data yet
    if (!ctx) {
      return '[No data uploaded yet. Ask the user to upload and analyze their CSV dataset first.]\n\n';
    }

    // Check if we have dataset info (upload happened) but no analysis yet
    const hasDatasetInfo = ctx.datasetInfo && ctx.churnRate === undefined;
    if (hasDatasetInfo) {
      const di = ctx.datasetInfo!;
      const columnList = di.columnAnalysis.map(c => c.name).join(', ');
      parts.push(`Dataset: ${di.name} | ${di.rowCount.toLocaleString()} rows | ${di.columnCount} columns`);
      parts.push(`Columns: ${columnList}`);
      if (!di.isValid) {
        parts.push(`Validation: ${di.validationReasons.join('; ')}`);
      }
    }

    // Add analysis context if available (after training)
    if (ctx.churnRate !== undefined) parts.push(`Churn rate: ${ctx.churnRate}%`);
    if (ctx.highRiskCount !== undefined) parts.push(`High-risk customers: ${ctx.highRiskCount}`);
    if (ctx.topDrivers && ctx.topDrivers.length > 0) {
      parts.push(`Top drivers: ${ctx.topDrivers.slice(0, 3).join(', ')}`);
    }
    if (ctx.actions && ctx.actions.length > 0) {
      parts.push(`Actions: ${ctx.actions.map(a => a.title).join('; ')}`);
    }

    // Current action context - when user clicks "ask about" on an action
    if (ctx.currentAction) {
      const action = ctx.currentAction;
      parts.push(`Current Action: ${action.title}`);
      parts.push(`Confidence: ${action.confidence}%`);
      parts.push(`Expected Impact: ${action.expectedImpact.delta}% ${action.expectedImpact.metric}`);
      parts.push(`Affected Users: ${action.affectedUsers.toLocaleString()}`);
      parts.push(`Reasoning: ${action.reasoning.join(' | ')}`);
    }

    // Inject chart context if present (from prop or from chatContext)
    const effectiveChart = chart || ctx.chartData;
    if (effectiveChart) {
      const chartType = 'chartType' in effectiveChart ? effectiveChart.chartType : effectiveChart.type;
      const chartInfo = `Chart: ${chartType}`;
      if (effectiveChart.segment) parts.push(`Segment: ${effectiveChart.segment}`);
      if (effectiveChart.feature) parts.push(`${chartInfo} - Feature: ${effectiveChart.feature}`);
      else parts.push(chartInfo);
      if (effectiveChart.value !== undefined) parts.push(`Value: ${effectiveChart.value}`);
      if (effectiveChart.description) parts.push(effectiveChart.description);
    }

    return parts.length > 0 ? `[Context: ${parts.join(' | ')}]\n\n` : '';
  };

  const { messages, sendMessage, status, error: chatError } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  // Wrap sendMessage to ensure stable reference
  const stableSendMessage = useCallback((msg: { text: string }) => {
    sendMessage(msg);
  }, [sendMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Track previous action ID to detect actual changes (avoiding object reference issues)
  const prevActionIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Pre-fill input when chat opens with a chart context question (from evidence charts)
  useEffect(() => {
    if (!isOpen) return;

    // If there's a chart description (user's typed question from evidence charts), pre-fill it
    // Don't pre-fill for: action cards (auto-send handles those), or the general "overview" ask button
    const chartDesc = chatContext?.chartData?.description;
    const chartType = chatContext?.chartData?.type;
    const isOverview = chartDesc === 'Evidence charts overview' && chartType === 'both';

    if (chartDesc && !isOverview && !chatContext?.currentAction) {
      // User came from evidence charts with a specific question - pre-fill input
      setInput(chartDesc);
    }
  }, [isOpen, chatContext]);

  useEffect(() => {
    // Update local chat context when prop changes
    setChatContext(context);
  }, [context]);

  // Effect to send initial message when chat opens with a new action context
  useEffect(() => {
    if (!isOpen) return; // Don't send if chat is closed

    const currAction = chatContext?.currentAction;
    const prevActionId = prevActionIdRef.current;

    // Only auto-send if there's no chart context - if user has a chart question, they should ask manually
    // chartData with type='action' is from action cards, not chart interactions
    const hasChartContext = chatContext?.chartData &&
      chatContext.chartData.type !== 'action' &&
      !chatContext?.chartData?.description?.includes('?');

    // Compare by ID to avoid object reference issues
    if (currAction && currAction.id !== prevActionId && !hasChartContext) {
      // Delay slightly to ensure sendMessage is ready
      const timer = setTimeout(() => {
        if (!isMountedRef.current) return;
        const actionContext = getContextInfo(chatContext, chartContext ?? undefined);
        const prompt = `Explain the action "${currAction.title}" in detail. Why was this recommended? What is the expected impact of ${currAction.expectedImpact.delta}% ${currAction.expectedImpact.metric}? Which customers are affected and how?`;
        const fullMessage = actionContext + prompt;
        stableSendMessage({ text: fullMessage });
      }, 100);

      return () => clearTimeout(timer);
    }

    prevActionIdRef.current = currAction?.id ?? null;
  }, [isOpen, chatContext, chartContext, stableSendMessage]);

  useEffect(() => {
    if (chatError) {
      setError(chatError.message);
    }
  }, [chatError]);

  const handleSubmit = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!input.trim() || status === 'streaming') return;
    const contextInfo = getContextInfo(chatContext, chartContext ?? undefined);
    const fullMessage = contextInfo + input;
    stableSendMessage({ text: fullMessage });
    setInput('');
  }, [input, stableSendMessage, chatContext, chartContext, status]);

  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const getTextFromMessage = (message: UIMessage): string => {
    return (message.parts || [])
      .filter((part) => part.type === 'text')
      .map((part) => (part as { text?: string }).text || '')
      .join('');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full max-w-full p-0 flex flex-col h-full" showCloseButton={false}>
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

        <ScrollArea className="flex-1 min-h-0">
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
                    ? "Ask questions about your data, actions, or charts"
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
                  {message.role === 'user' ? (
                    getTextFromMessage(message)
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {getTextFromMessage(message)}
                    </ReactMarkdown>
                  )}
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
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

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
