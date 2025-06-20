
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MapPin, FileText } from 'lucide-react';
import { PhotoCapture } from './PhotoCapture';

interface EnhancedPasoInstalacionProps {
  paso: {
    id: string;
    titulo: string;
    descripcion: string;
    requiereFoto: boolean;
    requiereUbicacion?: boolean;
    completado: boolean;
    orden: number;
  };
  onCompletarPaso: (pasoId: string, data: {
    fotos?: File[];
    descripcion?: string;
    coordenadas?: { lat: number; lng: number };
  }) => void;
  isLoading?: boolean;
}

export const EnhancedPasoInstalacion: React.FC<EnhancedPasoInstalacionProps> = ({
  paso,
  onCompletarPaso,
  isLoading = false
}) => {
  const [fotos, setFotos] = useState<File[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null);

  const obtenerUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordenadas({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
        }
      );
    }
  };

  const handleCompletar = () => {
    const data: any = {};
    
    if (fotos.length > 0) data.fotos = fotos;
    if (descripcion.trim()) data.descripcion = descripcion;
    if (coordenadas) data.coordenadas = coordenadas;
    
    onCompletarPaso(paso.id, data);
  };

  const puedeCompletar = () => {
    if (paso.requiereFoto && fotos.length === 0) return false;
    if (paso.requiereUbicacion && !coordenadas) return false;
    return true;
  };

  const getPhotoRequirements = () => {
    switch (paso.id) {
      case 'inspeccion_inicial':
        return ['Frontal', 'Trasero', 'Lateral izquierdo', 'Lateral derecho'];
      case 'dispositivo_gps':
        return ['Dispositivo completo', 'Número de serie', 'Estado físico'];
      case 'ubicacion_instalacion':
        return ['Ubicación seleccionada', 'Vista general'];
      case 'proceso_instalacion':
        return ['Durante instalación', 'Proceso de conexión'];
      case 'cableado_conexiones':
        return ['Conexiones realizadas', 'Cableado oculto'];
      case 'dispositivo_funcionando':
        return ['Dispositivo encendido', 'Pantalla funcionando'];
      case 'validacion_final':
        return ['Instalación completa', 'Área limpia'];
      default:
        return ['Foto 1', 'Foto 2'];
    }
  };

  if (paso.completado) {
    return (
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 rounded-full p-2">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-green-800">
                  {paso.orden}. {paso.titulo}
                </CardTitle>
                <CardDescription className="text-green-700">
                  {paso.descripcion}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-green-600 text-white">
              ✓ Completado
            </Badge>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-l-4 border-l-blue-500">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2 text-blue-600 font-semibold text-sm min-w-[32px] h-8 flex items-center justify-center">
              {paso.orden}
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">
                {paso.titulo}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {paso.descripcion}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary">
            En progreso
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Captura de fotos */}
        {paso.requiereFoto && (
          <PhotoCapture
            title="Documentación fotográfica"
            description="Toma las fotos requeridas para documentar este paso"
            photos={fotos}
            onPhotosChange={setFotos}
            requiredPhotos={getPhotoRequirements()}
            maxPhotos={4}
          />
        )}

        {/* Ubicación GPS */}
        {paso.requiereUbicacion && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Ubicación GPS</p>
                    <p className="text-sm text-blue-700">Registra la ubicación exacta</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {coordenadas && (
                    <Badge className="bg-green-100 text-green-800">
                      ✓ Obtenida
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    onClick={obtenerUbicacion}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Obtener ubicación
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Observaciones del paso
          </label>
          <Textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe detalles importantes, dificultades encontradas, o cualquier información relevante..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Botón completar */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleCompletar}
            disabled={!puedeCompletar() || isLoading}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium"
            size="lg"
          >
            {isLoading ? 'Completando...' : '✓ Completar paso'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
