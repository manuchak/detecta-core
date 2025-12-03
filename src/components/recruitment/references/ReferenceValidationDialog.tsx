import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Phone, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useValidateReferencia, type Referencia } from '@/hooks/useReferencias';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  referencia: Referencia;
}

export function ReferenceValidationDialog({ isOpen, onClose, referencia }: Props) {
  const [resultado, setResultado] = useState<'positiva' | 'negativa' | 'no_contactado' | 'invalida'>('positiva');
  const [comentarios, setComentarios] = useState('');
  const [calificacion, setCalificacion] = useState('');
  const [redFlags, setRedFlags] = useState('');
  const [notas, setNotas] = useState('');

  const validateMutation = useValidateReferencia();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await validateMutation.mutateAsync({
      id: referencia.id,
      resultado,
      comentarios_referencia: comentarios || undefined,
      calificacion: calificacion ? parseInt(calificacion) : undefined,
      red_flags: redFlags ? redFlags.split(',').map(s => s.trim()) : undefined,
      notas_validador: notas || undefined,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Validar Referencia
          </DialogTitle>
          <DialogDescription>
            Registre el resultado de la llamada a {referencia.nombre_referencia}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info de la referencia */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <p><strong>{referencia.nombre_referencia}</strong></p>
            <p className="text-muted-foreground">
              {referencia.relacion}
              {referencia.empresa_institucion && ` • ${referencia.empresa_institucion}`}
            </p>
            {referencia.telefono && <p className="text-muted-foreground">📞 {referencia.telefono}</p>}
          </div>

          {/* Resultado */}
          <div className="space-y-3">
            <Label>Resultado de la validación *</Label>
            <RadioGroup value={resultado} onValueChange={(v) => setResultado(v as typeof resultado)}>
              <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="positiva" id="positiva" />
                <Label htmlFor="positiva" className="flex-1 cursor-pointer flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Positiva</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="negativa" id="negativa" />
                <Label htmlFor="negativa" className="flex-1 cursor-pointer flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Negativa</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="no_contactado" id="no_contactado" />
                <Label htmlFor="no_contactado" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Phone className="h-4 w-4 text-amber-600" />
                  <span>No contactado</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="invalida" id="invalida" />
                <Label htmlFor="invalida" className="flex-1 cursor-pointer flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gray-600" />
                  <span>Inválida (datos incorrectos)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Calificación (1-5) */}
          {(resultado === 'positiva' || resultado === 'negativa') && (
            <div className="space-y-2">
              <Label htmlFor="calificacion">Calificación (1-5)</Label>
              <Input
                id="calificacion"
                type="number"
                min="1"
                max="5"
                placeholder="1 = Muy mala, 5 = Excelente"
                value={calificacion}
                onChange={(e) => setCalificacion(e.target.value)}
              />
            </div>
          )}

          {/* Comentarios de la referencia */}
          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentarios de la referencia</Label>
            <Textarea
              id="comentarios"
              placeholder="¿Qué dijo la referencia sobre el candidato?"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={3}
            />
          </div>

          {/* Red flags */}
          {resultado === 'negativa' && (
            <div className="space-y-2">
              <Label htmlFor="redFlags">Banderas rojas (separadas por coma)</Label>
              <Input
                id="redFlags"
                placeholder="Ej: Problemas de puntualidad, Conflictos..."
                value={redFlags}
                onChange={(e) => setRedFlags(e.target.value)}
              />
            </div>
          )}

          {/* Notas del validador */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas adicionales</Label>
            <Textarea
              id="notas"
              placeholder="Observaciones internas..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={validateMutation.isPending}>
              {validateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Validación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
