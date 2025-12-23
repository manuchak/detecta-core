import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, Send, Loader2, Sparkles, User, Headphones, 
  MessageSquare, Clock, Plus, UserCog 
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
  const { getTicketResponses, addResponse } = useCustodianTicketsEnhanced(custodianPhone);
  
  const [selectedTicket, setSelectedTicket] = useState<CustodianTicket | null>(null);
  const [respuestas, setRespuestas] = useState<TicketRespuesta[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const openTickets = tickets.filter(t => ['abierto', 'en_progreso'].includes(t.status));

  // Load responses when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      loadResponses();
      setupRealtime();
    }
    return () => {
      // Cleanup realtime subscription
      supabase.removeAllChannels();
    };
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
          if (newResp.es_interno) return; // Skip internal messages
          
          setRespuestas(prev => {
            // Avoid duplicates
            if (prev.some(r => r.id === newResp.id)) return prev;
            return [...prev, newResp];
          });
          setBotTyping(false);
          scrollToBottom();
        }
      )
      .subscribe();

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
    
    // First add the custodian's message
    const success = await addResponse(selectedTicket.id, messageToSend);
    
    if (success) {
      // Show bot typing indicator
      setBotTyping(true);
      
      // Call bot for response
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
          toast({
            title: 'Error del asistente',
            description: 'No se pudo obtener respuesta del asistente',
            variant: 'destructive'
          });
        }
        
        // Response will come through realtime subscription
      } catch (error) {
        console.error('Error calling bot:', error);
        setBotTyping(false);
      }
    }
    
    setSending(false);
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
    setSelectedTicket(null);
    setRespuestas([]);
    setNewMessage('');
  };

  const handleClose = () => {
    setSelectedTicket(null);
    setRespuestas([]);
    setNewMessage('');
    onOpenChange(false);
  };

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

      <Button 
        onClick={() => { handleClose(); onCreateTicket(); }} 
        className="w-full gap-2"
        variant={openTickets.length > 0 ? "outline" : "default"}
      >
        <Plus className="w-4 h-4" />
        Nueva consulta con Sara
      </Button>
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4 rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            {selectedTicket ? 'Conversación con Sara' : 'Sara - Tu Asistente'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 pt-2">
          {selectedTicket ? renderChat() : renderChatList()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InternalChatModal;
