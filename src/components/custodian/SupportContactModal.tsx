import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Mail, Ticket, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SupportContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupportContactModal = ({ open, onOpenChange }: SupportContactModalProps) => {
  const navigate = useNavigate();

  const handleCreateTicket = () => {
    onOpenChange(false);
    navigate('/custodian/support');
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('soporte@detecta.app');
  };

  return (
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

          {/* WhatsApp - Próximamente */}
          <button
            disabled
            className="w-full flex items-center gap-4 bg-muted/50 rounded-xl p-4 opacity-60 cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">WhatsApp</p>
              <p className="text-xs text-muted-foreground">Próximamente</p>
            </div>
          </button>

          {/* Correo */}
          <button
            onClick={handleCopyEmail}
            className="w-full flex items-center gap-4 bg-blue-500/10 hover:bg-blue-500/20 active:scale-[0.98] transition-all rounded-xl p-4"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">Correo</p>
              <p className="text-xs text-muted-foreground">soporte@detecta.app</p>
            </div>
            <span className="text-xs text-muted-foreground">Copiar</span>
          </button>

          {/* Crear Ticket */}
          <button
            onClick={handleCreateTicket}
            className="w-full flex items-center gap-4 bg-purple-500/10 hover:bg-purple-500/20 active:scale-[0.98] transition-all rounded-xl p-4"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">Crear Ticket</p>
              <p className="text-xs text-muted-foreground">Respuesta en 24h</p>
            </div>
          </button>

          {/* Horario */}
          <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Lun-Vie 9:00 - 18:00</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupportContactModal;
