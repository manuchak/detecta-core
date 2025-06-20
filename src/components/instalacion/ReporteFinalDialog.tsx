
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Star } from 'lucide-react';

interface ReporteFinalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardarReporte: (data: {
    comentarios_instalador?: string;
    tiempo_total_minutos?: number;
    dificultades_encontradas?: string[];
    materiales_adicionales_usados?: string[];
    recomendaciones?: string;
    calificacion_servicio?: number;
  }) => void;
  isLoading?: boolean;
}

export const ReporteFinalDialog: React.FC<ReporteFinalDialogProps> = ({
  open,
  onOpenChange,
  onGuardarReporte,
  isLoading = false
}) => {
  const [comentarios, setComentarios] = useState('');
  const [tiempoTotal, setTiempoTotal] = useState<number>(120);
  const [dificultades, setDificultades] = useState<string[]>([]);
  const [materiales, setMateriales] = useState<string[]>([]);
  const [recomendaciones, setRecomendaciones] = useState('');
  const [calificacion, setCalificacion] = useState<number>(5);
  
  const [nuevaDificultad, setNuevaDificultad] = useState('');
  const [nuevoMaterial, setNuevoMaterial] = useState('');

  const agregarDificultad = () => {
    if (nuevaDificultad.trim()) {
      setDificultades([...dificultades, nuevaDificultad.trim()]);
      setNuevaDificultad('');
    }
  };

  const eliminarDificultad = (index: number) => {
    setDificultades(dificultades.filter((_, i) => i !== index));
  };

  const agregarMaterial = () => {
    if (nuevoMaterial.trim()) {
      setMateriales([...materiales, nuevoMaterial.trim()]);
      setNuevoMaterial('');
    }
  };

  const eliminarMaterial = (index: number) => {
    setMateriales(materiales.filter((_, i) => i !== index));
  };

  const handleGuardar = () => {
    onGuardarReporte({
      comentarios_instalador: comentarios.trim() || undefined,
      tiempo_total_minutos: tiempoTotal,
      dificultades_encontradas: dificultades.length > 0 ? dificultades : undefined,
      materiales_adicionales_usados: materiales.length > 0 ? materiales : undefined,
      recomendaciones: recomendaciones.trim() || undefined,
      calificacion_servicio: calificacion
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reporte Final de Instalación</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tiempo total */}
          <div>
            <Label className="text-sm font-medium">Tiempo total de instalación (minutos)</Label>
            <Input
              type="number"
              value={tiempoTotal}
              onChange={(e) => setTiempoTotal(parseInt(e.target.value) || 0)}
              min={1}
              className="mt-1"
            />
          </div>

          {/* Calificación del servicio */}
          <div>
            <Label className="text-sm font-medium">Calificación del servicio</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  type="button"
                  variant={calificacion >= num ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalificacion(num)}
                  className="flex items-center gap-1"
                >
                  <Star className={`h-4 w-4 ${calificacion >= num ? 'fill-current' : ''}`} />
                  {num}
                </Button>
              ))}
            </div>
          </div>

          {/* Dificultades encontradas */}
          <div>
            <Label className="text-sm font-medium">Dificultades encontradas</Label>
            <div className="space-y-2 mt-2">
              <div className="flex gap-2">
                <Input
                  value={nuevaDificultad}
                  onChange={(e) => setNuevaDificultad(e.target.value)}
                  placeholder="Describe una dificultad..."
                  onKeyPress={(e) => e.key === 'Enter' && agregarDificultad()}
                />
                <Button type="button" size="sm" onClick={agregarDificultad}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {dificultades.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dificultades.map((dificultad, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {dificultad}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => eliminarDificultad(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Materiales adicionales */}
          <div>
            <Label className="text-sm font-medium">Materiales adicionales utilizados</Label>
            <div className="space-y-2 mt-2">
              <div className="flex gap-2">
                <Input
                  value={nuevoMaterial}
                  onChange={(e) => setNuevoMaterial(e.target.value)}
                  placeholder="Describe un material adicional..."
                  onKeyPress={(e) => e.key === 'Enter' && agregarMaterial()}
                />
                <Button type="button" size="sm" onClick={agregarMaterial}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {materiales.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {materiales.map((material, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {material}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => eliminarMaterial(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comentarios del instalador */}
          <div>
            <Label className="text-sm font-medium">Comentarios del instalador</Label>
            <Textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Describe cómo se realizó la instalación, cualquier detalle importante..."
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Recomendaciones */}
          <div>
            <Label className="text-sm font-medium">Recomendaciones para el cliente</Label>
            <Textarea
              value={recomendaciones}
              onChange={(e) => setRecomendaciones(e.target.value)}
              placeholder="Recomendaciones sobre mantenimiento, uso del dispositivo, etc..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardar}
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Finalizar Instalación'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
