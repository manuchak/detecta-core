import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Camera, Send, Clock, Check, CheckCheck, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommMessage } from '@/hooks/useServicioComm';
import { format } from 'date-fns';

interface CustodioChatProps {
  messages: CommMessage[];
  isLoading: boolean;
  custodioName: string;
  onSendNudge: () => void;
  onSendMessage: (text: string) => void;
  isNudgePending?: boolean;
  isSendPending?: boolean;
}

function DeliveryIcon({ status }: { status: string | null }) {
  if (status === 'read') return <CheckCheck className="h-2.5 w-2.5 text-chart-1" />;
  if (status === 'delivered') return <CheckCheck className="h-2.5 w-2.5 text-muted-foreground/50" />;
  if (status === 'sent') return <Check className="h-2.5 w-2.5 text-muted-foreground/50" />;
  return <Clock className="h-2.5 w-2.5 text-muted-foreground/30" />;
}

export const CustodioChat: React.FC<CustodioChatProps> = ({
  messages, isLoading, custodioName, onSendNudge, onSendMessage,
  isNudgePending, isSendPending,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSendMessage(text);
    setDraft('');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Cargando mensajes…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <MessageSquare className="h-8 w-8 opacity-30" />
            <p className="text-xs">Sin mensajes vinculados a este servicio</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isBot = msg.is_from_bot;
            const time = format(new Date(msg.created_at), 'HH:mm');
            const hasMedia = !!msg.media_url;

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex flex-col max-w-[80%] gap-0.5',
                  isBot ? 'ml-auto items-end' : 'mr-auto items-start'
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl px-3 py-1.5 text-xs leading-relaxed',
                    isBot
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  )}
                >
                  {hasMedia && (
                    <div className="mb-1">
                      <img
                        src={msg.media_url!}
                        alt="media"
                        className="rounded-lg max-h-40 object-cover cursor-pointer"
                        loading="lazy"
                      />
                    </div>
                  )}
                  {msg.content && <span>{msg.content}</span>}
                </div>
                <div className="flex items-center gap-1 px-1">
                  <span className="text-[9px] text-muted-foreground/50">{time}</span>
                  {isBot && <DeliveryIcon status={msg.delivery_status} />}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick actions */}
      <div className="px-3 py-1.5 flex gap-1.5 border-t border-border/30">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[10px] gap-1 px-2"
          onClick={onSendNudge}
          disabled={isNudgePending}
        >
          <Camera className="h-3 w-3" />
          Pedir Status 📸
        </Button>
      </div>

      {/* Input bar */}
      <div className="px-3 pb-3 pt-1.5 flex gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Escribe un mensaje…"
          className="h-8 text-xs"
        />
        <Button
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleSend}
          disabled={!draft.trim() || isSendPending}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
