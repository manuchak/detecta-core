import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { XCircle } from 'lucide-react';

// Predefined cancellation reasons - "Cancelado por cliente" allows cancelling started services
const CANCEL_REASONS = [
  { value: 'cliente_cancelo', label: 'Cancelado por cliente', allowsStartedCancellation: true },
  { value: 'cambio_fecha', label: 'Cambio de fecha/hora', allowsStartedCancellation: false },
  { value: 'falta_disponibilidad', label: 'Falta de disponibilidad', allowsStartedCancellation: false },
  { value: 'error_datos', label: 'Error en datos del servicio', allowsStartedCancellation: false },
  { value: 'duplicado', label: 'Servicio duplicado', allowsStartedCancellation: false },
  { value: 'otro', label: 'Otro motivo', allowsStartedCancellation: false },
] as const;

interface CancelServiceButtonProps {
  serviceId: string;
  serviceName: string;
  onCancel: (serviceId: string, reason?: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  serviceStarted?: boolean; // Optional: indicate if service has started
}

export function CancelServiceButton({ 
  serviceId, 
  serviceName, 
  onCancel, 
  disabled = false, 
  className = "",
  serviceStarted = false
}: CancelServiceButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (showConfirmDialog) {
      document.body.dataset.dialogOpen = "1";
    } else {
      setTimeout(() => delete document.body.dataset.dialogOpen, 150);
    }
  }, [showConfirmDialog]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!showConfirmDialog) {
      setSelectedReason('');
      setCustomReason('');
    }
  }, [showConfirmDialog]);

  const selectedReasonConfig = CANCEL_REASONS.find(r => r.value === selectedReason);
  const canCancelStarted = selectedReasonConfig?.allowsStartedCancellation ?? false;
  
  // If service started, only allow cancellation with specific reasons
  const canProceed = selectedReason && (!serviceStarted || canCancelStarted);

  const getFinalReason = () => {
    if (selectedReason === 'otro') {
      return customReason.trim() || 'Otro motivo';
    }
    const reason = CANCEL_REASONS.find(r => r.value === selectedReason);
    return reason?.label || selectedReason;
  };

  const handleCancel = async () => {
    if (!canProceed) return;
    
    setIsProcessing(true);
    try {
      await onCancel(serviceId, getFinalReason());
      setShowConfirmDialog(false);
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
        className={`apple-button-ghost-small hover:bg-destructive/10 transition-opacity ${
          showConfirmDialog ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100'
        } ${className}`}
      >
        <XCircle className="h-3.5 w-3.5 text-destructive" />
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent 
          className="apple-card max-w-md"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onEscapeKeyDown={(e) => e.stopPropagation()}
        >
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="apple-text-headline text-foreground">
              ¿Cancelar servicio?
            </AlertDialogTitle>
            <AlertDialogDescription className="apple-text-body text-muted-foreground">
              Se cancelará el servicio para <strong>{serviceName}</strong>. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Reason selector */}
            <div className="space-y-2">
              <label className="apple-text-caption text-muted-foreground block">
                Motivo de cancelación <span className="text-destructive">*</span>
              </label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                      {reason.allowsStartedCancellation && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (permite cancelar iniciados)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom reason text area - only show when "Otro" is selected */}
            {selectedReason === 'otro' && (
              <div className="space-y-2">
                <label htmlFor="custom-reason" className="apple-text-caption text-muted-foreground block">
                  Especificar motivo
                </label>
                <Textarea
                  id="custom-reason"
                  placeholder="Describe el motivo de cancelación..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="apple-input resize-none h-20"
                />
              </div>
            )}

            {/* Warning for started services */}
            {serviceStarted && selectedReason && !canCancelStarted && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Este servicio ya inició. Solo se puede cancelar si el motivo es "Cancelado por cliente".
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter className="space-x-2">
            <AlertDialogCancel 
              className="apple-button-ghost"
              disabled={isProcessing}
              onClick={(e) => e.stopPropagation()}
            >
              Mantener servicio
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              disabled={isProcessing || !canProceed}
              className="apple-button-primary bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isProcessing ? 'Cancelando...' : 'Confirmar cancelación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
