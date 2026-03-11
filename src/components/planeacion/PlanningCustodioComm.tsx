import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Send, MapPin, Camera, Clock, Check, CheckCheck,
  MessageSquare, ArrowUp, Zap, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServicioComm } from '@/hooks/useServicioComm';
import type { CommMessage } from '@/hooks/useServicioComm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

interface PlanningCustodioCommProps {
  servicioId: string;
  custodioName: string;
  custodioTelefono: string | null;
  folioServicio: string;
  /** When true (hora_llegada_custodio set), the chat becomes read-only */
  isHandedOff: boolean;
}

/* ── Delivery ticks ── */
function DeliveryTicks({ status }: { status: string | null }) {
  if (status === 'read') return <CheckCheck className="h-3 w-3 text-chart-1" />;
  if (status === 'delivered') return <CheckCheck className="h-3 w-3 text-muted-foreground/40" />;
  if (status === 'sent') return <Check className="h-3 w-3 text-muted-foreground/40" />;
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
      <span className="px-3 py-0.5 rounded-full bg-muted/60 border border-border/20 text-[9px] font-medium text-muted-foreground/70">
        {label}
      </span>
    </div>
  );
}

/* ── Message bubble ── */
function Bubble({ msg, showTail }: { msg: CommMessage; showTail: boolean }) {
  const isBot = msg.is_from_bot;
  const time = format(new Date(msg.created_at), 'HH:mm');
  const hasMedia = !!msg.media_url && !msg.media_url?.match(/^[a-f0-9]+$/i);
  const hasContent = !!msg.message_text && msg.message_text !== '[Imagen]';

  return (
    <div className={cn('flex flex-col max-w-[82%] gap-0.5 group', isBot ? 'ml-auto items-end' : 'mr-auto items-start')}>
      <div className={cn(
        'relative px-3 py-2 text-[13px] leading-[1.35] shadow-sm',
        isBot
          ? cn('bg-chart-4 text-chart-4-foreground', showTail ? 'rounded-[18px] rounded-br-[4px]' : 'rounded-[18px]')
          : cn('bg-muted/70 text-foreground border border-border/20', showTail ? 'rounded-[18px] rounded-bl-[4px]' : 'rounded-[18px]')
      )}>
        {hasMedia && (
          <img src={msg.media_url!} alt="media" className="max-w-[220px] max-h-48 rounded-xl object-cover" loading="lazy" />
        )}
        {hasContent && <span className={cn(hasMedia && 'block mt-1.5')}>{msg.message_text}</span>}
        {!hasContent && !hasMedia && msg.message_text && (
          <span className="italic text-muted-foreground/50 text-xs">{msg.message_text}</span>
        )}
      </div>
      <div className={cn('flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity', showTail && 'opacity-100')}>
        <span className="text-[9px] text-muted-foreground/50 tabular-nums">{time}</span>
        {isBot && <DeliveryTicks status={msg.delivery_status} />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════ */

export const PlanningCustodioComm: React.FC<PlanningCustodioCommProps> = ({
  servicioId, custodioName, custodioTelefono, folioServicio, isHandedOff,
}) => {
  const { messages, messagesLoading, unreadCount, markAsRead } = useServicioComm(servicioId, 'custodio_planeacion');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  // Mark as read on mount
  useEffect(() => {
    if (unreadCount > 0) markAsRead();
  }, [unreadCount, markAsRead]);

  const handleSend = async (text: string) => {
    if (!custodioTelefono) { toast.error('Sin número de teléfono del custodio'); return; }
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.functions.invoke('kapso-send-message', {
        body: {
          to: custodioTelefono,
          type: 'text',
          text,
          sent_by_user_id: user?.id || null,
          context: { servicio_id: servicioId, comm_channel: 'custodio_planeacion' },
        },
      });
      if (error) throw error;
      setDraft('');
      toast.success('Mensaje enviado');
    } catch { toast.error('Error al enviar mensaje'); }
    finally { setSending(false); }
  };

  const handleQuickAction = (text: string) => handleSend(text);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; msgs: CommMessage[] }[] = [];
    let cur = '';
    messages.forEach(m => {
      const d = format(new Date(m.created_at), 'yyyy-MM-dd');
      if (d !== cur) { cur = d; groups.push({ date: d, msgs: [m] }); }
      else groups[groups.length - 1].msgs.push(m);
    });
    return groups;
  }, [messages]);

  if (messagesLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <div className="h-8 w-8 rounded-full border-2 border-chart-4/30 border-t-chart-4 animate-spin" />
        <p className="text-xs">Cargando conversación…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-xl border-border/30 bg-background/80">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-chart-4/10 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-chart-4" />
          </div>
          <div>
            <p className="text-xs font-medium">{custodioName}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{folioServicio}</p>
          </div>
        </div>
        {isHandedOff && (
          <Badge variant="outline" className="text-[9px] gap-1 border-chart-2/30 text-chart-2">
            <Lock className="h-2.5 w-2.5" /> Transferido a C4
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1" style={{ overscrollBehavior: 'contain' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-6">
            <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-xs text-center">Sin mensajes de posicionamiento</p>
            {!isHandedOff && custodioTelefono && (
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-full px-3"
                onClick={() => handleQuickAction('¿Ya estás en posición?')}>
                <MapPin className="h-3 w-3" /> Preguntar posición
              </Button>
            )}
          </div>
        ) : (
          grouped.map(({ date, msgs }) => (
            <React.Fragment key={date}>
              <DateSeparator date={new Date(date)} />
              {msgs.map((msg, i) => {
                const isLast = i === msgs.length - 1;
                const nextDiff = isLast || msgs[i + 1].is_from_bot !== msg.is_from_bot;
                return <Bubble key={msg.id} msg={msg} showTail={nextDiff} />;
              })}
            </React.Fragment>
          ))
        )}
      </div>

      {/* Quick actions + input (disabled if handed off) */}
      {!isHandedOff ? (
        <div className="border-t border-border/20">
          {/* Quick actions */}
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto">
            <Button variant="outline" size="sm"
              className="h-7 text-[10px] gap-1 px-2.5 rounded-full whitespace-nowrap shrink-0 border-chart-4/30 text-chart-4 hover:bg-chart-4/10"
              onClick={() => handleQuickAction('¿Ya estás en posición?')} disabled={sending || !custodioTelefono}>
              <MapPin className="h-3 w-3" /> ¿En posición?
            </Button>
            <Button variant="outline" size="sm"
              className="h-7 text-[10px] gap-1 px-2.5 rounded-full whitespace-nowrap shrink-0"
              onClick={() => handleQuickAction('Envía foto del punto por favor 📸')} disabled={sending || !custodioTelefono}>
              <Camera className="h-3 w-3" /> Pedir foto
            </Button>
            <Button variant="outline" size="sm"
              className="h-7 text-[10px] gap-1 px-2.5 rounded-full whitespace-nowrap shrink-0"
              onClick={() => handleQuickAction('Recibido, gracias 👍')} disabled={sending || !custodioTelefono}>
              👍 Recibido
            </Button>
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-1">
            <div className="flex items-end gap-2">
              <div className="flex-1 flex items-end rounded-full bg-muted/40 border border-border/30 px-3 py-1 focus-within:border-chart-4/40">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && draft.trim() && handleSend(draft.trim())}
                  placeholder="Mensaje…"
                  className="flex-1 bg-transparent border-0 outline-none text-xs py-1 placeholder:text-muted-foreground/50"
                  disabled={!custodioTelefono}
                />
              </div>
              <button
                onClick={() => draft.trim() && handleSend(draft.trim())}
                disabled={!draft.trim() || sending || !custodioTelefono}
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all',
                  draft.trim() ? 'bg-chart-4 text-chart-4-foreground scale-100' : 'bg-muted/40 text-muted-foreground/30 scale-90'
                )}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-border/20 flex items-center justify-center gap-2 text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          <span className="text-[11px]">Comunicación transferida a Monitoreo</span>
        </div>
      )}
    </div>
  );
};
