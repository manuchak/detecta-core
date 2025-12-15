// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft, Clock, Calendar, DollarSign, Truck, Send, Paperclip,
  Loader2, CheckCircle, AlertTriangle, User, Headphones, Bot,
  ImageIcon, X, Phone, Mail, MapPin, History, FileText, MessageSquare,
  Eye, EyeOff, Star, MoreHorizontal, ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTicketsEnhanced, TicketEnhanced } from '@/hooks/useTicketsEnhanced';
import { SLABadge } from '@/components/tickets/SLABadge';
import { SLAProgressBar } from '@/components/tickets/SLAProgressBar';
import { TemplateSelector } from '@/components/tickets/TemplateSelector';
import { TicketQuickActions } from '@/components/tickets/TicketQuickActions';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TicketResponse {
  id: string;
  ticket_id: string;
  mensaje: string;
  autor_tipo: 'custodio' | 'agente' | 'sistema';
  autor_id: string | null;
  autor_nombre: string | null;
  es_interno: boolean;
  adjuntos_urls: string[] | null;
  created_at: string;
}

interface CustodianServiceHistory {
  id: string;
  fecha_hora_cita: string;
  cliente: string;
  origen: string;
  destino: string;
  estado: string;
}

const statusConfig = {
  abierto: { label: 'Abierto', icon: AlertTriangle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', gradient: 'from-red-500 to-rose-500' },
  en_progreso: { label: 'En Progreso', icon: Clock, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-500 to-orange-500' },
  resuelto: { label: 'Resuelto', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-green-500' },
  cerrado: { label: 'Cerrado', icon: X, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400', gradient: 'from-gray-400 to-gray-500' }
};

const priorityConfig = {
  baja: { label: 'Baja', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  media: { label: 'Media', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' }
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const TicketDetailPage = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { fetchTicketById, updateTicketStatus, assignTicket, recordFirstResponse } = useTicketsEnhanced();
  
  const [ticket, setTicket] = useState<TicketEnhanced | null>(null);
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [serviceHistory, setServiceHistory] = useState<CustodianServiceHistory[]>([]);
  const [otherTickets, setOtherTickets] = useState<TicketEnhanced[]>([]);
  const [agents, setAgents] = useState<Array<{ id: string; display_name: string }>>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticketId) {
      loadTicketData();
      loadResponses();
      loadAgents();
    }
  }, [ticketId]);

  const loadTicketData = async () => {
    setLoading(true);
    try {
      const ticketData = await fetchTicketById(ticketId!);
      if (ticketData) {
        setTicket(ticketData);
        if (ticketData.custodio_id) {
          loadServiceHistory(ticketData.custodio_id);
          loadOtherTickets(ticketData.custodio_id, ticketId!);
        }
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Error al cargar el ticket');
    } finally {
      setLoading(false);
    }
  };

  const loadResponses = async () => {
    setLoadingResponses(true);
    try {
      const { data, error } = await supabase
        .from('ticket_respuestas')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResponses(data || []);
      
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoadingResponses(false);
    }
  };

  const loadServiceHistory = async (custodioId: string) => {
    try {
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('id, fecha_hora_cita, cliente, origen, destino, estado')
        .eq('custodio_id', custodioId)
        .order('fecha_hora_cita', { ascending: false })
        .limit(5);

      if (error) throw error;
      setServiceHistory(data || []);
    } catch (error) {
      console.error('Error loading service history:', error);
    }
  };

  const loadOtherTickets = async (custodioId: string, currentTicketId: string) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, ticket_number, subject, status, created_at')
        .eq('custodio_id', custodioId)
        .neq('id', currentTicketId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setOtherTickets(data as any || []);
    } catch (error) {
      console.error('Error loading other tickets:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .not('display_name', 'is', null);

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;
    
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('ticket_respuestas')
        .insert({
          ticket_id: ticket.id,
          mensaje: newMessage,
          autor_tipo: 'agente',
          autor_id: user?.id,
          autor_nombre: user?.email?.split('@')[0] || 'Agente',
          es_interno: isInternal
        });

      if (error) throw error;
      
      if (!ticket.primera_respuesta_at && !isInternal) {
        await recordFirstResponse(ticket.id);
      }
      
      setNewMessage('');
      setIsInternal(false);
      await loadResponses();
      await loadTicketData();
      
      toast.success(isInternal ? 'Nota interna agregada' : 'Respuesta enviada');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (text: string) => {
    setNewMessage(prev => prev + text);
  };

  const handleStatusChange = async (newStatus: TicketEnhanced['status']) => {
    if (ticket) {
      await updateTicketStatus(ticket.id, newStatus);
      await loadTicketData();
    }
  };

  const handleAssign = async (userId: string | null) => {
    if (ticket) {
      await assignTicket(ticket.id, userId);
      await loadTicketData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background">
        <div className="max-w-[1400px] mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-96" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">Ticket no encontrado</p>
            <Button variant="outline" onClick={() => navigate('/tickets')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[ticket.status];
  const StatusIcon = status.icon;
  const canRespond = !['resuelto', 'cerrado'].includes(ticket.status);

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back + Ticket Info */}
            <div className="flex items-center gap-4 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate('/tickets')} className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono shrink-0">{ticket.ticket_number}</Badge>
                  <Badge className={cn("flex items-center gap-1 shrink-0", status.color)}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                  <Badge className={cn("shrink-0", priorityConfig[ticket.priority].color)}>
                    {priorityConfig[ticket.priority].label}
                  </Badge>
                </div>
                <h1 className="text-lg font-semibold truncate mt-1 max-w-xl">{ticket.subject}</h1>
              </div>
            </div>
            
            {/* Right: SLA + Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:block">
                <SLAProgressBar
                  status={ticket.sla.estadoGeneral}
                  percentage={ticket.sla.porcentajeConsumidoResolucion}
                  remainingMinutes={ticket.sla.tiempoRestanteResolucion}
                />
              </div>
              <TicketQuickActions
                ticket={ticket}
                agents={agents}
                onStatusChange={handleStatusChange}
                onAssign={handleAssign}
                onAddInternalNote={(note) => {
                  setNewMessage(note);
                  setIsInternal(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Conversation */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Conversación
                  <Badge variant="secondary" className="ml-auto">
                    {responses.length + 1} mensajes
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Initial ticket message */}
                <div className="p-4 bg-muted/30 border-b">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border-2 border-background shadow">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                        {getInitials(ticket.custodio?.nombre || ticket.customer_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">
                          {ticket.custodio?.nombre || ticket.customer_name || 'Usuario'}
                        </span>
                        <Badge variant="outline" className="text-[10px]">Custodio</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap text-foreground/90">{ticket.description}</p>
                      
                      {/* Evidences */}
                      {ticket.evidencia_urls && ticket.evidencia_urls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {ticket.evidencia_urls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg text-sm hover:bg-accent transition-colors border"
                            >
                              <ImageIcon className="h-4 w-4" />
                              Archivo {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Responses */}
                <ScrollArea className="h-[450px]" ref={scrollRef}>
                  <div className="p-4 space-y-4">
                    {loadingResponses ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : responses.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Sin respuestas aún</p>
                        <p className="text-xs mt-1">Sé el primero en responder</p>
                      </div>
                    ) : (
                      responses.map(resp => {
                        const isAgent = resp.autor_tipo === 'agente';
                        const isSystem = resp.autor_tipo === 'sistema';
                        
                        if (isSystem) {
                          return (
                            <div key={resp.id} className="flex justify-center">
                              <div className="px-4 py-2 bg-muted/50 rounded-full text-xs text-muted-foreground italic">
                                {resp.mensaje}
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div
                            key={resp.id}
                            className={cn(
                              "flex gap-3",
                              isAgent ? "flex-row-reverse"  : "flex-row"
                            )}
                          >
                            <Avatar className="h-9 w-9 shrink-0 border-2 border-background shadow">
                              <AvatarFallback className={cn(
                                "text-xs font-medium",
                                isAgent 
                                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" 
                                  : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                              )}>
                                {isAgent ? <Headphones className="h-4 w-4" /> : getInitials(resp.autor_nombre || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className={cn(
                              "max-w-[75%] space-y-1",
                              isAgent ? "items-end" : "items-start"
                            )}>
                              <div className={cn(
                                "px-4 py-3 rounded-2xl",
                                resp.es_interno 
                                  ? "bg-amber-50 dark:bg-amber-950/30 border-2 border-dashed border-amber-300 dark:border-amber-700"
                                  : isAgent 
                                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                                    : "bg-muted rounded-tl-sm"
                              )}>
                                {resp.es_interno && (
                                  <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 mb-1 font-medium">
                                    <EyeOff className="h-3 w-3" />
                                    Nota interna
                                  </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{resp.mensaje}</p>
                              </div>
                              
                              <div className={cn(
                                "flex items-center gap-2 text-xs text-muted-foreground px-1",
                                isAgent ? "justify-end" : "justify-start"
                              )}>
                                <span>{resp.autor_nombre || (isAgent ? 'Agente' : 'Usuario')}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(resp.created_at), { addSuffix: true, locale: es })}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>

                {/* Reply Input */}
                {canRespond && (
                  <div className="p-4 border-t bg-muted/20">
                    <div className="flex items-center gap-2 mb-3">
                      <TemplateSelector
                        categoriaId={ticket.categoria_custodio_id}
                        custodianName={ticket.custodio?.nombre || ticket.customer_name}
                        ticketNumber={ticket.ticket_number}
                        onSelect={handleTemplateSelect}
                      />
                      <Button
                        variant={isInternal ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsInternal(!isInternal)}
                        className={cn(
                          "gap-2 transition-all",
                          isInternal && "bg-amber-500 hover:bg-amber-600 text-white"
                        )}
                      >
                        {isInternal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {isInternal ? 'Nota interna' : 'Público'}
                      </Button>
                    </div>
                    
                    <div className="relative">
                      <Textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={isInternal ? "Escribe una nota interna (no visible para el custodio)..." : "Escribe una respuesta..."}
                        rows={3}
                        disabled={sending}
                        className={cn(
                          "pr-24 resize-none",
                          isInternal && "border-amber-300 focus:border-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                        )}
                      />
                      <div className="absolute bottom-2 right-2">
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sending}
                          size="sm"
                          className={cn(
                            "gap-2",
                            isInternal && "bg-amber-500 hover:bg-amber-600"
                          )}
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Enviar</span>
                        </Button>
                      </div>
                    </div>
                    
                    {newMessage.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 text-right">
                        {newMessage.length} caracteres
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Info */}
          <div className="space-y-4">
            {/* Ticket Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Detalles del Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Creado</span>
                    <p className="font-medium">
                      {format(new Date(ticket.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Categoría</span>
                    <p className="font-medium">
                      {ticket.categoria_custodio?.nombre || ticket.category || 'General'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Asignado a</span>
                    <p className="font-medium">
                      {ticket.assigned_user?.display_name || 'Sin asignar'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Fuente</span>
                    <p className="font-medium capitalize">{ticket.source || 'web'}</p>
                  </div>
                  {ticket.monto_reclamado && (
                    <div className="col-span-2 p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Monto reclamado</span>
                      <p className="font-bold text-lg text-primary">${ticket.monto_reclamado.toLocaleString()} MXN</p>
                    </div>
                  )}
                </div>
                
                {/* SLA Details */}
                <Separator />
                <div className="space-y-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">SLA</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <span className="text-xs">Primera respuesta</span>
                      <SLABadge
                        status={ticket.sla.estadoRespuesta}
                        remainingMinutes={ticket.sla.tiempoRestanteRespuesta}
                        percentage={ticket.sla.porcentajeConsumidoRespuesta}
                        type="respuesta"
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <span className="text-xs">Resolución</span>
                      <SLABadge
                        status={ticket.sla.estadoResolucion}
                        remainingMinutes={ticket.sla.tiempoRestanteResolucion}
                        percentage={ticket.sla.porcentajeConsumidoResolucion}
                        type="resolucion"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
                
                {/* CSAT if available */}
                {ticket.calificacion_csat !== null && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Calificación CSAT</span>
                      <div className="flex gap-0.5 mt-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={cn(
                              "w-5 h-5",
                              star <= (ticket.calificacion_csat || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                      {ticket.comentario_csat && (
                        <p className="text-xs mt-2 italic text-muted-foreground bg-muted/30 p-2 rounded">"{ticket.comentario_csat}"</p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Custodian Info */}
            {ticket.custodio && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Información del Custodio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-background shadow">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                        {getInitials(ticket.custodio.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{ticket.custodio.nombre}</p>
                      {ticket.custodio.zona_base && (
                        <p className="text-xs text-muted-foreground">{ticket.custodio.zona_base}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {ticket.custodio.telefono && (
                      <a 
                        href={`tel:${ticket.custodio.telefono}`} 
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50"
                      >
                        <Phone className="h-4 w-4" />
                        {ticket.custodio.telefono}
                      </a>
                    )}
                    {ticket.custodio.email && (
                      <a 
                        href={`mailto:${ticket.custodio.email}`} 
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50"
                      >
                        <Mail className="h-4 w-4" />
                        {ticket.custodio.email}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service History */}
            {serviceHistory.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Últimos Servicios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {serviceHistory.map(service => (
                      <div key={service.id} className="text-xs p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{service.cliente}</p>
                          <Badge variant="outline" className="text-[10px]">{service.estado}</Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {format(new Date(service.fecha_hora_cita), 'dd/MM/yy', { locale: es })}
                          <span className="mx-1">•</span>
                          {service.origen} → {service.destino}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other Tickets */}
            {otherTickets.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Otros Tickets
                    <Badge variant="secondary" className="ml-auto text-xs">{otherTickets.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {otherTickets.map(t => (
                      <button
                        key={t.id}
                        onClick={() => navigate(`/tickets/${t.id}`)}
                        className="w-full text-left p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs">{t.ticket_number}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">{t.subject}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
