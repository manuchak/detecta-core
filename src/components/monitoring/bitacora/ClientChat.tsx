import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Send, Clock, Check, CheckCheck, MessageSquare,
  ArrowUp, Zap, User, AlertCircle, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServicioComm } from '@/hooks/useServicioComm';
import type { CommMessage, CommMedia } from '@/hooks/useServicioComm';
import { useClientesContactos } from '@/pages/Facturacion/hooks/useClientesContactos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isToday, isYesterday, differenceInHours, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { normalizePhone } from '@/lib/phoneUtils';

interface ClientChatProps {
  servicioId: string;
  clienteName: string;
  folioServicio: string;
  custodioName: string;
  clienteId?: string | null;
  contactoWhatsapp?: string | null;
  media: CommMedia[];
  onValidateMedia?: (mediaId: string) => void;
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

/* ── 24h window countdown ── */
function WindowPill({ lastClientMsg }: { lastClientMsg: Date | null }) {
  const [, setTick] = useState(0);

  // Refresh every minute
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!lastClientMsg) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
        <AlertCircle className="h-3 w-3" />
        <span className="text-[9px] font-medium">Solo templates — sin ventana activa</span>
      </div>
    );
  }

  const hoursLeft = 24 - differenceInHours(new Date(), lastClientMsg);
  const minsTotal = 24 * 60 - differenceInMinutes(new Date(), lastClientMsg);

  if (hoursLeft <= 0) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
        <AlertCircle className="h-3 w-3" />
        <span className="text-[9px] font-medium">Ventana expirada — solo templates</span>
      </div>
    );
  }

  const h = Math.floor(minsTotal / 60);
  const m = minsTotal % 60;

  return (
    <div className={cn(
      'flex items-center gap-1 px-2 py-1 rounded-full border text-[9px] font-medium',
      hoursLeft > 8
        ? 'bg-chart-2/10 border-chart-2/20 text-chart-2'
        : hoursLeft > 2
          ? 'bg-chart-5/10 border-chart-5/20 text-chart-5'
          : 'bg-destructive/10 border-destructive/20 text-destructive animate-pulse'
    )}>
      <Timer className="h-3 w-3" />
      <span>Ventana: {h}h {m}m</span>
    </div>
  );
}

/* ── Message bubble ── */
function ClientBubble({ msg, showTail }: { msg: CommMessage; showTail: boolean }) {
  const isBot = msg.is_from_bot;
  const isClient = msg.sender_type === 'cliente';
  const time = format(new Date(msg.created_at), 'HH:mm');
  const hasMedia = !!msg.media_url && !msg.media_url?.match(/^[a-f0-9]+$/i);
  const hasContent = !!msg.message_text && msg.message_text !== '[Imagen]';

  return (
    <div className={cn('flex flex-col max-w-[82%] gap-0.5 group', isBot ? 'ml-auto items-end' : 'mr-auto items-start')}>
      {/* Sender label for client messages */}
      {isClient && showTail && (
        <span className="text-[9px] font-medium text-chart-2/70 px-2 mb-0.5 flex items-center gap-1">
          <User className="h-2.5 w-2.5" /> Cliente
        </span>
      )}

      <div className={cn(
        'relative px-3 py-2 text-[13px] leading-[1.35] shadow-sm',
        isBot
          ? cn('bg-primary text-primary-foreground', showTail ? 'rounded-[18px] rounded-br-[4px]' : 'rounded-[18px]')
          : cn('bg-chart-2/10 text-foreground border border-chart-2/20', showTail ? 'rounded-[18px] rounded-bl-[4px]' : 'rounded-[18px]')
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

export const ClientChat: React.FC<ClientChatProps> = ({
  servicioId, clienteName, folioServicio, custodioName,
  clienteId, contactoWhatsapp, media, onValidateMedia,
}) => {
  const { messages, messagesLoading, markAsRead } = useServicioComm(servicioId, 'cliente_c4');
  const { data: contactos = [] } = useClientesContactos(clienteId || undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string>(contactoWhatsapp || '');

  // Build contact list: service phone + pc_clientes_contactos
  const allContacts = useMemo(() => {
    const list: { phone: string; label: string; isPrimary: boolean }[] = [];
    const seen = new Set<string>();

    if (contactoWhatsapp) {
      const norm = normalizePhone(contactoWhatsapp);
      seen.add(norm);
      list.push({ phone: contactoWhatsapp, label: 'Teléfono del servicio', isPrimary: true });
    }

    contactos.forEach(c => {
      if (!c.telefono) return;
      const norm = normalizePhone(c.telefono);
      if (seen.has(norm)) return;
      seen.add(norm);
      list.push({
        phone: c.telefono,
        label: `${c.nombre || 'Contacto'} (${c.rol})`,
        isPrimary: c.principal,
      });
    });

    return list;
  }, [contactoWhatsapp, contactos]);

  // Set default contact
  useEffect(() => {
    if (!selectedContact && allContacts.length > 0) {
      setSelectedContact(allContacts[0].phone);
    }
  }, [allContacts, selectedContact]);

  // Calculate 24h window
  const lastClientMessage = useMemo(() => {
    const clientMsgs = messages.filter(m => m.sender_type === 'cliente');
    if (clientMsgs.length === 0) return null;
    return new Date(clientMsgs[clientMsgs.length - 1].created_at);
  }, [messages]);

  const windowOpen = useMemo(() => {
    if (!lastClientMessage) return false;
    return differenceInHours(new Date(), lastClientMessage) < 24;
  }, [lastClientMessage]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  // Mark as read
  useEffect(() => {
    const unread = messages.filter(m => !m.is_read && m.sender_type === 'cliente').length;
    if (unread > 0) markAsRead();
  }, [messages, markAsRead]);

  const handleSendMessage = async (text: string) => {
    if (!selectedContact) { toast.error('Selecciona un contacto'); return; }
    if (!windowOpen) { toast.error('Ventana 24h cerrada — usa un template'); return; }
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.functions.invoke('kapso-send-message', {
        body: {
          to: selectedContact,
          type: 'text',
          text,
          sent_by_user_id: user?.id || null,
          context: { servicio_id: servicioId, comm_channel: 'cliente_c4' },
        },
      });
      if (error) throw error;
      setDraft('');
      toast.success('Mensaje enviado al cliente');
    } catch { toast.error('Error al enviar mensaje'); }
    finally { setSending(false); }
  };

  const handleSendTemplate = async (templateName: string) => {
    if (!selectedContact) { toast.error('Selecciona un contacto'); return; }
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.functions.invoke('kapso-send-template', {
        body: {
          to: selectedContact,
          templateName,
          languageCode: 'es_MX',
          sent_by_user_id: user?.id || null,
          components: {
            body: {
              parameters: [
                { type: 'text', text: clienteName },
                { type: 'text', text: folioServicio },
                { type: 'text', text: 'en curso' },
                { type: 'text', text: custodioName },
              ],
            },
          },
          context: { servicio_id: servicioId, comm_channel: 'cliente_c4' },
        },
      });
      if (error) throw error;
      toast.success('Template enviado al cliente');
    } catch { toast.error('Error al enviar template'); }
    finally { setSending(false); }
  };

  // Group messages by date
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

  const clientUnread = messages.filter(m => !m.is_read && m.sender_type === 'cliente').length;

  if (messagesLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground px-6">
        <div className="h-8 w-8 rounded-full border-2 border-chart-2/30 border-t-chart-2 animate-spin" />
        <p className="text-xs">Cargando chat del cliente…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Contact selector + 24h window ── */}
      <div className="px-4 py-3 space-y-2 border-b border-border/20">
        {allContacts.length > 1 ? (
          <Select value={selectedContact} onValueChange={setSelectedContact}>
            <SelectTrigger className="h-8 text-xs rounded-lg">
              <SelectValue placeholder="Seleccionar contacto" />
            </SelectTrigger>
            <SelectContent>
              {allContacts.map(c => (
                <SelectItem key={c.phone} value={c.phone} className="text-xs">
                  {c.label} — {c.phone}
                  {c.isPrimary && ' ★'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : allContacts.length === 1 ? (
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/30 border border-border/20">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] truncate">{allContacts[0].label} — {allContacts[0].phone}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-destructive/5 border border-destructive/20">
            <AlertCircle className="h-3 w-3 text-destructive" />
            <span className="text-[11px] text-destructive">Sin número de contacto del cliente</span>
          </div>
        )}

        <WindowPill lastClientMsg={lastClientMessage} />
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1" style={{ overscrollBehavior: 'contain' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-6">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs text-foreground/60">Sin mensajes con el cliente</p>
              <p className="text-[10px]">Envía un reporte para iniciar la conversación</p>
            </div>
            {selectedContact && (
              <Button variant="outline" size="sm"
                className="h-8 text-xs gap-1.5 rounded-full px-4 mt-2 border-chart-2/30 text-chart-2 hover:bg-chart-2/10"
                onClick={() => handleSendTemplate('reporte_servicio_cliente')}
                disabled={sending}>
                <Send className="h-3.5 w-3.5" /> Enviar reporte
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
                return <ClientBubble key={msg.id} msg={msg} showTail={nextDiff} />;
              })}
            </React.Fragment>
          ))
        )}
      </div>

      {/* ── Composer ── */}
      <div className="border-t border-border/20">
        {/* Template quick actions */}
        <div className="px-3 py-2 flex gap-1.5 overflow-x-auto">
          <Button variant="outline" size="sm"
            className="h-7 text-[10px] gap-1 px-2.5 rounded-full whitespace-nowrap shrink-0 border-chart-2/30 text-chart-2 hover:bg-chart-2/10"
            onClick={() => handleSendTemplate('reporte_servicio_cliente')}
            disabled={sending || !selectedContact}>
            <Send className="h-3 w-3" /> Reporte
          </Button>
          <Button variant="outline" size="sm"
            className="h-7 text-[10px] gap-1 px-2.5 rounded-full whitespace-nowrap shrink-0"
            onClick={() => handleSendTemplate('cierre_servicio_cliente')}
            disabled={sending || !selectedContact}>
            <Check className="h-3 w-3" /> Cierre
          </Button>
        </div>

        {/* Free text input (only when window is open) */}
        <div className="px-3 pb-3 pt-1">
          <div className="flex items-end gap-2">
            <div className={cn(
              'flex-1 flex items-end rounded-full px-3 py-1 border transition-colors',
              windowOpen
                ? 'bg-muted/40 border-border/30 focus-within:border-chart-2/40'
                : 'bg-muted/20 border-border/20 opacity-60'
            )}>
              <input
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && draft.trim() && handleSendMessage(draft.trim())}
                placeholder={windowOpen ? 'Mensaje al cliente…' : 'Ventana cerrada — usa templates'}
                className="flex-1 bg-transparent border-0 outline-none text-xs py-1 placeholder:text-muted-foreground/50"
                disabled={!windowOpen || !selectedContact}
              />
            </div>
            <button
              onClick={() => draft.trim() && handleSendMessage(draft.trim())}
              disabled={!draft.trim() || sending || !windowOpen || !selectedContact}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all',
                draft.trim() && windowOpen ? 'bg-chart-2 text-white scale-100' : 'bg-muted/40 text-muted-foreground/30 scale-90'
              )}
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
