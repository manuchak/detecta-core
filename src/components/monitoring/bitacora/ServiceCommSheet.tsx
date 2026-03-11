import React, { useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, FileText } from 'lucide-react';
import { CustodioChat } from './CustodioChat';
import { ClientReportComposer } from './ClientReportComposer';
import { useServicioComm } from '@/hooks/useServicioComm';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { BoardService } from '@/hooks/useBitacoraBoard';

interface ServiceCommSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: BoardService | null;
}

export const ServiceCommSheet: React.FC<ServiceCommSheetProps> = ({
  open, onOpenChange, service,
}) => {
  const servicioId = service?.id || null;
  const { messages, media, messagesLoading, mediaLoading, unreadCount, markAsRead, validateMedia } = useServicioComm(servicioId);

  // Mark as read when sheet opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      markAsRead();
    }
  }, [open, unreadCount, markAsRead]);

  const handleSendNudge = async () => {
    if (!service) return;
    try {
      // Use kapso-send-template to send nudge
      const { error } = await supabase.functions.invoke('kapso-send-template', {
        body: {
          phone: service.custodio_asignado, // Will need phone lookup
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
      // Use kapso-send-message to send free text
      const { error } = await supabase.functions.invoke('kapso-send-message', {
        body: {
          phone: service.custodio_asignado, // Will need phone lookup
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

      // Mark selected media as sent to client
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:max-w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/30">
          <SheetTitle className="text-sm font-medium flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            Comunicaciones
            <span className="text-xs text-muted-foreground font-normal">· {service.id_servicio}</span>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-3 mt-2 h-9">
            <TabsTrigger value="chat" className="text-xs gap-1.5 flex-1">
              <MessageCircle className="h-3 w-3" />
              Custodio
              {unreadCount > 0 && (
                <Badge className="text-[8px] px-1 py-0 min-w-[14px] h-3.5 bg-destructive text-destructive-foreground border-0">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="report" className="text-xs gap-1.5 flex-1">
              <FileText className="h-3 w-3" />
              Reportar a Cliente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
            <CustodioChat
              messages={messages}
              isLoading={messagesLoading}
              custodioName={service.custodio_asignado || 'Sin custodio'}
              onSendNudge={handleSendNudge}
              onSendMessage={handleSendMessage}
            />
          </TabsContent>

          <TabsContent value="report" className="flex-1 min-h-0 mt-0">
            <ClientReportComposer
              servicioId={service.id}
              clienteName={service.nombre_cliente}
              folioServicio={service.id_servicio}
              custodioName={service.custodio_asignado || 'Sin custodio'}
              media={media}
              onSendReport={handleSendReport}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
