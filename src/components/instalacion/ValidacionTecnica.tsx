
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ValidacionTecnicaProps {
  validacion: {
    id: string;
    titulo: string;
    descripcion: string;
    tipo: string;
    validado?: boolean;
    comentarios?: string;
    puntuacion?: number;
  };
  onGuardarValidacion: (validacionId: string, data: {
    validado: boolean;
    comentarios?: string;
    puntuacion?: number;
  }) => void;
  isLoading?: boolean;
}

export const ValidacionTecnica: React.FC<ValidacionTecnicaProps> = ({
  validacion,
  onGuardarValidacion,
  isLoading = false
}) => {
  const [validado, setValidado] = useState<boolean>(validacion.validado ?? false);
  const [comentarios, setComentarios] = useState(validacion.comentarios || '');
  const [puntuacion, setPuntuacion] = useState<number>(validacion.puntuacion || 5);

  const handleGuardar = () => {
    onGuardarValidacion(validacion.id, {
      validado,
      comentarios: comentarios.trim() || undefined,
      puntuacion
    });
  };

  const getValidacionIcon = () => {
    if (validacion.validado === undefined) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    return validacion.validado ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getValidacionBadge = () => {
    if (validacion.validado === undefined) {
      return <Badge variant="outline">Pendiente</Badge>;
    }
    return validacion.validado ? (
      <Badge className="bg-green-100 text-green-800">Validado</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">No válido</Badge>
    );
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getValidacionIcon()}
            <div>
              <CardTitle className="text-lg">{validacion.titulo}</CardTitle>
              <p className="text-sm text-gray-600">{validacion.descripcion}</p>
            </div>
          </div>
          {getValidacionBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Estado de validación</Label>
          <RadioGroup
            value={validado.toString()}
            onValueChange={(value) => setValidado(value === 'true')}
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${validacion.id}-si`} />
              <Label htmlFor={`${validacion.id}-si`} className="text-green-600">
                ✓ Funciona correctamente
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${validacion.id}-no`} />
              <Label htmlFor={`${validacion.id}-no`} className="text-red-600">
                ✗ Presenta problemas
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm font-medium">Calificación (1-5)</Label>
          <RadioGroup
            value={puntuacion.toString()}
            onValueChange={(value) => setPuntuacion(parseInt(value))}
            className="flex gap-4 mt-2"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex items-center space-x-2">
                <RadioGroupItem value={num.toString()} id={`${validacion.id}-${num}`} />
                <Label htmlFor={`${validacion.id}-${num}`}>{num}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label className="text-sm font-medium">Comentarios</Label>
          <Textarea
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            placeholder="Describe el estado de la validación, problemas encontrados, etc..."
            rows={3}
            className="mt-2"
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleGuardar}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            Guardar validación
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
