import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { XCircle } from 'lucide-react';

interface CancelServiceButtonProps {
  serviceId: string;
  serviceName: string;
  onCancel: (serviceId: string, reason?: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function CancelServiceButton({ 
  serviceId, 
  serviceName, 
  onCancel, 
  disabled = false, 
  className = "" 
}: CancelServiceButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await onCancel(serviceId, cancelReason.trim() || undefined);
      setShowConfirmDialog(false);
      setCancelReason('');
    } catch (error) {
      console.error('Error cancelling service:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDialog(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={handleClick}
        className={`apple-button-ghost-small hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity ${className}`}
      >
        <XCircle className="h-3.5 w-3.5 text-destructive" />
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="apple-card max-w-md">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="apple-text-headline text-foreground">
              ¿Cancelar servicio?
            </AlertDialogTitle>
            <AlertDialogDescription className="apple-text-body text-muted-foreground">
              Se cancelará el servicio para <strong>{serviceName}</strong>. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <label htmlFor="cancel-reason" className="apple-text-caption text-muted-foreground mb-2 block">
              Motivo de cancelación (opcional)
            </label>
            <Textarea
              id="cancel-reason"
              placeholder="Ejemplo: Cliente canceló, cambio de fecha, etc."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="apple-input resize-none h-20"
            />
          </div>

          <AlertDialogFooter className="space-x-2">
            <AlertDialogCancel 
              className="apple-button-ghost"
              disabled={isProcessing}
            >
              Mantener servicio
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isProcessing}
              className="apple-button-primary bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Cancelando...' : 'Confirmar cancelación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}