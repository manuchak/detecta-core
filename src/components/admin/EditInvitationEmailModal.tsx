import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useCustodianInvitations } from '@/hooks/useCustodianInvitations';
import { Loader2, Mail } from 'lucide-react';

interface EditInvitationEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitationId: string;
  currentEmail: string | null;
  nombre: string | null;
}

export const EditInvitationEmailModal = ({
  open,
  onOpenChange,
  invitationId,
  currentEmail,
  nombre,
}: EditInvitationEmailModalProps) => {
  const [email, setEmail] = useState(currentEmail || '');
  const [sendAfterUpdate, setSendAfterUpdate] = useState(true);
  const { toast } = useToast();
  const { updateInvitationEmail } = useCustodianInvitations();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor ingresa un email válido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateInvitationEmail.mutateAsync({
        invitationId,
        newEmail: email,
        resendEmail: sendAfterUpdate,
        nombre: nombre || 'Custodio',
      });
      
      toast({
        title: 'Email actualizado',
        description: sendAfterUpdate 
          ? `Se actualizó el email y se envió la invitación a ${email}` 
          : 'Se actualizó el email correctamente.',
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Editar Email de Invitación
          </DialogTitle>
          <DialogDescription>
            Corrige el email para {nombre || 'este custodio'} y reenvía la invitación.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Nuevo Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="col-span-3"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="resend"
                checked={sendAfterUpdate}
                onChange={(e) => setSendAfterUpdate(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="resend" className="text-sm font-normal">
                Enviar invitación inmediatamente
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateInvitationEmail.isPending}>
              {updateInvitationEmail.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Guardar y {sendAfterUpdate ? 'Enviar' : 'Actualizar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditInvitationEmailModal;
