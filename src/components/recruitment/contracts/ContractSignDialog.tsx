import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, FileSignature, RotateCcw, Check } from 'lucide-react';
import { useFirmarContrato, useMarcarVisto, CONTRATO_LABELS, ContratoCandidato } from '@/hooks/useContratosCandidato';

interface Props {
  contrato: ContratoCandidato;
  candidatoId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContractSignDialog({ contrato, candidatoId, onClose, onSuccess }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [readContract, setReadContract] = useState(false);

  const firmarContrato = useFirmarContrato();
  const marcarVisto = useMarcarVisto();

  // Marcar como visto cuando se abre
  useEffect(() => {
    if (contrato.estado === 'enviado') {
      marcarVisto.mutate({ contratoId: contrato.id, candidatoId });
    }
  }, [contrato.id, contrato.estado]);

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Configurar estilo de línea
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const firmaDataUrl = canvas.toDataURL('image/png');

    await firmarContrato.mutateAsync({
      contratoId: contrato.id,
      candidatoId,
      firmaDataUrl
    });

    onSuccess();
  };

  const canSign = hasSignature && acceptedTerms && readContract;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Firmar {CONTRATO_LABELS[contrato.tipo_contrato]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contenido del contrato */}
          <div className="border rounded-lg">
            <ScrollArea className="h-[300px] p-4">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: contrato.contenido_html || '' }}
              />
            </ScrollArea>
          </div>

          {/* Checkbox de lectura */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="read" 
              checked={readContract}
              onCheckedChange={(checked) => setReadContract(checked === true)}
            />
            <Label htmlFor="read" className="text-sm cursor-pointer">
              He leído el contrato completo
            </Label>
          </div>

          {/* Área de firma */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Firma aquí:</Label>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearSignature}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            </div>
            <div className="border-2 border-dashed rounded-lg p-1 bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={150}
                className="w-full h-[150px] cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            {!hasSignature && (
              <p className="text-xs text-muted-foreground text-center">
                Usa el mouse o tu dedo para firmar
              </p>
            )}
          </div>

          {/* Checkbox de aceptación */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer">
              Acepto los términos y condiciones de este contrato
            </Label>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={firmarContrato.isPending}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSign} 
              disabled={!canSign || firmarContrato.isPending}
            >
              {firmarContrato.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Firmando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Firmar Contrato
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
