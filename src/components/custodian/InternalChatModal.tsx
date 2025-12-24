import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, Send, Loader2, Sparkles, User, Headphones, 
  MessageSquare, Clock, Plus, UserCog, Ticket, CheckCircle2, X,
  RefreshCw, AlertTriangle, DollarSign, Package, Smartphone, HelpCircle
} from 'lucide-react';
import { CustodianTicket, TicketRespuesta, useCustodianTicketsEnhanced } from '@/hooks/useCustodianTicketsEnhanced';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Quick reply categories for Sara
const QUICK_CATEGORIES = [
  { id: 'pagos', label: '💰 Pagos', icon: DollarSign, color: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:hover:bg-emerald-800 dark:text-emerald-200' },
  { id: 'servicios', label: '📦 Servicios', icon: Package, color: 'bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:hover:bg-blue-800 dark:text-blue-200' },
  { id: 'gps', label: '📱 App/GPS', icon: Smartphone, color: 'bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:hover:bg-purple-800 dark:text-purple-200' },
  { id: 'otro', label: '❓ Otro', icon: HelpCircle, color: 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800/50 dark:hover:bg-gray-700 dark:text-gray-200' },
];

interface InternalChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tickets: CustodianTicket[];
  custodianPhone: string;
  onCreateTicket: () => void;
  onRefresh: () => void;
}

const autorIcons = {
  custodio: User,
  agente: Headphones,
  sistema: Sparkles
};

const InternalChatModal = ({ 
  open, 
  onOpenChange, 
  tickets, 
  custodianPhone,
  onCreateTicket,
  onRefresh
}: InternalChatModalProps) => {
  const { toast } = useToast();
  const { getTicketResponses, addResponse, createTicket } = useCustodianTicketsEnhanced(custodianPhone);
  
  const [selectedTicket, setSelectedTicket] = useState<CustodianTicket | null>(null);
  const [respuestas, setRespuestas] = useState<TicketRespuesta[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  
  // New state for creating a new conversation without navigating
  const [creatingNewConversation, setCreatingNewConversation] = useState(false);
  const [firstMessage, setFirstMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  
  // State for ticket creation confirmation and close suggestion
  const [showTicketConfirmation, setShowTicketConfirmation] = useState(false);
  const [suggestClose, setSuggestClose] = useState(false);
  const [closingConversation, setClosingConversation] = useState(false);
  
  // Error recovery state
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [errorState, setErrorState] = useState(false);
  
  // Quick replies visibility
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const openTickets = tickets.filter(t => ['abierto', 'en_progreso'].includes(t.status));

  // Load responses when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      loadResponses();
      const cleanup = setupRealtime();
      return () => {
        cleanup?.();
        supabase.removeAllChannels();
      };
    }
  }, [selectedTicket?.id]);

  // Polling fallback: reload messages every 5 seconds in case realtime fails
  useEffect(() => {
    if (!selectedTicket) return;
    
    const pollInterval = setInterval(() => {
      loadResponses();
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [selectedTicket?.id]);

  const loadResponses = async () => {
    if (!selectedTicket) return;
    setLoadingResponses(true);
    const data = await getTicketResponses(selectedTicket.id);
    setRespuestas(data);
    setLoadingResponses(false);
    scrollToBottom();
  };

  const setupRealtime = () => {
    if (!selectedTicket) return;
    
    const channel = supabase
      .channel(`ticket-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_respuestas',
          filter: `ticket_id=eq.${selectedTicket.id}`
        },
        (payload) => {
          console.log('New message received:', payload);
          const newResp = payload.new as TicketRespuesta;
          if (newResp.es_interno) return;
          
          // ALWAYS reset botTyping when Sara or agent responds
          if (newResp.autor_tipo === 'sistema' || newResp.autor_tipo === 'agente') {
            setBotTyping(false);
          }
          
          // Add message if not already exists
          setRespuestas(prev => {
            if (prev.some(r => r.id === newResp.id)) return prev;
            return [...prev, newResp];
          });
          scrollToBottom();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (messageOverride?: string) => {
    const messageToSend = messageOverride || newMessage.trim();
    if (!messageToSend || !selectedTicket) return;
    
    setNewMessage('');
    setSending(true);
    setBotTyping(true);
    setErrorState(false);
    setLastFailedMessage(null);
    setShowQuickReplies(false);
    
    // OPTIMISTIC UPDATE: Add user message immediately to UI
    const tempMessage: TicketRespuesta = {
      id: crypto.randomUUID(),
      ticket_id: selectedTicket.id,
      autor_id: '',
      autor_tipo: 'custodio',
      autor_nombre: 'Tú',
      mensaje: messageToSend,
      created_at: new Date().toISOString(),
      es_interno: false,
      es_resolucion: false,
      adjuntos_urls: null
    };
    setRespuestas(prev => [...prev, tempMessage]);
    scrollToBottom();
    
    // Reduced safety timeout: 15 seconds with error message
    const typingTimeout = setTimeout(() => {
      setBotTyping(false);
      setErrorState(true);
      setLastFailedMessage(messageToSend);
      console.warn('Bot typing timeout - resetting after 15s');
      // Add visible error message in chat
      const errorMessage: TicketRespuesta = {
        id: crypto.randomUUID(),
        ticket_id: selectedTicket.id,
        autor_id: '',
        autor_tipo: 'sistema',
        autor_nombre: 'Sistema',
        mensaje: '⚠️ Sara está tardando en responder. Puedes reintentar o hablar con un agente.',
        created_at: new Date().toISOString(),
        es_interno: false,
        es_resolucion: false,
        adjuntos_urls: null
      };
      setRespuestas(prev => [...prev, errorMessage]);
      scrollToBottom();
    }, 15000);
    
    const success = await addResponse(selectedTicket.id, messageToSend);
    
    if (success) {
      try {
        const response = await supabase.functions.invoke('support-chat-bot', {
          body: {
            ticket_id: selectedTicket.id,
            mensaje: messageToSend,
            custodio_telefono: custodianPhone
          }
        });

        clearTimeout(typingTimeout);

        if (response.error) {
          console.error('Bot error:', response.error);
          setBotTyping(false);
          setErrorState(true);
          setLastFailedMessage(messageToSend);
          toast({
            title: 'Error del asistente',
            description: 'No se pudo obtener respuesta. Puedes reintentar.',
            variant: 'destructive'
          });
        } else if (response.data) {
          // IMMEDIATELY reset botTyping and add message locally
          setBotTyping(false);
          setErrorState(false);
          
          // Add bot message locally without waiting for Realtime
          if (response.data.message) {
            const botMessage: TicketRespuesta = {
              id: crypto.randomUUID(),
              ticket_id: selectedTicket.id,
              autor_id: '00000000-0000-0000-0000-000000000000',
              autor_tipo: 'sistema',
              autor_nombre: 'Sara',
              mensaje: response.data.message,
              created_at: new Date().toISOString(),
              es_interno: false,
              es_resolucion: false,
              adjuntos_urls: null
            };
            setRespuestas(prev => {
              // Avoid duplicates if Realtime already added it
              if (prev.some(r => r.mensaje === response.data.message && r.autor_tipo === 'sistema')) {
                return prev;
              }
              return [...prev, botMessage];
            });
            scrollToBottom();
            
            // Show quick replies after Sara's greeting
            if (respuestas.length <= 1) {
              setShowQuickReplies(true);
            }
          }
          
          // Check if Sara created a ticket or suggests closing
          if (response.data.ticketCreated) {
            setShowTicketConfirmation(true);
            setTimeout(() => setShowTicketConfirmation(false), 5000);
          }
          if (response.data.suggestClose) {
            setSuggestClose(true);
          }
        }
      } catch (error) {
        console.error('Error calling bot:', error);
        clearTimeout(typingTimeout);
        setBotTyping(false);
        setErrorState(true);
        setLastFailedMessage(messageToSend);
      }
    } else {
      clearTimeout(typingTimeout);
      setBotTyping(false);
      setErrorState(true);
      setLastFailedMessage(messageToSend);
    }
    
    setSending(false);
  };

  // Retry last failed message
  const handleRetry = () => {
    if (lastFailedMessage) {
      // Remove the error message from chat
      setRespuestas(prev => prev.filter(r => !r.mensaje.includes('⚠️ Sara está tardando')));
      handleSendMessage(lastFailedMessage);
    }
  };

  // Handle quick category selection
  const handleQuickCategory = (categoryId: string) => {
    const categoryMessages: Record<string, string> = {
      'pagos': 'Tengo una duda sobre mis pagos',
      'servicios': 'Necesito ayuda con un servicio',
      'gps': 'Tengo un problema con la app o GPS',
      'otro': 'Tengo otra consulta'
    };
    handleSendMessage(categoryMessages[categoryId] || 'Hola, necesito ayuda');
  };

  // Handle starting a new conversation with Sara (creates ticket + first message)
  const handleStartNewConversation = async (categoryOverride?: string) => {
    const messageToSend = categoryOverride || firstMessage.trim();
    if (!messageToSend) return;
    
    setCreatingTicket(true);
    
    try {
      // Get first available category or use null
      const { data: categories } = await supabase
        .from('categorias_ticket_custodio')
        .select('id')
        .eq('activo', true)
        .limit(1);
      
      const categoryId = categories?.[0]?.id || null;
      
      // Create a new ticket with the first message as description
      const ticketData = {
        subject: 'Consulta con Sara',
        description: messageToSend,
        priority: 'media' as const,
        status: 'abierto' as const,
        categoria_custodio_id: categoryId
      };
      
      const newTicket = await createTicket(ticketData);
      
      if (newTicket) {
        // Add the first message as a response
        await addResponse(newTicket.id, messageToSend);
        
        // Call Sara bot to respond
        setBotTyping(true);
        try {
          const response = await supabase.functions.invoke('support-chat-bot', {
            body: {
              ticket_id: newTicket.id,
              mensaje: messageToSend,
              custodio_telefono: custodianPhone
            }
          });
          
          // IMMEDIATELY reset botTyping and add message locally
          setBotTyping(false);
          
          if (response.data?.message) {
            // Add user message first
            const userMessage: TicketRespuesta = {
              id: crypto.randomUUID(),
              ticket_id: newTicket.id,
              autor_id: '',
              autor_tipo: 'custodio',
              autor_nombre: 'Tú',
              mensaje: messageToSend,
              created_at: new Date().toISOString(),
              es_interno: false,
              es_resolucion: false,
              adjuntos_urls: null
            };
            
            const botMessage: TicketRespuesta = {
              id: crypto.randomUUID(),
              ticket_id: newTicket.id,
              autor_id: '00000000-0000-0000-0000-000000000000',
              autor_tipo: 'sistema',
              autor_nombre: 'Sara',
              mensaje: response.data.message,
              created_at: new Date().toISOString(),
              es_interno: false,
              es_resolucion: false,
              adjuntos_urls: null
            };
            
            setRespuestas([userMessage, botMessage]);
            setShowQuickReplies(true);
          }
        } catch (error) {
          console.error('Error calling bot:', error);
          setBotTyping(false);
        }
        
        // Switch to chat view with the new ticket
        setSelectedTicket(newTicket);
        setCreatingNewConversation(false);
        setFirstMessage('');
        onRefresh();
        
        toast({
          title: 'Conversación iniciada',
          description: 'Sara te responderá en un momento'
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo crear la conversación',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la conversación',
        variant: 'destructive'
      });
    } finally {
      setCreatingTicket(false);
    }
  };

  // Handle quick start with category
  const handleQuickStart = (categoryId: string) => {
    const categoryMessages: Record<string, string> = {
      'pagos': 'Tengo una duda sobre mis pagos',
      'servicios': 'Necesito ayuda con un servicio',
      'gps': 'Tengo un problema con la app o GPS',
      'otro': 'Hola, necesito ayuda'
    };
    handleStartNewConversation(categoryMessages[categoryId]);
  };

  const handleEscalate = async () => {
    if (!selectedTicket) return;
    
    try {
      const response = await supabase.functions.invoke('support-chat-bot', {
        body: {
          ticket_id: selectedTicket.id,
          action: 'escalate',
          custodio_telefono: custodianPhone
        }
      });

      if (response.error) throw response.error;

      toast({
        title: 'Escalado exitoso',
        description: 'Tu conversación ha sido transferida a un agente humano'
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error escalating:', error);
      toast({
        title: 'Error',
        description: 'No se pudo escalar la conversación',
        variant: 'destructive'
      });
    }
  };

  // Handle close conversation
  const handleCloseConversation = async () => {
    if (!selectedTicket) return;
    
    setClosingConversation(true);
    
    try {
      const response = await supabase.functions.invoke('support-chat-bot', {
        body: {
          ticket_id: selectedTicket.id,
          action: 'close_conversation',
          custodio_telefono: custodianPhone
        }
      });

      if (response.error) throw response.error;

      toast({
        title: '✅ Conversación cerrada',
        description: 'Tu ticket ha sido registrado. ¡Gracias!'
      });
      
      setSuggestClose(false);
      onRefresh();
      
      // Close modal after a short delay
      setTimeout(() => {
        handleDialogChange(false);
      }, 1500);
    } catch (error) {
      console.error('Error closing conversation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cerrar la conversación',
        variant: 'destructive'
      });
    } finally {
      setClosingConversation(false);
    }
  };

  const handleBack = () => {
    if (creatingNewConversation) {
      setCreatingNewConversation(false);
      setFirstMessage('');
    } else {
      setSelectedTicket(null);
      setRespuestas([]);
      setNewMessage('');
      setSuggestClose(false);
      setShowTicketConfirmation(false);
      setErrorState(false);
      setLastFailedMessage(null);
      setShowQuickReplies(false);
    }
  };

  // Fix: Properly handle Dialog close - only clean state when actually closing
  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Reset all states when closing
      setSelectedTicket(null);
      setRespuestas([]);
      setNewMessage('');
      setBotTyping(false);
      setCreatingNewConversation(false);
      setFirstMessage('');
      setSuggestClose(false);
      setShowTicketConfirmation(false);
      setClosingConversation(false);
      setErrorState(false);
      setLastFailedMessage(null);
      setShowQuickReplies(false);
      onOpenChange(false);
    }
  };

  // New conversation input view with quick categories
  const renderNewConversation = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <p className="font-medium">Nueva consulta</p>
          <p className="text-xs text-muted-foreground">Selecciona o escribe tu consulta</p>
        </div>
      </div>
      
      <div className="text-center py-3">
        <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400" />
        </div>
        <p className="text-sm font-medium mb-1">¿Sobre qué necesitas ayuda?</p>
        <p className="text-xs text-muted-foreground">
          Selecciona una categoría para empezar más rápido
        </p>
      </div>

      {/* Quick category buttons */}
      <div className="grid grid-cols-2 gap-2">
        {QUICK_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleQuickStart(cat.id)}
              disabled={creatingTicket}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all",
                "border border-transparent",
                cat.color,
                creatingTicket && "opacity-50 cursor-not-allowed"
              )}
            >
              <Icon className="w-4 h-4" />
              {cat.label.replace(/^[^\s]+\s/, '')}
            </button>
          );
        })}
      </div>

      <div className="relative flex items-center py-2">
        <div className="flex-1 border-t border-muted" />
        <span className="px-3 text-xs text-muted-foreground">o escribe tu consulta</span>
        <div className="flex-1 border-t border-muted" />
      </div>

      <Textarea
        value={firstMessage}
        onChange={e => setFirstMessage(e.target.value)}
        placeholder="Describe tu problema o duda..."
        rows={2}
        className="resize-none"
        disabled={creatingTicket}
      />

      <Button
        onClick={() => handleStartNewConversation()}
        disabled={!firstMessage.trim() || creatingTicket}
        className="w-full gap-2"
      >
        {creatingTicket ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Iniciando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Enviar a Sara
          </>
        )}
      </Button>
    </div>
  );

  // Chat list view
  const renderChatList = () => (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        {openTickets.length > 0 
          ? 'Tus conversaciones activas con soporte'
          : 'No tienes conversaciones activas'
        }
      </p>

      {openTickets.length > 0 ? (
        <div className="space-y-2">
          {openTickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="w-full text-left p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {ticket.categoria?.icono ? (
                    <span className="text-lg">{ticket.categoria.icono}</span>
                  ) : (
                    <MessageSquare className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{ticket.subject}</p>
                    {ticket.status === 'en_progreso' && (
                      <Badge variant="secondary" className="flex-shrink-0 text-xs">
                        En progreso
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {ticket.categoria?.nombre || 'Sin categoría'}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: es })}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {/* Two separate CTAs */}
      <div className="space-y-2 pt-2">
        <Button 
          onClick={() => setCreatingNewConversation(true)} 
          className="w-full gap-2"
          variant={openTickets.length > 0 ? "outline" : "default"}
        >
          <Sparkles className="w-4 h-4" />
          Nueva consulta con Sara
        </Button>
        
        <Button 
          onClick={() => { handleDialogChange(false); onCreateTicket(); }} 
          variant="ghost"
          className="w-full gap-2 text-muted-foreground"
        >
          <Ticket className="w-4 h-4" />
          Crear ticket detallado
        </Button>
      </div>
    </div>
  );

  // Chat view
  const renderChat = () => (
    <div className="flex flex-col h-[60vh]">
      {/* Chat header */}
      <div className="flex items-center gap-3 pb-3 border-b">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <p className="font-medium truncate">{selectedTicket?.subject}</p>
          <p className="text-xs text-muted-foreground">
            {selectedTicket?.categoria?.nombre} • {selectedTicket?.ticket_number}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleEscalate}
          className="gap-1 text-xs"
        >
          <UserCog className="w-3 h-3" />
          Agente
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-2" ref={scrollRef}>
        <div className="py-4 space-y-4">
          {loadingResponses ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : respuestas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50 text-purple-400" />
              <p className="text-sm">Escribe tu pregunta o comentario</p>
              <p className="text-xs">Sara te responderá al instante ✨</p>
            </div>
          ) : (
            respuestas.map(resp => {
              const AutorIcon = autorIcons[resp.autor_tipo];
              const isUser = resp.autor_tipo === 'custodio';
              const isBot = resp.autor_tipo === 'sistema';
              
              return (
                <div
                  key={resp.id}
                  className={cn(
                    "flex gap-2",
                    isUser ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                    isUser ? "bg-primary text-primary-foreground" :
                    isBot ? "bg-purple-100 dark:bg-purple-900" : "bg-blue-100 dark:bg-blue-900"
                  )}>
                    <AutorIcon className={cn(
                      "h-4 w-4",
                      isBot && "text-purple-600 dark:text-purple-400",
                      !isUser && !isBot && "text-blue-600 dark:text-blue-400"
                    )} />
                  </div>
                  
                  <div className={cn(
                    "max-w-[75%] space-y-1",
                    isUser && "text-right"
                  )}>
                    <div className={cn(
                      "px-3 py-2 rounded-2xl text-sm",
                      isUser ? "bg-primary text-primary-foreground rounded-tr-sm" :
                      isBot ? "bg-purple-50 dark:bg-purple-950/50 rounded-tl-sm" :
                      "bg-blue-50 dark:bg-blue-950/50 rounded-tl-sm"
                    )}>
                      <p className="whitespace-pre-wrap">{resp.mensaje}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground px-1">
                      {resp.autor_nombre || (isUser ? 'Tú' : isBot ? 'Sara' : 'Agente')}
                      {' • '}
                      {formatDistanceToNow(new Date(resp.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {/* Sara typing indicator */}
          {botTyping && (
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/50 px-4 py-2 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick replies after Sara greeting */}
          {showQuickReplies && !botTyping && !suggestClose && (
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleQuickCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    cat.color
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Error recovery bar */}
      {errorState && lastFailedMessage && (
        <div className="mx-2 mb-2 p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Hubo un problema al enviar tu mensaje
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRetry}
              size="sm"
              variant="outline"
              className="flex-1 gap-1 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900"
            >
              <RefreshCw className="w-3 h-3" />
              Reintentar
            </Button>
            <Button
              onClick={handleEscalate}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <UserCog className="w-3 h-3" />
              Hablar con agente
            </Button>
          </div>
        </div>
      )}

      {/* Ticket confirmation banner */}
      {showTicketConfirmation && (
        <div className="mx-2 mb-2 p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200 flex-1">
            ¡Ticket registrado exitosamente!
          </p>
        </div>
      )}

      {/* Close conversation suggestion */}
      {suggestClose && !showTicketConfirmation && (
        <div className="mx-2 mb-2 p-3 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-xl">
          <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
            Tu ticket ha sido registrado. ¿Deseas cerrar la conversación?
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleCloseConversation}
              disabled={closingConversation}
              size="sm"
              className="flex-1 gap-1 bg-purple-600 hover:bg-purple-700"
            >
              {closingConversation ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              Cerrar conversación
            </Button>
            <Button
              onClick={() => setSuggestClose(false)}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <X className="w-3 h-3" />
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="pt-3 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            rows={1}
            className="min-h-[44px] max-h-[100px] resize-none"
            disabled={sending || botTyping || closingConversation}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!newMessage.trim() || sending || botTyping || closingConversation}
            size="icon"
            className="h-[44px] w-[44px] flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // Determine which view to render
  const renderContent = () => {
    if (selectedTicket) return renderChat();
    if (creatingNewConversation) return renderNewConversation();
    return renderChatList();
  };

  // Determine title
  const getTitle = () => {
    if (selectedTicket) return 'Conversación con Sara';
    if (creatingNewConversation) return 'Nueva consulta';
    return 'Sara - Tu Asistente';
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md mx-4 rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 pt-2">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InternalChatModal;
