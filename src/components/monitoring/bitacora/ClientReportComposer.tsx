import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, ImageIcon, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommMedia } from '@/hooks/useServicioComm';

interface ClientReportComposerProps {
  servicioId: string;
  clienteName: string;
  folioServicio: string;
  custodioName: string;
  media: CommMedia[];
  contactoWhatsapp?: string | null;
  onSendReport: (data: {
    selectedMediaIds: string[];
    observaciones: string;
    destinatario: string;
  }) => void;
  isSending?: boolean;
}

export const ClientReportComposer: React.FC<ClientReportComposerProps> = ({
  servicioId, clienteName, folioServicio, custodioName, media,
  contactoWhatsapp, onSendReport, isSending,
}) => {
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [observaciones, setObservaciones] = useState('');
  const [destinatario, setDestinatario] = useState(contactoWhatsapp || '');

  const validatedMedia = media.filter(m => m.media_type === 'image');

  const toggleMedia = (id: string) => {
    setSelectedMedia(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = () => {
    if (!destinatario.trim()) return;
    onSendReport({
      selectedMediaIds: Array.from(selectedMedia),
      observaciones,
      destinatario: destinatario.trim(),
    });
  };

  const getPublicUrl = (path: string) => {
    const { data } = (window as any).__supabase?.storage?.from('whatsapp-media')?.getPublicUrl(path) ?? {};
    // Fallback: construct URL manually
    return data?.publicUrl || `https://yydzzeljaewsfhmilnhm.supabase.co/storage/v1/object/public/whatsapp-media/${path}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Template preview */}
        <div className="rounded-xl bg-muted/50 border border-border/50 p-3 space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Template: Reporte de Servicio</p>
          <div className="text-xs text-foreground space-y-1">
            <p>Estimado <span className="font-medium">{clienteName}</span>,</p>
            <p>Le informamos que el servicio <span className="font-mono text-primary">{folioServicio}</span> se encuentra en curso.</p>
            <p>Custodio: <span className="font-medium">{custodioName}</span></p>
          </div>
        </div>

        {/* Photo gallery */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Fotos del custodio</span>
            {selectedMedia.size > 0 && (
              <Badge className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                {selectedMedia.size} seleccionadas
              </Badge>
            )}
          </div>

          {validatedMedia.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/50 p-4 flex flex-col items-center gap-1 text-muted-foreground">
              <ImageIcon className="h-6 w-6 opacity-30" />
              <p className="text-[10px]">Sin fotos disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {validatedMedia.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleMedia(m.id)}
                  className={cn(
                    'relative rounded-lg overflow-hidden aspect-square border-2 transition-all',
                    selectedMedia.has(m.id)
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-transparent hover:border-border'
                  )}
                >
                  <img
                    src={getPublicUrl(m.storage_path)}
                    alt="media"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className={cn(
                    'absolute top-1 right-1 h-4 w-4 rounded-full flex items-center justify-center transition-all',
                    selectedMedia.has(m.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background/80 border border-border'
                  )}>
                    {selectedMedia.has(m.id) && (
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Observaciones */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Observaciones</label>
          <Textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas adicionales para el cliente…"
            className="min-h-[60px] text-xs resize-none"
          />
        </div>

        {/* Destinatario */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium flex items-center gap-1">
            <Phone className="h-3 w-3" />
            Destinatario WhatsApp
          </label>
          <Input
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            placeholder="+52 55 1234 5678"
            className="h-8 text-xs font-mono"
          />
        </div>
      </div>

      {/* Send button */}
      <div className="px-3 pb-3 pt-2 border-t border-border/30">
        <Button
          className="w-full h-9 gap-1.5 text-xs"
          onClick={handleSend}
          disabled={!destinatario.trim() || isSending}
        >
          <Send className="h-3.5 w-3.5" />
          Enviar Reporte al Cliente
        </Button>
      </div>
    </div>
  );
};
