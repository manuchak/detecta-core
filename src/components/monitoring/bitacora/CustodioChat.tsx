import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Camera, Send, Clock, Check, CheckCheck, MessageSquare,
  ArrowUp, Zap, Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommMessage } from '@/hooks/useServicioComm';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

interface CustodioChatProps {
  messages: CommMessage[];
  isLoading: boolean;
  custodioName: string;
  onSendNudge: () => void;
  onSendMessage: (text: string) => void;
  isNudgePending?: boolean;
  isSendPending?: boolean;
}

/* ── Delivery status ticks (iMessage style) ── */
function DeliveryTicks({ status }: { status: string | null }) {
  if (status === 'read') {
    return (
      <div className="flex items-center gap-px">
        <CheckCheck className="h-3 w-3 text-chart-1" />
      </div>
    );
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-3 w-3 text-muted-foreground/40" />;
  }
  if (status === 'sent') {
    return <Check className="h-3 w-3 text-muted-foreground/40" />;
  }
  return <Clock className="h-3 w-3 text-muted-foreground/25 animate-pulse" />;
}

/* ── Date separator ── */
function DateSeparator({ date }: { date: Date }) {
  let label: string;
  if (isToday(date)) label = 'Hoy';
  else if (isYesterday(date)) label = 'Ayer';
  else label = format(date, "d 'de' MMMM", { locale: es });

  return (
    <div className="flex items-center justify-center py-2">
      <span className="px-3 py-0.5 rounded-full bg-muted/60 border border-border/20 text-[9px] font-medium text-muted-foreground/70 backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}

/* ── Image lightbox for inline photos ── */
function MediaBubble({ url, caption }: { url: string; caption?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <button
        onClick={() => setExpanded(true)}
        className="block rounded-xl overflow-hidden max-w-[220px] group relative"
      >
        <img
          src={url}
          alt={caption || 'media'}
          className="w-full max-h-48 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Lightbox overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setExpanded(false)}
        >
          <img
            src={url}
            alt={caption || 'media'}
            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-200"
          />
        </div>
      )}
    </>
  );
}

/* ── Handoff separator ── */
function HandoffSeparator({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center py-2 gap-2">
      <div className="flex-1 h-px bg-border/30" />
      <span className="px-2.5 py-0.5 rounded-full bg-accent/50 border border-border/20 text-[9px] font-medium text-muted-foreground/70 flex items-center gap-1">
        🔄 {name} tomó el servicio
      </span>
      <div className="flex-1 h-px bg-border/30" />
    </div>
  );
}

/* ── Short display name (first name + last initial) ── */
function shortName(displayName: string | null): string {
  if (!displayName) return 'Sistema';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

/* ── Message Bubble ── */
function MessageBubble({ msg, showTail, showAuthor, authorName }: { msg: CommMessage; showTail: boolean; showAuthor: boolean; authorName: string | null }) {
  const isBot = msg.is_from_bot;
  const time = format(new Date(msg.created_at), 'HH:mm');
  const hasMedia = !!msg.media_url && !msg.media_url?.match(/^[a-f0-9]+$/i);
  const hasContent = !!msg.message_text && msg.message_text !== '[Imagen]';

  return (
    <div
      className={cn(
        'flex flex-col max-w-[82%] gap-0.5 group',
        isBot ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      {/* Author label for bot messages */}
      {isBot && showAuthor && (
        <span className="text-[9px] font-medium text-muted-foreground/60 px-2 mb-0.5">
          {authorName ? shortName(authorName) : 'Sistema'}
        </span>
      )}

      <div
        className={cn(
          'relative px-3 py-2 text-[13px] leading-[1.35] transition-shadow',
          isBot
            ? cn(
                'bg-primary text-primary-foreground',
                showTail ? 'rounded-[18px] rounded-br-[4px]' : 'rounded-[18px]'
              )
            : cn(
                'bg-muted/70 text-foreground border border-border/20',
                showTail ? 'rounded-[18px] rounded-bl-[4px]' : 'rounded-[18px]'
              ),
          'shadow-sm'
        )}
      >
        {hasMedia && <MediaBubble url={msg.media_url!} caption={msg.message_text || undefined} />}
        {hasContent && (
          <span className={cn(hasMedia && 'block mt-1.5')}>
            {msg.message_text}
          </span>
        )}
        {!hasContent && !hasMedia && msg.message_text && (
          <span className="italic text-muted-foreground/50 text-xs">{msg.message_text}</span>
        )}
      </div>

      {/* Timestamp + delivery status */}
      <div className={cn(
        'flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150',
        showTail && 'opacity-100'
      )}>
        <span className="text-[9px] text-muted-foreground/50 tabular-nums">{time}</span>
        {isBot && <DeliveryTicks status={msg.delivery_status} />}
      </div>
    </div>
  );
}

/* ── Main Chat Component ── */
export const CustodioChat: React.FC<CustodioChatProps> = ({
  messages, isLoading, custodioName, onSendNudge, onSendMessage,
  isNudgePending, isSendPending,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSendMessage(text);
    setDraft('');
    inputRef.current?.focus();
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: CommMessage[] }[] = [];
    let currentDate = '';

    messages.forEach(msg => {
      const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground px-6">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="apple-text-footnote">Cargando conversación…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Messages area ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
        style={{ overscrollBehavior: 'contain' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-6">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-muted-foreground/30" strokeWidth={1.5} />
            </div>
            <div className="text-center space-y-1">
              <p className="apple-text-callout text-foreground/60">Sin mensajes</p>
              <p className="apple-text-caption text-[11px]">
                Los mensajes del custodio aparecerán aquí en tiempo real
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 rounded-full px-4 mt-2 apple-press-scale"
              onClick={onSendNudge}
              disabled={isNudgePending}
            >
              <Camera className="h-3.5 w-3.5" />
              Solicitar primer status
            </Button>
          </div>
        ) : (
          groupedMessages.map(({ date, messages: groupMsgs }) => (
            <React.Fragment key={date}>
              <DateSeparator date={new Date(date)} />
              {groupMsgs.map((msg, i) => {
                const isLast = i === groupMsgs.length - 1;
                const nextDifferentSender = isLast || groupMsgs[i + 1].is_from_bot !== msg.is_from_bot;
                return (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    showTail={nextDifferentSender}
                  />
                );
              })}
            </React.Fragment>
          ))
        )}
      </div>

      {/* ── Quick actions bar ── */}
      {messages.length > 0 && (
        <div className={cn(
          'px-4 overflow-hidden transition-all duration-200',
          showQuickActions ? 'max-h-16 py-2' : 'max-h-0 py-0'
        )}>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1 px-2.5 rounded-full whitespace-nowrap shrink-0 border-chart-1/30 text-chart-1 hover:bg-chart-1/10 apple-press-scale"
              onClick={onSendNudge}
              disabled={isNudgePending}
            >
              <Camera className="h-3 w-3" />
              Pedir Status 📸
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1 px-2.5 rounded-full whitespace-nowrap shrink-0 apple-press-scale"
              onClick={() => { onSendMessage('Recibido, gracias 👍'); }}
            >
              👍 Recibido
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1 px-2.5 rounded-full whitespace-nowrap shrink-0 apple-press-scale"
              onClick={() => { onSendMessage('¿Todo en orden con el servicio?'); }}
            >
              ¿Todo bien?
            </Button>
          </div>
        </div>
      )}

      {/* ── Input bar (iMessage style) ── */}
      <div className="px-3 pb-3 pt-2 border-t border-border/20">
        <div className="flex items-end gap-2">
          {/* Quick actions toggle */}
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 apple-press-scale',
              showQuickActions
                ? 'bg-primary text-primary-foreground rotate-45'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            )}
          >
            <Zap className="h-4 w-4" />
          </button>

          {/* Text input */}
          <div className="flex-1 flex items-end rounded-full bg-muted/40 border border-border/30 px-3 py-1 transition-colors focus-within:border-primary/40 focus-within:bg-muted/60">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Mensaje…"
              className="flex-1 bg-transparent border-0 outline-none text-xs py-1 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!draft.trim() || isSendPending}
            className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 apple-press-scale',
              draft.trim()
                ? 'bg-primary text-primary-foreground scale-100'
                : 'bg-muted/40 text-muted-foreground/30 scale-90'
            )}
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
