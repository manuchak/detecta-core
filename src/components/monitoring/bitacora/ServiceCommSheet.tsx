import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, FileText, Shield, User, MapPin } from 'lucide-react';
import { CustodioChat } from './CustodioChat';
import { ClientReportComposer } from './ClientReportComposer';
import { useServicioComm } from '@/hooks/useServicioComm';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { BoardService } from '@/hooks/useBitacoraBoard';
import { cn } from '@/lib/utils';

interface ServiceCommSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: BoardService | null;
}

type CommTab = 'chat' | 'report';

export const ServiceCommSheet: React.FC<ServiceCommSheetProps> = ({
  open, onOpenChange, service,
}) => {
  const servicioId = service?.id || null;
  const [activeTab, setActiveTab] = useState<CommTab>('chat');
  const { messages, media, messagesLoading, mediaLoading, unreadCount, markAsRead, validateMedia } = useServicioComm(servicioId);

  // Mark as read when sheet opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      markAsRead();
    }
  }, [open, unreadCount, markAsRead]);

  // Reset tab on close
  useEffect(() => {
    if (!open) setActiveTab('chat');
  }, [open]);

  const handleSendNudge = async () => {
    if (!service) return;
    try {
      const { error } = await supabase.functions.invoke('kapso-send-template', {
        body: {
          phone: service.custodio_asignado,
          template_name: 'nudge_status_custodio',
          language_code: 'es_MX',
          components: [
            { type: 'body', parameters: [
              { type: 'text', text: service.custodio_asignado || 'Custodio' },
              { type: 'text', text: service.id_servicio },
            ]},
          ],
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
    try {
      const { error } = await supabase.functions.invoke('kapso-send-message', {
        body: {
          phone: service.custodio_asignado,
          message: text,
        },
      });
      if (error) throw error;
      toast.success('Mensaje enviado');
    } catch (err) {
      toast.error('Error al enviar mensaje');
      console.error(err);
    }
  };

  const handleSendReport = async (data: {
    selectedMediaIds: string[];
    observaciones: string;
    destinatario: string;
  }) => {
    if (!service) return;
    try {
      const { error } = await supabase.functions.invoke('kapso-send-template', {
        body: {
          phone: data.destinatario,
          template_name: 'reporte_servicio_cliente',
          language_code: 'es_MX',
          components: [
            { type: 'body', parameters: [
              { type: 'text', text: service.nombre_cliente },
              { type: 'text', text: service.id_servicio },
              { type: 'text', text: 'en curso' },
              { type: 'text', text: data.observaciones || 'Sin observaciones' },
            ]},
          ],
        },
      });
      if (error) throw error;

      for (const mediaId of data.selectedMediaIds) {
        await supabase
          .from('servicio_comm_media')
          .update({ enviado_a_cliente: true, enviado_a_cliente_at: new Date().toISOString() })
          .eq('id', mediaId);
      }

      toast.success('Reporte enviado al cliente');
    } catch (err) {
      toast.error('Error al enviar reporte');
      console.error(err);
    }
  };

  if (!service) return null;

  const imageCount = media.filter(m => m.media_type?.startsWith('image') || m.media_type === 'image').length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[440px] p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l border-border/40">
        
        {/* ── Apple-style header with service context ── */}
        <div className="px-5 pt-5 pb-3 space-y-3">
          {/* Service info pill */}
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

          {/* Tab switcher — iOS segmented control style */}
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
              onClick={() => setActiveTab('report')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-medium transition-all duration-200',
                activeTab === 'report'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground/70'
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Cliente
              {imageCount > 0 && (
                <span className="min-w-[16px] h-4 rounded-full bg-chart-1/15 text-chart-1 text-[9px] font-medium flex items-center justify-center px-1">
                  {imageCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-border/30" />

        {/* ── Content area ── */}
        <div className="flex-1 min-h-0 flex flex-col">
          {activeTab === 'chat' ? (
            <CustodioChat
              messages={messages}
              isLoading={messagesLoading}
              custodioName={service.custodio_asignado || 'Sin custodio'}
              onSendNudge={handleSendNudge}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <ClientReportComposer
              servicioId={service.id}
              clienteName={service.nombre_cliente}
              folioServicio={service.id_servicio}
              custodioName={service.custodio_asignado || 'Sin custodio'}
              media={media}
              onSendReport={handleSendReport}
              onValidateMedia={validateMedia}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
