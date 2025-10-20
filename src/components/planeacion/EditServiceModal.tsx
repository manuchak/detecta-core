import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import { EditServiceForm, EditableService } from './EditServiceForm';

export type { EditableService };

interface EditServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: EditableService | null;
  onSave: (id: string, data: Partial<EditableService>) => Promise<void>;
  isLoading?: boolean;
}

export function EditServiceModal({
  open,
  onOpenChange,
  service,
  onSave,
  isLoading = false
}: EditServiceModalProps) {
  const handleSave = async (id: string, data: Partial<EditableService>) => {
    await onSave(id, data);
    onOpenChange(false);
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Servicio - {service.id_servicio}
          </DialogTitle>
        </DialogHeader>
        
        <EditServiceForm
          service={service}
          onSave={handleSave}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}