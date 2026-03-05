import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { ConfirmTransitionDialog } from '@/components/monitoring/bitacora/ConfirmTransitionDialog';

interface Props {
  unassignedCount: number;
  monitoristaCount: number;
  isPending: boolean;
  onDistribute: () => void;
}

export const AutoDistributeButton: React.FC<Props> = ({
  unassignedCount, monitoristaCount, isPending, onDistribute,
}) => {
  const [confirm, setConfirm] = useState(false);
  const disabled = unassignedCount === 0 || monitoristaCount === 0 || isPending;

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="w-full gap-2 h-9"
        disabled={disabled}
        onClick={() => setConfirm(true)}
      >
        <Zap className="h-3.5 w-3.5" />
        Auto-distribuir ({unassignedCount})
      </Button>

      <ConfirmTransitionDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Distribuir servicios automáticamente"
        description={`Se asignarán ${unassignedCount} servicios equitativamente entre ${monitoristaCount} monitoristas en turno.`}
        confirmLabel="Distribuir"
        isPending={isPending}
        onConfirm={() => {
          onDistribute();
          setConfirm(false);
        }}
      />
    </>
  );
};
