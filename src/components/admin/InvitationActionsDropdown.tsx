import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useCustodianInvitations } from '@/hooks/useCustodianInvitations';
import { useKapsoWhatsApp } from '@/hooks/useKapsoWhatsApp';
import { 
  MoreHorizontal, 
  Copy, 
  Mail, 
  RefreshCw, 
  Edit2, 
  MessageCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { EditInvitationEmailModal } from './EditInvitationEmailModal';

interface InvitationActionsDropdownProps {
  invitation: {
    id: string;
    token: string;
    email: string | null;
    nombre: string | null;
    telefono: string | null;
    used_at: string | null;
    expires_at: string;
    delivery_status: string | null;
  };
}

export const InvitationActionsDropdown = ({ invitation }: InvitationActionsDropdownProps) => {
  const { toast } = useToast();
  const { getInvitationLink, resendInvitation, renewToken } = useCustodianInvitations();
  const { sendCustodianInvitation, isSending: isSendingWhatsApp } = useKapsoWhatsApp();
  const [showEditModal, setShowEditModal] = useState(false);

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isUsed = !!invitation.used_at;
  const canResend = invitation.email && !isUsed;
  const canRenew = isExpired || isUsed;
  const isBounced = invitation.delivery_status === 'bounced';

  const handleCopyLink = async () => {
    try {
      const link = getInvitationLink(invitation.token);
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Link copiado',
        description: 'El link ha sido copiado al portapapeles.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo copiar el link.',
        variant: 'destructive',
      });
    }
  };

  const handleResend = async () => {
    if (!invitation.email) return;
    try {
      await resendInvitation.mutateAsync({
        invitationId: invitation.id,
        email: invitation.email,
        nombre: invitation.nombre || 'Custodio',
      });
      toast({
        title: 'Email reenviado',
        description: `Se reenvió la invitación a ${invitation.email}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRenewToken = async () => {
    try {
      await renewToken.mutateAsync(invitation.id);
      toast({
        title: 'Token renovado',
        description: 'Se generó un nuevo link válido por 30 días.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleWhatsApp = async () => {
    const link = getInvitationLink(invitation.token);
    
    // Si tiene teléfono, enviar via Kapso (template oficial)
    if (invitation.telefono) {
      try {
        await sendCustodianInvitation(
          invitation.telefono,
          invitation.nombre || 'Custodio',
          link,
          invitation.id
        );
        toast({
          title: 'WhatsApp enviado',
          description: `Invitación enviada a ${invitation.nombre || 'custodio'} via Kapso`,
        });
      } catch (error) {
        // Si Kapso falla, usar fallback manual
        console.warn('Kapso falló, usando fallback wa.me:', error);
        openWhatsAppFallback();
      }
    } else {
      // Sin teléfono, abrir wa.me para compartir manualmente
      openWhatsAppFallback();
    }
  };

  const openWhatsAppFallback = () => {
    const link = getInvitationLink(invitation.token);
    const message = encodeURIComponent(
      `¡Hola ${invitation.nombre || ''}! 🎉\n\n` +
      `Ya eres parte del equipo de custodios de Detecta.\n\n` +
      `Para activar tu cuenta y acceder a tu portal personal, usa este link:\n\n` +
      `${link}\n\n` +
      `⚠️ Este link es personal y expira en 30 días.`
    );
    
    let phone = invitation.telefono || '';
    phone = phone.replace(/\D/g, '');
    if (phone && !phone.startsWith('52')) {
      phone = '52' + phone;
    }
    
    const whatsappUrl = phone 
      ? `https://wa.me/${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar link
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleWhatsApp} disabled={isSendingWhatsApp}>
            {isSendingWhatsApp ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4 mr-2" />
            )}
            Enviar por WhatsApp
          </DropdownMenuItem>

          {canResend && (
            <DropdownMenuItem onClick={handleResend} disabled={resendInvitation.isPending}>
              <Mail className="h-4 w-4 mr-2" />
              Reenviar email
            </DropdownMenuItem>
          )}

          {isBounced && (
            <DropdownMenuItem onClick={() => setShowEditModal(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Editar email
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {canRenew && (
            <DropdownMenuItem onClick={handleRenewToken} disabled={renewToken.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Renovar token
            </DropdownMenuItem>
          )}

          <DropdownMenuItem 
            onClick={() => window.open(getInvitationLink(invitation.token), '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditInvitationEmailModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        invitationId={invitation.id}
        currentEmail={invitation.email}
        nombre={invitation.nombre}
      />
    </>
  );
};

export default InvitationActionsDropdown;
