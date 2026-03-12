import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, FileText, Shield, User, MapPin, AlertTriangle } from 'lucide-react';
import { CustodioChat } from './CustodioChat';
import { ClientChat } from './ClientChat';
import { useServicioComm } from '@/hooks/useServicioComm';
import { useWhatsAppMode } from '@/hooks/useWhatsAppMode';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { BoardService } from '@/hooks/useBitacoraBoard';
import { cn } from '@/lib/utils';

interface ServiceCommSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: BoardService | null;
}

type CommTab = 'chat' | 'client';

export const ServiceCommSheet: React.FC<ServiceCommSheetProps> = ({
  open, onOpenChange, service,
}) => {
  const servicioId = service?.id || null;
  const [activeTab, setActiveTab] = useState<CommTab>('chat');

  // Custodio channel messages
  const { messages, media, messagesLoading, mediaLoading, unreadCount, markAsRead, validateMedia } = useServicioComm(servicioId, 'custodio_c4');

  // Client channel unread count
  const { messages: clientMessages } = useServicioComm(servicioId, 'cliente_c4');
  const clientUnread = clientMessages.filter(m => !m.is_read && m.sender_type === 'cliente').length;

  // Mark as read when sheet opens
  useEffect(() => {
    if (open && unreadCount > 0 && activeTab === 'chat') {
      markAsRead();
    }
  }, [open, unreadCount, markAsRead, activeTab]);

  // Reset tab on close
  useEffect(() => {
    if (!open) setActiveTab('chat');
  }, [open]);

  const handleSendNudge = async () => {
    if (!service) return;
    if (!service.custodio_telefono) {
      toast.error('No hay número de teléfono registrado para este custodio');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.functions.invoke('kapso-send-template', {
        body: {
          to: service.custodio_telefono,
          templateName: 'nudge_status_custodio',
          languageCode: 'es_MX',
          sent_by_user_id: user?.id || null,
          components: {
            body: {
              parameters: [
                { type: 'text', text: service.custodio_asignado || 'Custodio' },
                { type: 'text', text: service.id_servicio },
              ],
            },
          },
          context: {
            servicio_id: service.id,
            comm_channel: 'custodio_c4',
          },
        },
      });
      if (error) throw error;
      toast.success('Solicitud de status enviada al custodio');
    } catch (err) {
      toast.error('Error al enviar solicitud de status');
      console.error(err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!service) return;
    if (!service.custodio_telefono) {
      toast.error('No hay número de teléfono registrado para este custodio');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.functions.invoke('kapso-send-message', {
        body: {
          to: service.custodio_telefono,
          type: 'text',
          text: text,
          sent_by_user_id: user?.id || null,
          context: {
            servicio_id: service.id,
            comm_channel: 'custodio_c4',
          },
        },
      });
      if (error) throw error;
      toast.success('Mensaje enviado');
    } catch (err) {
      toast.error('Error al enviar mensaje');
      console.error(err);
    }
  };

  if (!service) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[440px] p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l border-border/40">
        
        {/* ── Header with service context ── */}
        <div className="px-5 pt-5 pb-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="apple-text-headline text-sm truncate">{service.nombre_cliente}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="apple-text-caption text-[10px] font-mono">{service.id_servicio}</span>
                <span className="text-muted-foreground/30">·</span>
                <div className="flex items-center gap-0.5 text-muted-foreground">
                  <User className="h-2.5 w-2.5" />
                  <span className="apple-text-caption text-[10px] truncate">{service.custodio_asignado || 'Sin custodio'}</span>
                </div>
                {service.requiere_armado && <Shield className="h-2.5 w-2.5 text-chart-4" />}
              </div>
            </div>
          </div>

          {/* Route pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border/30">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="apple-text-caption text-[10px] truncate">
              {service.origen} → {service.destino}
            </span>
          </div>

          {/* Tab switcher */}
          <div className="flex p-0.5 rounded-xl bg-muted/60 border border-border/30">
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-medium transition-all duration-200',
                activeTab === 'chat'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground/70'
              )}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Custodio
              {unreadCount > 0 && (
                <span className="min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-semibold flex items-center justify-center px-1 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-medium transition-all duration-200',
                activeTab === 'client'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground/70'
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Cliente
              {clientUnread > 0 && (
                <span className="min-w-[16px] h-4 rounded-full bg-chart-2 text-white text-[9px] font-semibold flex items-center justify-center px-1 animate-pulse">
                  {clientUnread}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-border/30" />

        {/* ── Content area ── */}
        <div className="flex-1 min-h-0 flex flex-col">
          <MonitoreoContent
            activeTab={activeTab}
            service={service}
            messages={messages}
            messagesLoading={messagesLoading}
            media={media}
            handleSendNudge={handleSendNudge}
            handleSendMessage={handleSendMessage}
            validateMedia={validateMedia}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
