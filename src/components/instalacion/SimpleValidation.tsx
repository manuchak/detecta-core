
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';

interface SimpleValidationProps {
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

export const SimpleValidation: React.FC<SimpleValidationProps> = ({
  validacion,
  onGuardarValidacion,
  isLoading = false
}) => {
  const [validado, setValidado] = useState<boolean>(validacion.validado ?? false);
  const [comentarios, setComentarios] = useState(validacion.comentarios || '');
  const [puntuacion, setPuntuacion] = useState<number>(validacion.puntuacion || 5);
  const [hasChanges, setHasChanges] = useState(false);

  const handleValidadoChange = (newValidado: boolean) => {
    setValidado(newValidado);
    setHasChanges(true);
  };

  const handleComentariosChange = (value: string) => {
    setComentarios(value);
    setHasChanges(true);
  };

  const handlePuntuacionChange = (rating: number) => {
    setPuntuacion(rating);
    setHasChanges(true);
  };

  const handleGuardar = () => {
    onGuardarValidacion(validacion.id, {
      validado,
      comentarios: comentarios.trim() || undefined,
      puntuacion
    });
    setHasChanges(false);
  };

  const getStatusIcon = () => {
    if (validacion.validado === undefined) {
      return <AlertTriangle className="h-6 w-6 text-amber-500" />;
    }
    return validacion.validado ? (
      <CheckCircle className="h-6 w-6 text-green-500" />
    ) : (
      <XCircle className="h-6 w-6 text-red-500" />
    );
  };

  const getStatusBadge = () => {
    if (validacion.validado === undefined) {
      return <Badge variant="outline" className="text-amber-600 border-amber-300">Pendiente</Badge>;
    }
    return validacion.validado ? (
      <Badge className="bg-green-100 text-green-800">✓ Validado</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">✗ Con problemas</Badge>
    );
  };

  return (
    <Card className="mb-6 border-l-4 border-l-blue-500">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {validacion.titulo}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">{validacion.descripcion}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Estado de validación con botones grandes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            ¿Funciona correctamente?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={validado ? "default" : "outline"}
              onClick={() => handleValidadoChange(true)}
              className={`h-16 flex flex-col items-center gap-2 text-base font-medium ${
                validado 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'border-2 border-green-300 hover:bg-green-50 text-green-700'
              }`}
            >
              <ThumbsUp className="h-6 w-6" />
              Sí, funciona bien
            </Button>
            
            <Button
              variant={!validado && validacion.validado !== undefined ? "destructive" : "outline"}
              onClick={() => handleValidadoChange(false)}
              className={`h-16 flex flex-col items-center gap-2 text-base font-medium ${
                !validado && validacion.validado !== undefined
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'border-2 border-red-300 hover:bg-red-50 text-red-700'
              }`}
            >
              <ThumbsDown className="h-6 w-6" />
              Tiene problemas
            </Button>
          </div>
        </div>

        {/* Calificación con estrellas */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Califica la calidad (1-5 estrellas)
          </label>
          <div className="flex items-center gap-3">
            <StarRating
              rating={puntuacion}
              onChange={handlePuntuacionChange}
              size={32}
              className="gap-1"
            />
            <span className="text-lg font-medium text-gray-700">
              {puntuacion}/5
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {puntuacion === 5 ? "Excelente" : 
             puntuacion === 4 ? "Muy bueno" :
             puntuacion === 3 ? "Bueno" :
             puntuacion === 2 ? "Regular" : "Necesita mejoras"}
          </p>
        </div>

        {/* Comentarios */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Observaciones {!validado && validacion.validado !== undefined && <span className="text-red-500">*</span>}
          </label>
          <Textarea
            value={comentarios}
            onChange={(e) => handleComentariosChange(e.target.value)}
            placeholder={
              validado 
                ? "Describe cualquier detalle adicional..." 
                : "Describe los problemas encontrados y las soluciones aplicadas..."
            }
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Botón guardar */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleGuardar}
            disabled={isLoading || !hasChanges}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Guardando...' : 'Guardar validación'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
