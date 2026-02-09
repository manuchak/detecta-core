import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Brain, Copy, Check, Clock, Link2, MessageCircle, Mail, ExternalLink, AlertCircle } from 'lucide-react';
import { useSIERCPInvitations } from '@/hooks/useSIERCPInvitations';
import { AssignedLead } from '@/types/leadTypes';
import { toast } from '@/hooks/use-toast';
import type { SendVia } from '@/types/siercpInvitationTypes';

interface SendSIERCPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: AssignedLead;
}

export function SendSIERCPDialog({ open, onOpenChange, lead }: SendSIERCPDialogProps) {
  const [copied, setCopied] = useState(false);
  const [expiresHours, setExpiresHours] = useState(72);
  
  const { 
    activeInvitation, 
    isLoading, 
    createInvitation, 
    markAsSent, 
    cancelInvitation,
    getInvitationUrl 
  } = useSIERCPInvitations(lead.lead_id);

  const invitationUrl = activeInvitation ? getInvitationUrl(activeInvitation.token) : null;

  const handleCreateInvitation = async () => {
    await createInvitation.mutateAsync({
      lead_id: lead.lead_id,
      candidato_custodio_id: lead.candidato_custodio_id,
      lead_nombre: lead.lead_nombre,
      lead_email: lead.lead_email,
      lead_telefono: lead.lead_telefono,
      expires_hours: expiresHours,
    });
  };

  const handleCopyLink = async () => {
    if (!invitationUrl) return;
    
    await navigator.clipboard.writeText(invitationUrl);
    setCopied(true);
    toast({
      title: 'Enlace copiado',
      description: 'El enlace ha sido copiado al portapapeles.',
    });
    
    // Marcar como enviado manualmente
    if (activeInvitation && activeInvitation.status === 'pending') {
      await markAsSent.mutateAsync({ 
        invitationId: activeInvitation.id, 
        sendVia: 'manual' 
      });
    }
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendVia = async (via: SendVia) => {
    if (!activeInvitation || !invitationUrl) return;

    if (via === 'whatsapp' && lead.lead_telefono) {
      const message = encodeURIComponent(
        `Hola ${lead.lead_nombre}, te invitamos a completar tu evaluación SIERCP.\n\nAccede aquí: ${invitationUrl}\n\nEl enlace es válido por ${expiresHours} horas.`
      );
      const phone = lead.lead_telefono.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      await markAsSent.mutateAsync({ invitationId: activeInvitation.id, sendVia: 'whatsapp' });
    } else if (via === 'email' && lead.lead_email) {
      const subject = encodeURIComponent('Evaluación SIERCP - Invitación');
      const body = encodeURIComponent(
        `Hola ${lead.lead_nombre},\n\nTe invitamos a completar tu evaluación psicométrica SIERCP.\n\nAccede aquí: ${invitationUrl}\n\nEl enlace es válido por ${expiresHours} horas.\n\nSaludos.`
      );
      window.open(`mailto:${lead.lead_email}?subject=${subject}&body=${body}`, '_blank');
      await markAsSent.mutateAsync({ invitationId: activeInvitation.id, sendVia: 'email' });
    }
  };

  const handleCancelInvitation = async () => {
    if (!activeInvitation) return;
    await cancelInvitation.mutateAsync(activeInvitation.id);
  };

  const formatExpiration = (date: string) => {
    return new Date(date).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Enviar Evaluación SIERCP
          </DialogTitle>
          <DialogDescription>
            Genera un enlace único para que {lead.lead_nombre} complete la evaluación psicométrica sin necesidad de registro.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info del candidato */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="font-medium">{lead.lead_nombre}</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              {lead.lead_email && <span>{lead.lead_email}</span>}
              {lead.lead_telefono && <span>{lead.lead_telefono}</span>}
            </div>
          </div>

          {/* Si no hay invitación activa, mostrar opción de crear */}
          {!activeInvitation && (
            <>
              <div className="space-y-2">
                <Label htmlFor="expires">Validez del enlace (horas)</Label>
                <Input
                  id="expires"
                  type="number"
                  value={expiresHours}
                  onChange={(e) => setExpiresHours(Number(e.target.value))}
                  min={1}
                  max={168}
                />
                <p className="text-xs text-muted-foreground">
                  El enlace expirará en {expiresHours} horas después de ser creado.
                </p>
              </div>

              <Button 
                onClick={handleCreateInvitation} 
                className="w-full"
                disabled={createInvitation.isPending}
              >
                <Link2 className="h-4 w-4 mr-2" />
                {createInvitation.isPending ? 'Generando...' : 'Generar Enlace de Invitación'}
              </Button>
            </>
          )}

          {/* Si hay invitación activa, mostrar enlace y opciones */}
          {activeInvitation && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Enlace de evaluación</Label>
                  <Badge variant={activeInvitation.status === 'sent' ? 'default' : 'secondary'}>
                    {activeInvitation.status === 'pending' && 'Pendiente'}
                    {activeInvitation.status === 'sent' && 'Enviado'}
                    {activeInvitation.status === 'opened' && 'Visto'}
                    {activeInvitation.status === 'started' && 'En progreso'}
                  </Badge>
                </div>
                
              {/* Primary action: Copy link */}
              <Button 
                onClick={handleCopyLink}
                className="w-full h-11 text-sm font-medium"
                variant={copied ? 'outline' : 'default'}
              >
                {copied ? <Check className="h-4 w-4 mr-2 text-success" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Enlace copiado' : 'Copiar enlace para enviar manualmente'}
              </Button>

              <div className="flex gap-2">
                <Input 
                  value={invitationUrl || ''} 
                  readOnly 
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Expira: {formatExpiration(activeInvitation.expires_at)}
              </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-muted-foreground">O enviar directamente por:</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSendVia('whatsapp')}
                    disabled={!lead.lead_telefono}
                  >
                    <MessageCircle className="h-4 w-4 mr-2 text-success" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSendVia('email')}
                    disabled={!lead.lead_email}
                  >
                    <Mail className="h-4 w-4 mr-2 text-primary" />
                    Email
                  </Button>
                </div>
              </div>

              {activeInvitation.sent_at && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Enviado vía {activeInvitation.sent_via} el{' '}
                    {new Date(activeInvitation.sent_at).toLocaleString('es-MX')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelInvitation}
                  className="text-destructive hover:text-destructive"
                >
                  Cancelar invitación
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(invitationUrl!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Vista previa
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
