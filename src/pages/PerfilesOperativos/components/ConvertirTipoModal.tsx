import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, ArrowRightLeft, Loader2 } from 'lucide-react';
import { useConvertirTipoOperativo } from '@/hooks/useConvertirTipoOperativo';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';

interface ConvertirTipoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operativo: {
    id: string;
    nombre: string;
    tipoActual: 'custodio' | 'armado';
  };
}

const TIPOS_ARMADO = [
  { value: 'interno', label: 'Interno' },
  { value: 'externo', label: 'Externo' },
  { value: 'freelance', label: 'Freelance' },
];

export function ConvertirTipoModal({ open, onOpenChange, operativo }: ConvertirTipoModalProps) {
  const [motivo, setMotivo] = useState('');
  const [tipoArmado, setTipoArmado] = useState('');
  const { userId } = useUserRole();
  const navigate = useNavigate();
  const mutation = useConvertirTipoOperativo();

  const isValid = motivo.trim().length >= 10 && tipoArmado !== '';
  const isLoading = mutation.isPending;

  const handleConfirm = async () => {
    if (!isValid || !userId) return;

    const result = await mutation.mutateAsync({
      operativoId: operativo.id,
      direccion: 'custodio_a_armado',
      motivo: motivo.trim(),
      tipoArmado,
      ejecutadoPor: userId
    });

    if (result.success) {
      onOpenChange(false);
      // Navigate to the new armado profile
      navigate(`/perfiles-operativos/armado/${result.nuevoId}`);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setMotivo('');
      setTipoArmado('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Convertir Custodio a Armado
          </DialogTitle>
          <DialogDescription>
            Esta acción es irreversible desde la interfaz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Operative Info */}
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">Operativo a convertir:</p>
            <p className="font-semibold">{operativo.nombre}</p>
          </div>

          {/* Warning List */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              Esta acción:
            </p>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              <li>• Moverá el registro a la tabla de armados</li>
              <li>• Eliminará datos específicos de custodio</li>
              <li>• No es reversible desde la interfaz</li>
            </ul>
          </div>

          {/* Tipo Armado Selector */}
          <div className="space-y-2">
            <Label htmlFor="tipo-armado">Tipo de armado *</Label>
            <Select value={tipoArmado} onValueChange={setTipoArmado} disabled={isLoading}>
              <SelectTrigger id="tipo-armado">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ARMADO.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de la conversión *</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Error de carga - registro incorrecto..."
              className="min-h-[80px]"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 10 caracteres. Este motivo quedará registrado en el historial.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Convirtiendo...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Confirmar Conversión
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
