
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Role } from '@/types/roleTypes';

interface DeleteRoleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roleToDelete: Role | null;
  onConfirmDelete: () => void;
}

export const DeleteRoleDialog: React.FC<DeleteRoleDialogProps> = ({
  isOpen,
  onOpenChange,
  roleToDelete,
  onConfirmDelete
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Rol</DialogTitle>
          <DialogDescription>
            ¿Está seguro que desea eliminar el rol "{roleToDelete}"? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirmDelete}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
