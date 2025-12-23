import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Ticket, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CustodianTicket } from "@/hooks/useCustodianTicketsEnhanced";
import InternalChatModal from "./InternalChatModal";

interface SupportContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tickets?: CustodianTicket[];
  custodianPhone?: string;
  onRefresh?: () => void;
}

const SupportContactModal = ({ 
  open, 
  onOpenChange, 
  tickets = [],
  custodianPhone = '',
  onRefresh
}: SupportContactModalProps) => {
  const navigate = useNavigate();
  const [showChatModal, setShowChatModal] = useState(false);

  const openTickets = tickets.filter(t => ['abierto', 'en_progreso'].includes(t.status));

  const handleCreateTicket = () => {
    onOpenChange(false);
    navigate('/custodian/support');
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('soporte@detecta.app');
  };

  const handleOpenChat = () => {
    onOpenChange(false);
    setShowChatModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Contactar Soporte
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <p className="text-center text-muted-foreground text-sm">
              ¿Necesitas ayuda? Estamos aquí para apoyarte.
            </p>

            {/* Hablar con Sara */}
            <button
              onClick={handleOpenChat}
              className="w-full flex items-center gap-4 bg-purple-500/10 hover:bg-purple-500/20 active:scale-[0.98] transition-all rounded-xl p-4 relative"
            >
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">Hablar con Sara</p>
                  {openTickets.length > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                      {openTickets.length} activo{openTickets.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Tu asistente de soporte</p>
              </div>
              <span className="text-xs text-purple-600 font-medium">24/7</span>
            </button>

            {/* Crear Ticket */}
            <button
              onClick={handleCreateTicket}
              className="w-full flex items-center gap-4 bg-muted/50 hover:bg-muted active:scale-[0.98] transition-all rounded-xl p-4"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Ticket className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Crear Ticket</p>
                <p className="text-xs text-muted-foreground">Solicitud detallada</p>
              </div>
            </button>

            {/* Horario */}
            <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Agentes: Lun-Vie 9:00 - 18:00</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Internal Chat Modal */}
      <InternalChatModal
        open={showChatModal}
        onOpenChange={setShowChatModal}
        tickets={tickets}
        custodianPhone={custodianPhone}
        onCreateTicket={handleCreateTicket}
        onRefresh={onRefresh || (() => {})}
      />
    </>
  );
};

export default SupportContactModal;
