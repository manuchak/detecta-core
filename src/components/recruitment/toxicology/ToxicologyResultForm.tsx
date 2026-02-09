import { useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, TestTube, AlertTriangle } from 'lucide-react';
import { useCreateToxicologia } from '@/hooks/useEvaluacionesToxicologicas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { DraftIndicator } from '@/components/ui/DraftIndicator';
import { EvidenceCapture } from '@/components/shared/EvidenceCapture';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidatoId: string;
  candidatoNombre: string;
}

interface ToxicologyFormData {
  resultado: 'negativo' | 'positivo';
  laboratorio: string;
  fechaMuestra: string;
  sustancias: string;
  notas: string;
  evidenceUrls: string[];
}

const initialData: ToxicologyFormData = {
  resultado: 'negativo',
  laboratorio: '',
  fechaMuestra: '',
  sustancias: '',
  notas: '',
  evidenceUrls: [],
};

export function ToxicologyResultForm({ isOpen, onClose, candidatoId, candidatoNombre }: Props) {
  // Persistence hook - key includes candidatoId for uniqueness
  const persistence = useFormPersistence<ToxicologyFormData>({
    key: `toxicology_result_${candidatoId}`,
    initialData,
    level: 'standard',
    isMeaningful: (data) => !!(data.laboratorio || data.fechaMuestra || data.notas),
    ttl: 2 * 60 * 60 * 1000, // 2 hours
  });

  const { data, updateData, hasDraft, hasUnsavedChanges, lastSaved, getTimeSinceSave, clearDraft } = persistence;

  const createMutation = useCreateToxicologia();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createMutation.mutateAsync({
      candidato_id: candidatoId,
      resultado: data.resultado,
      laboratorio: data.laboratorio || undefined,
      fecha_muestra: data.fechaMuestra ? new Date(data.fechaMuestra).toISOString() : undefined,
      sustancias_detectadas: data.resultado === 'positivo' && data.sustancias 
        ? data.sustancias.split(',').map(s => s.trim()) 
        : undefined,
      archivo_url: data.evidenceUrls.length > 0 ? data.evidenceUrls[0] : undefined,
      notas: data.notas || undefined,
    });

    clearDraft(true);
    onClose();
  };

  const handleClose = useCallback(async () => {
    if (hasUnsavedChanges) {
      const discard = await persistence.confirmDiscard();
      if (!discard) return;
    }
    onClose();
  }, [hasUnsavedChanges, persistence, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Registrar Resultado Toxicológico
            </DialogTitle>
            <DraftIndicator
              hasDraft={hasDraft}
              hasUnsavedChanges={hasUnsavedChanges}
              lastSaved={lastSaved}
              getTimeSinceSave={getTimeSinceSave}
              variant="minimal"
            />
          </div>
          <DialogDescription>
            Ingrese el resultado de la prueba de antidoping para {candidatoNombre}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resultado */}
          <div className="space-y-3">
            <Label>Resultado de la prueba *</Label>
            <RadioGroup value={data.resultado} onValueChange={(v) => updateData({ resultado: v as 'negativo' | 'positivo' })}>
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer min-h-[48px]">
                <RadioGroupItem value="negativo" id="negativo" />
                <Label htmlFor="negativo" className="flex-1 cursor-pointer">
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">✅ Negativo</span>
                  <p className="text-xs text-muted-foreground">No se detectaron sustancias</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer min-h-[48px]">
                <RadioGroupItem value="positivo" id="positivo" />
                <Label htmlFor="positivo" className="flex-1 cursor-pointer">
                  <span className="font-medium text-destructive">❌ Positivo</span>
                  <p className="text-xs text-muted-foreground">Se detectaron sustancias</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {data.resultado === 'positivo' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Un resultado positivo impedirá que el candidato continúe en el proceso.
              </AlertDescription>
            </Alert>
          )}

          {/* Sustancias detectadas (solo si positivo) */}
          {data.resultado === 'positivo' && (
            <div className="space-y-2">
              <Label htmlFor="sustancias">Sustancias detectadas (separadas por coma)</Label>
              <Input
                id="sustancias"
                placeholder="Ej: THC, Cocaína..."
                value={data.sustancias}
                onChange={(e) => updateData({ sustancias: e.target.value })}
              />
            </div>
          )}

          {/* Laboratorio */}
          <div className="space-y-2">
            <Label htmlFor="laboratorio">Laboratorio (opcional)</Label>
            <Input
              id="laboratorio"
              placeholder="Nombre del laboratorio"
              value={data.laboratorio}
              onChange={(e) => updateData({ laboratorio: e.target.value })}
            />
          </div>

          {/* Fecha de muestra */}
          <div className="space-y-2">
            <Label htmlFor="fechaMuestra">Fecha de toma de muestra (opcional)</Label>
            <Input
              id="fechaMuestra"
              type="date"
              value={data.fechaMuestra}
              onChange={(e) => updateData({ fechaMuestra: e.target.value })}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas adicionales (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Observaciones..."
              value={data.notas}
              onChange={(e) => updateData({ notas: e.target.value })}
              rows={2}
              className="sm:h-auto h-12"
            />
          </div>

          {/* Evidence capture */}
          <EvidenceCapture
            bucket="candidato-documentos"
            storagePath={`toxicologia/${candidatoId}`}
            maxPhotos={3}
            existingUrls={data.evidenceUrls}
            onPhotosChange={(urls) => updateData({ evidenceUrls: urls })}
            label="📸 Evidencia del resultado (opcional)"
          />

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto h-12 sm:h-10">
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto h-12 sm:h-10">
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
