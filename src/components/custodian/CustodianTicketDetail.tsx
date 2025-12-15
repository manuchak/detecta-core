import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, Clock, Calendar, DollarSign, Truck,
  Send, Paperclip, Loader2, CheckCircle, AlertTriangle,
  User, Headphones, Bot, ImageIcon, X, Star
} from 'lucide-react';
import { CustodianTicket, TicketRespuesta, useCustodianTicketsEnhanced } from '@/hooks/useCustodianTicketsEnhanced';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import TicketResolvedCelebration from './TicketResolvedCelebration';
import CSATSurveyModal from './CSATSurveyModal';
import ResponseRatingButtons from './ResponseRatingButtons';

interface CustodianTicketDetailProps {
  ticket: CustodianTicket;
  custodianPhone: string;
  onBack: () => void;
}

const statusConfig = {
  abierto: { label: 'Abierto', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  en_progreso: { label: 'En Progreso', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  resuelto: { label: 'Resuelto', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  cerrado: { label: 'Cerrado', icon: X, color: 'bg-gray-100 text-gray-700' }
};

const autorIcons = {
  custodio: User,
  agente: Headphones,
  sistema: Bot
};

export const CustodianTicketDetail = ({ ticket, custodianPhone, onBack }: CustodianTicketDetailProps) => {
  const { 
    getTicketResponses, 
    addResponse, 
    submitCSATRating,
    rateResponse,
    getResponseRatings,
    markTicketAsSeen
  } = useCustodianTicketsEnhanced(custodianPhone);
  
  const [respuestas, setRespuestas] = useState<TicketRespuesta[]>([]);
  const [responseRatings, setResponseRatings] = useState<Map<string, boolean>>(new Map());
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  
  // CSAT state
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCSATModal, setShowCSATModal] = useState(false);
  const [hasSeenResolution, setHasSeenResolution] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const status = statusConfig[ticket.status];
  const StatusIcon = status.icon;
  
  const isSlaExpired = ticket.fecha_sla_resolucion && 
    isPast(new Date(ticket.fecha_sla_resolucion)) &&
    !['resuelto', 'cerrado'].includes(ticket.status);

  const canRespond = !['resuelto', 'cerrado'].includes(ticket.status);
  const needsCSAT = ticket.status === 'resuelto' && ticket.calificacion_csat === null;

  useEffect(() => {
    loadResponses();
    loadResponseRatings();
    
    // Check if should show celebration
    if (needsCSAT && !ticket.csat_visto_at && !hasSeenResolution) {
      setShowCelebration(true);
      markTicketAsSeen(ticket.id);
    }
  }, [ticket.id]);

  const loadResponses = async () => {
    setLoadingResponses(true);
    const data = await getTicketResponses(ticket.id);
    setRespuestas(data);
    setLoadingResponses(false);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const loadResponseRatings = async () => {
    const ratings = await getResponseRatings(ticket.id);
    setResponseRatings(ratings);
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    setHasSeenResolution(true);
    setShowCSATModal(true);
  };

  const handleCSATSubmit = async (rating: number, resolved: boolean, comment?: string) => {
    await submitCSATRating(ticket.id, rating, resolved, comment);
  };

  const handleRateResponse = async (respuestaId: string, helpful: boolean) => {
    await rateResponse(respuestaId, ticket.id, helpful);
    setResponseRatings(prev => new Map(prev).set(respuestaId, helpful));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && adjuntos.length === 0) return;
    
    setSending(true);
    const success = await addResponse(ticket.id, newMessage, adjuntos);
    if (success) {
      setNewMessage('');
      setAdjuntos([]);
      await loadResponses();
    }
    setSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + adjuntos.length > 3) return;
    setAdjuntos(prev => [...prev, ...files]);
  };

  const removeAdjunto = (index: number) => {
    setAdjuntos(prev => prev.filter((_, i) => i !== index));
  };

  // Show celebration overlay
  if (showCelebration) {
    return <TicketResolvedCelebration ticket={ticket} onComplete={handleCelebrationComplete} />;
  }

  return (
    <div className="space-y-4">
      {/* CSAT Modal */}
      <CSATSurveyModal
        open={showCSATModal}
        onClose={() => setShowCSATModal(false)}
        onSubmit={handleCSATSubmit}
        ticketNumber={ticket.ticket_number}
      />

      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono">
                  {ticket.ticket_number}
                </Badge>
                <Badge className={cn("flex items-center gap-1", status.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
                {isSlaExpired && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    SLA Vencido
                  </Badge>
                )}
              </div>
              
              <CardTitle className="text-lg">{ticket.subject}</CardTitle>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                </span>
                {ticket.categoria && (
                  <Badge variant="secondary">{ticket.categoria.nombre}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* CSAT reminder banner */}
          {needsCSAT && !showCSATModal && (
            <button
              onClick={() => setShowCSATModal(true)}
              className="w-full p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-left hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ¿Quedaste satisfecho?
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Toca aquí para calificar la resolución
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Already rated display */}
          {ticket.calificacion_csat !== null && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tu calificación:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={cn(
                        "w-4 h-4",
                        star <= (ticket.calificacion_csat || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm">
            {ticket.monto_reclamado && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">${ticket.monto_reclamado.toLocaleString()} MXN</span>
              </div>
            )}
            {ticket.servicio_id && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>Servicio: {ticket.servicio_id}</span>
              </div>
            )}
            {ticket.fecha_sla_resolucion && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Resolución estimada: {format(new Date(ticket.fecha_sla_resolucion), 'dd MMM, HH:mm', { locale: es })}
                </span>
              </div>
            )}
          </div>

          {/* Evidencias */}
          {ticket.evidencia_urls && ticket.evidencia_urls.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Evidencias adjuntas:</span>
              <div className="flex flex-wrap gap-2">
                {ticket.evidencia_urls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm">Archivo {idx + 1}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responses Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversación</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4" ref={scrollRef}>
            {loadingResponses ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : respuestas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay respuestas aún</p>
                <p className="text-sm">Pronto recibirás una respuesta del equipo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {respuestas.map(resp => {
                  const AutorIcon = autorIcons[resp.autor_tipo];
                  const isAgent = resp.autor_tipo === 'agente';
                  const existingRating = responseRatings.get(resp.id);
                  
                  return (
                    <div
                      key={resp.id}
                      className={cn(
                        "flex gap-3",
                        isAgent ? "flex-row" : "flex-row-reverse"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                        isAgent ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <AutorIcon className="h-4 w-4" />
                      </div>
                      
                      <div className={cn(
                        "flex-1 max-w-[80%] space-y-1",
                        isAgent ? "items-start" : "items-end"
                      )}>
                        <div className={cn(
                          "px-4 py-2 rounded-lg",
                          isAgent ? "bg-primary/10" : "bg-muted"
                        )}>
                          <p className="text-sm whitespace-pre-wrap">{resp.mensaje}</p>
                          
                          {resp.adjuntos_urls && resp.adjuntos_urls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {resp.adjuntos_urls.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-primary underline"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  Archivo {idx + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs text-muted-foreground">
                            {resp.autor_nombre || (isAgent ? 'Agente' : 'Tú')} • 
                            {formatDistanceToNow(new Date(resp.created_at), { addSuffix: true, locale: es })}
                          </span>
                          
                          {/* Rating buttons for agent responses */}
                          {isAgent && (
                            <ResponseRatingButtons
                              respuestaId={resp.id}
                              existingRating={existingRating}
                              onRate={handleRateResponse}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Reply Input */}
          {canRespond && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <Textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  rows={3}
                  disabled={sending}
                />
                
                {/* Adjuntos Preview */}
                {adjuntos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {adjuntos.map((file, index) => (
                      <div
                        key={index}
                        className="relative flex items-center gap-2 px-3 py-1 bg-muted rounded-md text-sm"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAdjunto(index)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending || adjuntos.length >= 3}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && adjuntos.length === 0) || sending}
                    className="flex-1"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>
            </>
          )}

          {!canRespond && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Este ticket está {ticket.status === 'resuelto' ? 'resuelto' : 'cerrado'} y no acepta más respuestas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};