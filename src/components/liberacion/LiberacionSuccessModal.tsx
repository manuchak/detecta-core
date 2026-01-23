import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  MessageCircle, 
  Mail,
  Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LiberacionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    candidato_nombre: string;
    candidato_email: string | null;
    candidato_telefono: string | null;
    invitation_token: string;
    emailSent: boolean;
  };
}

// ✅ FIX: Validar formato de email para mostrar estado correcto
const isValidEmail = (email: string | null): boolean => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const LiberacionSuccessModal = ({
  isOpen,
  onClose,
  data
}: LiberacionSuccessModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Validar si el email es realmente válido
  const emailIsValid = isValidEmail(data.candidato_email);

  const invitationLink = `${window.location.origin}/auth/registro-custodio?token=${data.invitation_token}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setCopied(true);
      toast({
        title: 'Link copiado',
        description: 'El link de invitación ha sido copiado al portapapeles'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo copiar el link',
        variant: 'destructive'
      });
    }
  };

  const handleSendWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Hola ${data.candidato_nombre}! 🎉\n\n` +
      `Has sido aprobado como custodio en Detecta.\n\n` +
      `Para completar tu registro y acceder al portal de custodios, usa este link:\n\n` +
      `${invitationLink}\n\n` +
      `Este link es personal y expira en 7 días.`
    );
    
    // Limpiar número de teléfono (solo dígitos)
    const phoneNumber = data.candidato_telefono?.replace(/\D/g, '') || '';
    
    // Si tiene teléfono, abrir WhatsApp con el número
    if (phoneNumber) {
      // Agregar código de país México si no lo tiene
      const fullPhone = phoneNumber.startsWith('52') ? phoneNumber : `52${phoneNumber}`;
      window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
    } else {
      // Si no tiene teléfono, abrir WhatsApp sin número (usuario selecciona)
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            ¡Custodio Liberado Exitosamente!
          </DialogTitle>
          <DialogDescription className="text-center">
            <span className="font-medium text-foreground">{data.candidato_nombre}</span> 
            {' '}ha sido activado y está listo para recibir servicios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Estado del email - ✅ FIX: Validar formato de email */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Correo de invitación</p>
              {data.emailSent && emailIsValid ? (
                <p className="text-xs text-green-600">
                  ✓ Enviado a {data.candidato_email}
                </p>
              ) : emailIsValid ? (
                <p className="text-xs text-amber-600">
                  No se pudo enviar automáticamente - Enviar manualmente a {data.candidato_email}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sin email válido registrado - Enviar por WhatsApp
                </p>
              )}
            </div>
            {data.emailSent && emailIsValid && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Enviado
              </Badge>
            )}
          </div>

          {/* Link de invitación */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Link de registro:</label>
            <div className="flex gap-2">
              <Input 
                value={invitationLink} 
                readOnly 
                className="text-xs bg-muted/30"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Opción WhatsApp - ✅ FIX: Mostrar si no se envió email O si el email no es válido */}
          {(!data.emailSent || !emailIsValid) && (
            <div className="pt-2">
              <Button
                onClick={handleSendWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar por WhatsApp
                {data.candidato_telefono && (
                  <span className="ml-2 text-xs opacity-80">
                    ({data.candidato_telefono})
                  </span>
                )}
              </Button>
            </div>
          )}

          {/* Contacto del custodio */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
            <Phone className="h-4 w-4" />
            <span>{data.candidato_telefono || 'Sin teléfono registrado'}</span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LiberacionSuccessModal;
