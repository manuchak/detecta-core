import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, TestTube, AlertTriangle } from 'lucide-react';
import { useCreateToxicologia } from '@/hooks/useEvaluacionesToxicologicas';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidatoId: string;
  candidatoNombre: string;
}

export function ToxicologyResultForm({ isOpen, onClose, candidatoId, candidatoNombre }: Props) {
  const [resultado, setResultado] = useState<'negativo' | 'positivo'>('negativo');
  const [laboratorio, setLaboratorio] = useState('');
  const [fechaMuestra, setFechaMuestra] = useState('');
  const [sustancias, setSustancias] = useState('');
  const [notas, setNotas] = useState('');

  const createMutation = useCreateToxicologia();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createMutation.mutateAsync({
      candidato_id: candidatoId,
      resultado,
      laboratorio: laboratorio || undefined,
      fecha_muestra: fechaMuestra ? new Date(fechaMuestra).toISOString() : undefined,
      sustancias_detectadas: resultado === 'positivo' && sustancias 
        ? sustancias.split(',').map(s => s.trim()) 
        : undefined,
      notas: notas || undefined,
    });

    onClose();
    resetForm();
  };

  const resetForm = () => {
    setResultado('negativo');
    setLaboratorio('');
    setFechaMuestra('');
    setSustancias('');
    setNotas('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Registrar Resultado Toxicológico
          </DialogTitle>
          <DialogDescription>
            Ingrese el resultado de la prueba de antidoping para {candidatoNombre}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resultado */}
          <div className="space-y-3">
            <Label>Resultado de la prueba *</Label>
            <RadioGroup value={resultado} onValueChange={(v) => setResultado(v as 'negativo' | 'positivo')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="negativo" id="negativo" />
                <Label htmlFor="negativo" className="flex-1 cursor-pointer">
                  <span className="font-medium text-green-700">✅ Negativo</span>
                  <p className="text-xs text-muted-foreground">No se detectaron sustancias</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="positivo" id="positivo" />
                <Label htmlFor="positivo" className="flex-1 cursor-pointer">
                  <span className="font-medium text-red-700">❌ Positivo</span>
                  <p className="text-xs text-muted-foreground">Se detectaron sustancias</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {resultado === 'positivo' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Un resultado positivo impedirá que el candidato continúe en el proceso.
              </AlertDescription>
            </Alert>
          )}

          {/* Sustancias detectadas (solo si positivo) */}
          {resultado === 'positivo' && (
            <div className="space-y-2">
              <Label htmlFor="sustancias">Sustancias detectadas (separadas por coma)</Label>
              <Input
                id="sustancias"
                placeholder="Ej: THC, Cocaína..."
                value={sustancias}
                onChange={(e) => setSustancias(e.target.value)}
              />
            </div>
          )}

          {/* Laboratorio */}
          <div className="space-y-2">
            <Label htmlFor="laboratorio">Laboratorio (opcional)</Label>
            <Input
              id="laboratorio"
              placeholder="Nombre del laboratorio"
              value={laboratorio}
              onChange={(e) => setLaboratorio(e.target.value)}
            />
          </div>

          {/* Fecha de muestra */}
          <div className="space-y-2">
            <Label htmlFor="fechaMuestra">Fecha de toma de muestra (opcional)</Label>
            <Input
              id="fechaMuestra"
              type="date"
              value={fechaMuestra}
              onChange={(e) => setFechaMuestra(e.target.value)}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas adicionales (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Observaciones..."
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
