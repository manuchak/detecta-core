import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreateMidot, useUpdateMidot, EvaluacionMidot } from '@/hooks/useEvaluacionesMidot';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MidotResultFormProps {
  candidatoId: string;
  evaluacionExistente?: EvaluacionMidot;
  onSuccess?: () => void;
}

export function MidotResultForm({ candidatoId, evaluacionExistente, onSuccess }: MidotResultFormProps) {
  const createMidot = useCreateMidot();
  const updateMidot = useUpdateMidot();
  const isEditMode = !!evaluacionExistente;

  const [scores, setScores] = useState({
    integridad: evaluacionExistente?.score_integridad ?? 50,
    honestidad: evaluacionExistente?.score_honestidad ?? 50,
    lealtad: evaluacionExistente?.score_lealtad ?? 50,
  });
  const [notas, setNotas] = useState(evaluacionExistente?.notas ?? '');
  const [fechaEvaluacion, setFechaEvaluacion] = useState(
    evaluacionExistente?.fecha_evaluacion?.split('T')[0] ?? new Date().toISOString().split('T')[0]
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const scoreGlobal = Math.round((scores.integridad + scores.honestidad + scores.lealtad) / 3);
  const semaforo = scoreGlobal >= 70 ? 'verde' : scoreGlobal >= 50 ? 'ambar' : 'rojo';

  const semaforoColors: Record<string, string> = {
    verde: 'text-emerald-600',
    ambar: 'text-amber-600',
    rojo: 'text-red-600',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    }
  };

  const handleSubmit = async () => {
    try {
      let pdfUrl: string | undefined = evaluacionExistente?.reporte_pdf_url ?? undefined;

      if (pdfFile) {
        setUploading(true);
        const fileName = `midot/${candidatoId}/${Date.now()}_${pdfFile.name.replace(/\s+/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('candidato-documentos')
          .upload(fileName, pdfFile);

        if (uploadError) {
          setUploading(false);
          toast({ title: 'Error al subir PDF', description: uploadError.message, variant: 'destructive' });
          return;
        }

        const { data: urlData } = supabase.storage
          .from('candidato-documentos')
          .getPublicUrl(fileName);
        pdfUrl = urlData.publicUrl;
        setUploading(false);
      }

      if (isEditMode) {
        await updateMidot.mutateAsync({
          id: evaluacionExistente.id,
          candidato_id: candidatoId,
          score_integridad: scores.integridad,
          score_honestidad: scores.honestidad,
          score_lealtad: scores.lealtad,
          reporte_pdf_url: pdfUrl,
          notas: notas || undefined,
          fecha_evaluacion: fechaEvaluacion,
        });
      } else {
        await createMidot.mutateAsync({
          candidato_id: candidatoId,
          score_integridad: scores.integridad,
          score_honestidad: scores.honestidad,
          score_lealtad: scores.lealtad,
          reporte_pdf_url: pdfUrl,
          notas: notas || undefined,
          fecha_evaluacion: fechaEvaluacion,
        });
      }

      onSuccess?.();
    } catch (error) {
      // Hook onError already shows toast; ensure uploading state is clean
      setUploading(false);
    }
  };

  const isSubmitting = createMidot.isPending || updateMidot.isPending || uploading;
  const pdfReady = isEditMode ? (!!pdfFile || !!evaluacionExistente?.reporte_pdf_url) : !!pdfFile;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">
          {isEditMode ? 'Editar Evaluación Midot' : 'Registrar Evaluación Midot'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Fecha */}
        <div className="space-y-1.5">
          <Label>Fecha del examen</Label>
          <Input type="date" value={fechaEvaluacion} onChange={e => setFechaEvaluacion(e.target.value)} />
        </div>

        {/* Scores */}
        {(['integridad', 'honestidad', 'lealtad'] as const).map(key => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="capitalize">{key}</Label>
              <span className="text-sm font-semibold tabular-nums">{scores[key]}</span>
            </div>
            <Slider
              value={[scores[key]]}
              onValueChange={([v]) => setScores(prev => ({ ...prev, [key]: v }))}
              max={100}
              step={1}
            />
          </div>
        ))}

        {/* Score Global */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
          <span className="text-sm font-medium">Score Global</span>
          <div className="flex items-center gap-2">
            <span className={cn('text-lg font-bold tabular-nums', semaforoColors[semaforo])}>
              {scoreGlobal}
            </span>
            <Badge variant="outline" className={cn(
              semaforo === 'verde' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
              semaforo === 'ambar' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
              'bg-red-500/15 text-red-700 border-red-500/30'
            )}>
              {semaforo === 'verde' ? 'Aprobado' : semaforo === 'ambar' ? 'Condicional' : 'Rechazado'}
            </Badge>
          </div>
        </div>

        {/* PDF Upload */}
        <div className="space-y-1.5">
          <Label>{isEditMode ? 'Reporte PDF (cambiar opcional)' : 'Reporte PDF (obligatorio)'}</Label>
          <div className="flex items-center gap-2">
            <label className="flex-1 cursor-pointer">
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors',
                pdfFile ? 'border-primary/50 bg-primary/5' : 'border-dashed hover:bg-muted/50'
              )}>
                {pdfFile ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{pdfFile.name}</span>
                  </>
                ) : isEditMode && evaluacionExistente?.reporte_pdf_url ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate">PDF actual — click para cambiar</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Seleccionar PDF...</span>
                  </>
                )}
              </div>
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <Label>Notas del evaluador</Label>
          <Textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            placeholder="Observaciones adicionales..."
            rows={3}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !pdfReady}
          className="w-full"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
          {isEditMode ? 'Guardar Cambios' : 'Guardar Evaluación'}
        </Button>
      </CardContent>
    </Card>
  );
}
