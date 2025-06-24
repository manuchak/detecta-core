
import { ProductoFormOdoo } from './ProductoFormOdoo';
import type { ProductoInventario } from '@/types/wms';

interface ProductoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto?: ProductoInventario | null;
  onClose: () => void;
}

export const ProductoDialog = ({ open, onOpenChange, producto, onClose }: ProductoDialogProps) => {
  return (
    <ProductoFormOdoo
      open={open}
      onOpenChange={onOpenChange}
      producto={producto}
      onClose={onClose}
    />
  );
};
