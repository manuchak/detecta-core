import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Link, AlertTriangle } from 'lucide-react';

interface RecoveryLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryLink: string;
  userEmail: string;
}

export const RecoveryLinkDialog: React.FC<RecoveryLinkDialogProps> = ({
  open, onOpenChange, recoveryLink, userEmail
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryLink);
      setCopied(true);
      toast({ title: 'Link copiado', description: 'Puedes pegarlo en WhatsApp o mensaje' });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: 'Error', description: 'No se pudo copiar al portapapeles', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link de Recuperación
          </DialogTitle>
          <DialogDescription>
            Link generado para <strong>{userEmail}</strong>. Compártelo de forma segura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              readOnly
              value={recoveryLink}
              className="text-xs font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Este link expira en 1 hora. Compártelo únicamente con el usuario por un canal seguro.</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handleCopy}>
            {copied ? (
              <><Check className="h-4 w-4 mr-2" /> Copiado</>
            ) : (
              <><Copy className="h-4 w-4 mr-2" /> Copiar Link</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
