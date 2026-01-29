import { useState, useEffect } from 'react';
import { Loader2, MapPin, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdvancedFieldsCollapsible } from './AdvancedFieldsCollapsible';
import { InverseRouteAlert } from './InverseRouteAlert';
import { useRouteCreation, RouteCreationData, InverseRouteInfo } from '../hooks/useRouteCreation';
import { PricingResult } from '../hooks/useRouteSubSteps';

interface InlineRouteCreationFormProps {
  cliente: string;
  origen: string;
  destino: string;
  onSuccess: (result: PricingResult) => void;
  onCancel: () => void;
}

const TIPO_SERVICIO_OPTIONS = [
  { value: 'ARMADA', label: 'Custodia Armada' },
  { value: 'SIN_ARMA', label: 'Custodia Sin Arma' },
  { value: 'REPARTO', label: 'Ruta de Reparto' },
];

export function InlineRouteCreationForm({
  cliente,
  origen,
  destino,
  onSuccess,
  onCancel,
}: InlineRouteCreationFormProps) {
  const { createRoute, checkForInverseRoute, isCreating, creationError, clearError } = useRouteCreation();

  // Form state
  const [valorBruto, setValorBruto] = useState('');
  const [precioCustodio, setPrecioCustodio] = useState('');
  const [distanciaKm, setDistanciaKm] = useState('');
  const [tipoServicio, setTipoServicio] = useState('ARMADA');
  const [justificacion, setJustificacion] = useState('');
  const [costoOperativo, setCostoOperativo] = useState('');
  const [pagoCustodioSinArma, setPagoCustodioSinArma] = useState('');

  // Inverse route state
  const [inverseRoute, setInverseRoute] = useState<InverseRouteInfo>({ exists: false });
  const [isCheckingInverse, setIsCheckingInverse] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check for inverse route when component mounts or when origen/destino change
  useEffect(() => {
    const checkInverse = async () => {
      if (!cliente || !origen || !destino) return;

      setIsCheckingInverse(true);
      const result = await checkForInverseRoute(cliente, origen, destino);
      setInverseRoute(result);
      setIsCheckingInverse(false);
    };

    checkInverse();
  }, [cliente, origen, destino, checkForInverseRoute]);

  const handleUseInverseAsTemplate = (valorBrutoRef: number, precioCustodioRef: number) => {
    setValorBruto(valorBrutoRef.toString());
    setPrecioCustodio(precioCustodioRef.toString());
    // Add note about using inverse route as reference
    if (!justificacion.includes('ruta inversa')) {
      setJustificacion(prev => 
        prev 
          ? `${prev}\nPrecios basados en ruta inversa existente.`
          : 'Precios basados en ruta inversa existente.'
      );
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!valorBruto || parseFloat(valorBruto) <= 0) {
      newErrors.valorBruto = 'El valor bruto es requerido';
    }

    if (!precioCustodio || parseFloat(precioCustodio) <= 0) {
      newErrors.precioCustodio = 'El pago custodio es requerido';
    }

    if (!justificacion || justificacion.trim().length < 20) {
      newErrors.justificacion = 'Mínimo 20 caracteres requeridos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    const data: RouteCreationData = {
      cliente_nombre: cliente,
      origen_texto: origen,
      destino_texto: destino,
      precio_sugerido: parseFloat(valorBruto),
      precio_custodio: parseFloat(precioCustodio),
      distancia_km: distanciaKm ? parseFloat(distanciaKm) : null,
      tipo_servicio: tipoServicio,
      costo_operativo: costoOperativo ? parseFloat(costoOperativo) : null,
      pago_custodio_sin_arma: pagoCustodioSinArma ? parseFloat(pagoCustodioSinArma) : null,
      justificacion: justificacion.trim(),
    };

    const result = await createRoute(data);
    if (result) {
      onSuccess(result);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pre-filled route info */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{cliente}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{origen}</span>
          <span>→</span>
          <span>{destino}</span>
        </div>
      </div>

      {/* Inverse route suggestion */}
      {!isCheckingInverse && inverseRoute.exists && (
        <InverseRouteAlert
          inverseRoute={inverseRoute}
          origen={origen}
          destino={destino}
          onUseAsTemplate={handleUseInverseAsTemplate}
        />
      )}

      {/* Error alert */}
      {creationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{creationError}</AlertDescription>
        </Alert>
      )}

      {/* Main fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor_bruto">
            Valor Bruto <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="valor_bruto"
              type="number"
              placeholder="15,000"
              value={valorBruto}
              onChange={(e) => setValorBruto(e.target.value)}
              className={`pl-7 ${errors.valorBruto ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.valorBruto && (
            <p className="text-xs text-destructive">{errors.valorBruto}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="precio_custodio">
            Pago Custodio <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="precio_custodio"
              type="number"
              placeholder="3,500"
              value={precioCustodio}
              onChange={(e) => setPrecioCustodio(e.target.value)}
              className={`pl-7 ${errors.precioCustodio ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.precioCustodio && (
            <p className="text-xs text-destructive">{errors.precioCustodio}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="distancia_km">Distancia (km)</Label>
          <Input
            id="distancia_km"
            type="number"
            placeholder="280"
            value={distanciaKm}
            onChange={(e) => setDistanciaKm(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo_servicio">Tipo de Servicio</Label>
          <Select value={tipoServicio} onValueChange={setTipoServicio}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPO_SERVICIO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced fields */}
      <AdvancedFieldsCollapsible
        costoOperativo={costoOperativo}
        onCostoOperativoChange={setCostoOperativo}
        pagoCustodioSinArma={pagoCustodioSinArma}
        onPagoCustodioSinArmaChange={setPagoCustodioSinArma}
      />

      {/* Justification */}
      <div className="space-y-2">
        <Label htmlFor="justificacion">
          Justificación <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="justificacion"
          placeholder="Describe por qué se crea esta ruta y cómo se determinó el precio..."
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
          className={errors.justificacion ? 'border-destructive' : ''}
          rows={3}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {errors.justificacion ? (
            <span className="text-destructive">{errors.justificacion}</span>
          ) : (
            <span>Mínimo 20 caracteres</span>
          )}
          <span>{justificacion.length}/500</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isCreating}
          className="flex-1 sm:flex-none"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isCreating}
          className="flex-1 sm:flex-none gap-2"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            'Crear Ruta y Continuar'
          )}
        </Button>
      </div>
    </form>
  );
}
