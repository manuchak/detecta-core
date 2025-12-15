// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Clock, Calendar, DollarSign, Truck, Send, Paperclip,
  Loader2, CheckCircle, AlertTriangle, User, Headphones, Bot,
  ImageIcon, X, Phone, Mail, MapPin, History, FileText, MessageSquare,
  Eye, EyeOff, Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTicketsEnhanced, TicketEnhanced } from '@/hooks/useTicketsEnhanced';
import { SLABadge } from '@/components/tickets/SLABadge';
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
  abierto: { label: 'Abierto', icon: AlertTriangle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  en_progreso: { label: 'En Progreso', icon: Clock, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  resuelto: { label: 'Resuelto', icon: CheckCircle, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cerrado: { label: 'Cerrado', icon: X, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400' }
};

const priorityConfig = {
  baja: { label: 'Baja', color: 'bg-blue-100 text-blue-700' },
  media: { label: 'Media', color: 'bg-yellow-100 text-yellow-700' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700' }
};

export const TicketDetailPage = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { getTicketById, updateTicketStatus, assignTicket, recordFirstResponse, loadTickets } = useTicketsEnhanced();
  
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
      // Reload tickets to get fresh data
      await loadTickets();
      
      // Get ticket from hook
      const ticketData = getTicketById(ticketId!);
      if (ticketData) {
        setTicket(ticketData);
        
        // Load custodian service history if available
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
      
      // Scroll to bottom
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
      // Get current user
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
      
      // Record first response if applicable
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
      <div className="space-y-6 animate-fade-in p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Ticket no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/tickets')}>
          Volver a tickets
        </Button>
      </div>
    );
  }

  const status = statusConfig[ticket.status];
  const StatusIcon = status.icon;
  const canRespond = !['resuelto', 'cerrado'].includes(ticket.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono">{ticket.ticket_number}</Badge>
              <Badge className={cn("flex items-center gap-1", status.color)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
              <Badge className={priorityConfig[ticket.priority].color}>
                {priorityConfig[ticket.priority].label}
              </Badge>
              <SLABadge
                status={ticket.sla.estadoGeneral}
                remainingMinutes={ticket.sla.tiempoRestanteResolucion}
                percentage={ticket.sla.porcentajeConsumidoResolucion}
                type="resolucion"
              />
            </div>
            <h1 className="text-xl font-semibold mt-1">{ticket.subject}</h1>
          </div>
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Conversation */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversación</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Initial ticket message */}
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {ticket.custodio?.nombre || ticket.customer_name || 'Usuario'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                
                {/* Evidences */}
                {ticket.evidencia_urls && ticket.evidencia_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {ticket.evidencia_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md text-sm hover:bg-accent"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Archivo {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Responses */}
              <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
                {loadingResponses ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : responses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Sin respuestas aún</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {responses.map(resp => {
                      const isAgent = resp.autor_tipo === 'agente';
                      const AutorIcon = isAgent ? Headphones : (resp.autor_tipo === 'sistema' ? Bot : User);
                      
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
                              resp.es_interno 
                                ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
                                : isAgent ? "bg-primary/10" : "bg-muted"
                            )}>
                              {resp.es_interno && (
                                <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 mb-1">
                                  <EyeOff className="h-3 w-3" />
                                  Nota interna
                                </div>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{resp.mensaje}</p>
                            </div>
                            
                            <span className="text-xs text-muted-foreground px-1">
                              {resp.autor_nombre || (isAgent ? 'Agente' : 'Usuario')} • 
                              {formatDistanceToNow(new Date(resp.created_at), { addSuffix: true, locale: es })}
                            </span>
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TemplateSelector
                          categoriaId={ticket.categoria_custodio_id}
                          custodianName={ticket.custodio?.nombre || ticket.customer_name}
                          ticketNumber={ticket.ticket_number}
                          onSelect={handleTemplateSelect}
                        />
                        <Button
                          variant={isInternal ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setIsInternal(!isInternal)}
                          className="gap-2"
                        >
                          {isInternal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {isInternal ? 'Nota interna' : 'Respuesta pública'}
                        </Button>
                      </div>
                    </div>
                    
                    <Textarea
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder={isInternal ? "Escribe una nota interna (no visible para el custodio)..." : "Escribe una respuesta..."}
                      rows={3}
                      disabled={sending}
                      className={cn(
                        isInternal && "border-amber-300 focus:border-amber-400"
                      )}
                    />
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="flex-1"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        {isInternal ? 'Agregar nota' : 'Enviar respuesta'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Info */}
        <div className="space-y-4">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detalles del Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Creado</span>
                  <p className="font-medium">
                    {format(new Date(ticket.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Categoría</span>
                  <p className="font-medium">
                    {ticket.categoria_custodio?.nombre || ticket.category || 'General'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Asignado a</span>
                  <p className="font-medium">
                    {ticket.assigned_user?.display_name || 'Sin asignar'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fuente</span>
                  <p className="font-medium capitalize">{ticket.source || 'web'}</p>
                </div>
                {ticket.monto_reclamado && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Monto reclamado</span>
                    <p className="font-medium text-lg">${ticket.monto_reclamado.toLocaleString()} MXN</p>
                  </div>
                )}
              </div>
              
              {/* SLA Details */}
              <Separator />
              <div className="space-y-2">
                <span className="text-muted-foreground">SLA</span>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Primera respuesta:</span>
                    <SLABadge
                      status={ticket.sla.estadoRespuesta}
                      remainingMinutes={ticket.sla.tiempoRestanteRespuesta}
                      percentage={ticket.sla.porcentajeConsumidoRespuesta}
                      type="respuesta"
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Resolución:</span>
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
                    <span className="text-muted-foreground">Calificación CSAT</span>
                    <div className="flex gap-0.5 mt-1">
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
                      <p className="text-xs mt-1 italic">"{ticket.comentario_csat}"</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Custodian Info */}
          {ticket.custodio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información del Custodio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">{ticket.custodio.nombre}</p>
                </div>
                {ticket.custodio.telefono && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${ticket.custodio.telefono}`} className="hover:underline">
                      {ticket.custodio.telefono}
                    </a>
                  </div>
                )}
                {ticket.custodio.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${ticket.custodio.email}`} className="hover:underline">
                      {ticket.custodio.email}
                    </a>
                  </div>
                )}
                {ticket.custodio.zona_base && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{ticket.custodio.zona_base}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Service History */}
          {serviceHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Últimos Servicios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviceHistory.map(service => (
                    <div key={service.id} className="text-xs p-2 bg-muted/50 rounded">
                      <p className="font-medium">{service.cliente}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(service.fecha_hora_cita), 'dd/MM/yy', { locale: es })}
                        {' • '}{service.origen} → {service.destino}
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
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Otros Tickets del Custodio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {otherTickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/tickets/${t.id}`)}
                      className="w-full text-left text-xs p-2 bg-muted/50 rounded hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono">{t.ticket_number}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {statusConfig[t.status as keyof typeof statusConfig]?.label}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground truncate">{t.subject}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
