import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileSignature } from 'lucide-react';
import { 
  usePlantillasContrato, 
  useGenerarContrato, 
  CONTRATO_LABELS, 
  TipoContrato,
  getDatosInterpolacion
} from '@/hooks/useContratosCandidato';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidatoId: string;
  candidatoNombre: string;
  tipoContrato: TipoContrato;
  onSuccess: () => void;
}

export function ContractGenerateDialog({ 
  open, 
  onOpenChange, 
  candidatoId, 
  candidatoNombre,
  tipoContrato,
  onSuccess 
}: Props) {
  const [datos, setDatos] = useState<Record<string, string>>({});
  const { data: plantillas } = usePlantillasContrato();
  const generarContrato = useGenerarContrato();

  const plantilla = plantillas?.find(p => p.tipo_contrato === tipoContrato);

  useEffect(() => {
    // Cargar datos del candidato
    const loadCandidatoData = async () => {
      const { data: candidato } = await supabase
        .from('candidatos_custodios')
        .select('*')
        .eq('id', candidatoId)
        .single();

      if (candidato) {
        const datosBase = getDatosInterpolacion({
          nombre: candidato.nombre,
          email: candidato.email || undefined,
          telefono: candidato.telefono || undefined
        });
        setDatos(datosBase);
      }
    };

    if (open && candidatoId) {
      loadCandidatoData();
    }
  }, [open, candidatoId, candidatoNombre]);

  const handleSubmit = async () => {
    if (!plantilla) return;

    await generarContrato.mutateAsync({
      candidatoId,
      tipoContrato,
      plantillaId: plantilla.id,
      datosInterpolados: datos
    });

    onSuccess();
  };

  const variablesRequeridas = plantilla?.variables_requeridas || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Generar {CONTRATO_LABELS[tipoContrato]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verifica los datos que se incluirán en el contrato:
          </p>

          {variablesRequeridas.map((variable) => (
            <div key={variable} className="space-y-1">
              <Label htmlFor={variable} className="text-sm capitalize">
                {variable.replace(/_/g, ' ')}
              </Label>
              <Input
                id={variable}
                value={datos[variable] || ''}
                onChange={(e) => setDatos(prev => ({ ...prev, [variable]: e.target.value }))}
                placeholder={`Ingresa ${variable.replace(/_/g, ' ')}`}
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generarContrato.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={generarContrato.isPending}>
              {generarContrato.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Generar Contrato
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
