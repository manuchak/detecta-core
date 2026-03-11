import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Send, ImageIcon, Phone, CheckCircle2, FileText,
  ArrowUpRight, Shield, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { CommMedia } from '@/hooks/useServicioComm';
import { format } from 'date-fns';

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
  onValidateMedia?: (mediaId: string) => void;
  isSending?: boolean;
}

export const ClientReportComposer: React.FC<ClientReportComposerProps> = ({
  servicioId, clienteName, folioServicio, custodioName, media,
  contactoWhatsapp, onSendReport, onValidateMedia, isSending,
}) => {
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [observaciones, setObservaciones] = useState('');
  const [destinatario, setDestinatario] = useState(contactoWhatsapp || '');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const imageMedia = media.filter(m => m.media_type === 'image');
  const validatedCount = imageMedia.filter(m => m.validado).length;

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
    const { data } = supabase.storage.from('whatsapp-media').getPublicUrl(path);
    return data?.publicUrl || `https://yydzzeljaewsfhmilnhm.supabase.co/storage/v1/object/public/whatsapp-media/${path}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* ── Template Preview Card (WhatsApp bubble style) ── */}
        <div className="space-y-2">
          <p className="apple-text-caption text-[10px] uppercase tracking-widest px-1">Vista previa del mensaje</p>
          <div className="rounded-2xl bg-chart-2/5 border border-chart-2/20 p-4 space-y-2 relative overflow-hidden">
            {/* WhatsApp green accent line */}
            <div className="absolute top-0 left-0 w-1 h-full bg-chart-2/40 rounded-r" />
            <div className="pl-2 space-y-1.5">
              <p className="text-[12px] leading-relaxed text-foreground">
                Estimado <span className="font-semibold">{clienteName}</span>,
              </p>
              <p className="text-[12px] leading-relaxed text-foreground">
                Le informamos que el servicio{' '}
                <span className="font-mono font-semibold text-primary">{folioServicio}</span>{' '}
                se encuentra <span className="font-semibold text-chart-2">en curso</span>.
              </p>
              {observaciones && (
                <p className="text-[12px] leading-relaxed text-foreground">
                  Observaciones: <span className="italic">{observaciones}</span>
                </p>
              )}
              <p className="text-[12px] leading-relaxed text-foreground">
                Custodio: <span className="font-medium">{custodioName}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">— Equipo Detecta 🛡️</p>
            </div>
            <div className="absolute bottom-2 right-3 flex items-center gap-1">
              <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                {format(new Date(), 'HH:mm')}
              </span>
            </div>
          </div>
        </div>

        {/* ── Photo Gallery ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="apple-text-callout text-xs">Fotos del custodio</span>
            </div>
            <div className="flex items-center gap-1.5">
              {validatedCount > 0 && (
                <Badge className="text-[8px] px-1.5 py-0 bg-chart-2/10 text-chart-2 border-chart-2/20 gap-0.5">
                  <CheckCircle2 className="h-2 w-2" />
                  {validatedCount} validadas
                </Badge>
              )}
              {selectedMedia.size > 0 && (
                <Badge className="text-[8px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                  {selectedMedia.size} seleccionadas
                </Badge>
              )}
            </div>
          </div>

          {imageMedia.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/40 p-8 flex flex-col items-center gap-2 text-muted-foreground bg-muted/20">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
              </div>
              <p className="apple-text-footnote text-center">
                Las fotos enviadas por el custodio<br />aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {imageMedia.map((m) => {
                const url = getPublicUrl(m.storage_path);
                const isSelected = selectedMedia.has(m.id);

                return (
                  <div key={m.id} className="relative group">
                    <button
                      onClick={() => toggleMedia(m.id)}
                      className={cn(
                        'relative w-full aspect-square rounded-xl overflow-hidden transition-all duration-200 apple-press-scale',
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-[0.97]'
                          : 'hover:opacity-90'
                      )}
                    >
                      <img
                        src={url}
                        alt="media"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Overlay gradient */}
                      <div className={cn(
                        'absolute inset-0 transition-colors duration-200',
                        isSelected ? 'bg-primary/15' : 'bg-transparent'
                      )} />

                      {/* Selection indicator */}
                      <div className={cn(
                        'absolute top-1.5 right-1.5 h-5 w-5 rounded-full flex items-center justify-center transition-all duration-200',
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-lg scale-100'
                          : 'bg-black/30 backdrop-blur-sm border border-white/40 scale-90'
                      )}>
                        {isSelected && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Validation badge */}
                      {m.validado && (
                        <div className="absolute bottom-1.5 left-1.5">
                          <div className="flex items-center gap-0.5 bg-chart-2/90 text-white rounded-full px-1.5 py-0.5">
                            <CheckCircle2 className="h-2 w-2" />
                            <span className="text-[7px] font-medium">OK</span>
                          </div>
                        </div>
                      )}

                      {/* Sent to client indicator */}
                      {m.enviado_a_cliente && (
                        <div className="absolute bottom-1.5 right-1.5">
                          <div className="flex items-center gap-0.5 bg-chart-1/90 text-white rounded-full px-1.5 py-0.5">
                            <ArrowUpRight className="h-2 w-2" />
                            <span className="text-[7px] font-medium">Enviada</span>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Long-press to preview */}
                    <button
                      onClick={() => setLightboxUrl(url)}
                      className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </button>

                    {/* Validate button for non-validated */}
                    {!m.validado && onValidateMedia && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onValidateMedia(m.id); }}
                        className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-background/90 backdrop-blur-sm border border-border/50 rounded-full px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity apple-press-scale"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5 text-chart-2" />
                        <span className="text-[7px] font-medium text-foreground">Validar</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Observaciones ── */}
        <div className="space-y-2">
          <label className="apple-text-callout text-xs px-1">Observaciones</label>
          <Textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas adicionales para el reporte…"
            className="min-h-[70px] text-xs resize-none rounded-xl border-border/30 bg-muted/30 focus:bg-muted/50 transition-colors placeholder:text-muted-foreground/40"
          />
        </div>

        {/* ── Destinatario ── */}
        <div className="space-y-2">
          <label className="apple-text-callout text-xs flex items-center gap-1.5 px-1">
            <Phone className="h-3 w-3 text-chart-2" />
            Contacto WhatsApp del cliente
          </label>
          <Input
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            placeholder="+52 55 1234 5678"
            className="h-9 text-xs font-mono rounded-xl border-border/30 bg-muted/30 focus:bg-muted/50 transition-colors"
          />
        </div>
      </div>

      {/* ── Send button (fixed footer) ── */}
      <div className="px-4 pb-4 pt-3 border-t border-border/20">
        <Button
          className={cn(
            'w-full h-11 gap-2 text-xs font-semibold rounded-xl transition-all duration-200 apple-press-scale',
            destinatario.trim()
              ? 'bg-chart-2 hover:bg-chart-2/90 text-white shadow-lg shadow-chart-2/20'
              : ''
          )}
          onClick={handleSend}
          disabled={!destinatario.trim() || isSending}
        >
          <Send className="h-4 w-4" />
          Enviar Reporte al Cliente
          {selectedMedia.size > 0 && (
            <Badge className="text-[8px] px-1.5 py-0 bg-white/20 text-white border-white/30">
              +{selectedMedia.size} fotos
            </Badge>
          )}
        </Button>
      </div>

      {/* ── Lightbox ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="preview"
            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-200"
          />
        </div>
      )}
    </div>
  );
};
