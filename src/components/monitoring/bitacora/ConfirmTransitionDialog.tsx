import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ShieldAlert } from 'lucide-react';

interface ConfirmTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  /** When true, shows a checkbox the user must tick before the confirm button becomes active */
  requireDoubleConfirm?: boolean;
  doubleConfirmLabel?: string;
}

export const ConfirmTransitionDialog: React.FC<ConfirmTransitionDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  destructive = false,
  isPending = false,
  onConfirm,
  requireDoubleConfirm = true,
  doubleConfirmLabel = 'Confirmo que verifiqué esta información y es correcta',
}) => {
  const [checked, setChecked] = useState(false);

  // Reset checkbox when dialog opens/closes
  useEffect(() => {
    if (!open) setChecked(false);
  }, [open]);

  const isConfirmDisabled = isPending || (requireDoubleConfirm && !checked);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {requireDoubleConfirm && (
          <div className="flex items-start gap-3 p-3 rounded-md border border-chart-4/30 bg-chart-4/5">
            <ShieldAlert className="h-4 w-4 text-chart-4 mt-0.5 shrink-0" />
            <div className="flex items-center gap-2">
              <Checkbox
                id="double-confirm"
                checked={checked}
                onCheckedChange={(v) => setChecked(v === true)}
              />
              <Label
                htmlFor="double-confirm"
                className="text-xs text-muted-foreground cursor-pointer leading-tight"
              >
                {doubleConfirmLabel}
              </Label>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {isPending ? 'Procesando...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
