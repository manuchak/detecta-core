
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Camera, Check, MapPin, Upload, X } from 'lucide-react';

interface PasoInstalacionProps {
  paso: {
    id: string;
    titulo: string;
    descripcion: string;
    requiereFoto: boolean;
    requiereUbicacion?: boolean;
    completado: boolean;
  };
  onCompletarPaso: (pasoId: string, data: {
    foto?: File;
    descripcion?: string;
    coordenadas?: { lat: number; lng: number };
  }) => void;
  isLoading?: boolean;
}

export const PasoInstalacion: React.FC<PasoInstalacionProps> = ({
  paso,
  onCompletarPaso,
  isLoading = false
}) => {
  const [foto, setFoto] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFoto(file);
    }
  };

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
    
    if (foto) data.foto = foto;
    if (descripcion.trim()) data.descripcion = descripcion;
    if (coordenadas) data.coordenadas = coordenadas;
    
    onCompletarPaso(paso.id, data);
  };

  const puedeCompletar = () => {
    if (paso.requiereFoto && !foto) return false;
    if (paso.requiereUbicacion && !coordenadas) return false;
    return true;
  };

  return (
    <Card className={`mb-4 ${paso.completado ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {paso.completado ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
              {paso.titulo}
            </CardTitle>
            <CardDescription>{paso.descripcion}</CardDescription>
          </div>
          <Badge variant={paso.completado ? 'default' : 'secondary'}>
            {paso.completado ? 'Completado' : 'Pendiente'}
          </Badge>
        </div>
      </CardHeader>

      {!paso.completado && (
        <CardContent className="space-y-4">
          {paso.requiereFoto && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Fotografía requerida
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  capture="environment"
                  className="flex-1"
                />
                <Camera className="h-5 w-5 text-gray-400" />
              </div>
              {foto && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Foto seleccionada: {foto.name}
                </p>
              )}
            </div>
          )}

          {paso.requiereUbicacion && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Ubicación GPS
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={obtenerUbicacion}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Obtener ubicación
                </Button>
                {coordenadas && (
                  <Badge variant="outline" className="text-green-600">
                    ✓ Ubicación obtenida
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Observaciones (opcional)
            </label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe cualquier detalle importante de este paso..."
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCompletar}
              disabled={!puedeCompletar() || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Upload className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Completar paso
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
