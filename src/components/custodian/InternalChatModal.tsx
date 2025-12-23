import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, Send, Loader2, Sparkles, User, Headphones, 
  MessageSquare, Clock, Plus, UserCog, Ticket 
} from 'lucide-react';
import { CustodianTicket, TicketRespuesta, useCustodianTicketsEnhanced } from '@/hooks/useCustodianTicketsEnhanced';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    
    const messageToSend = newMessage;
    setNewMessage('');
    setSending(true);
    setBotTyping(true);
    
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
    
    // Safety timeout: reset botTyping after 30 seconds if no response
    const typingTimeout = setTimeout(() => {
      setBotTyping(false);
      console.warn('Bot typing timeout - resetting after 30s');
    }, 30000);
    
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

        if (response.error) {
          console.error('Bot error:', response.error);
          clearTimeout(typingTimeout);
          setBotTyping(false);
          toast({
            title: 'Error del asistente',
            description: 'No se pudo obtener respuesta del asistente',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error calling bot:', error);
        clearTimeout(typingTimeout);
        setBotTyping(false);
      }
    } else {
      clearTimeout(typingTimeout);
      setBotTyping(false);
    }
    
    setSending(false);
  };

  // Handle starting a new conversation with Sara (creates ticket + first message)
  const handleStartNewConversation = async () => {
    if (!firstMessage.trim()) return;
    
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
        description: firstMessage.trim(),
        priority: 'media' as const,
        status: 'abierto' as const,
        categoria_custodio_id: categoryId
      };
      
      const newTicket = await createTicket(ticketData);
      
      if (newTicket) {
        // Add the first message as a response
        await addResponse(newTicket.id, firstMessage.trim());
        
        // Call Sara bot to respond
        setBotTyping(true);
        try {
          await supabase.functions.invoke('support-chat-bot', {
            body: {
              ticket_id: newTicket.id,
              mensaje: firstMessage.trim(),
              custodio_telefono: custodianPhone
            }
          });
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

  const handleBack = () => {
    if (creatingNewConversation) {
      setCreatingNewConversation(false);
      setFirstMessage('');
    } else {
      setSelectedTicket(null);
      setRespuestas([]);
      setNewMessage('');
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
      onOpenChange(false);
    }
  };

  // New conversation input view
  const renderNewConversation = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <p className="font-medium">Nueva consulta</p>
          <p className="text-xs text-muted-foreground">Escribe tu pregunta para Sara</p>
        </div>
      </div>
      
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <p className="text-sm text-muted-foreground">
          Sara está lista para ayudarte con cualquier duda o problema
        </p>
      </div>

      <Textarea
        value={firstMessage}
        onChange={e => setFirstMessage(e.target.value)}
        placeholder="¿En qué puedo ayudarte hoy?"
        rows={3}
        className="resize-none"
        disabled={creatingTicket}
      />

      <Button
        onClick={handleStartNewConversation}
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
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="pt-3 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            rows={1}
            className="min-h-[44px] max-h-[100px] resize-none"
            disabled={sending || botTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending || botTyping}
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
