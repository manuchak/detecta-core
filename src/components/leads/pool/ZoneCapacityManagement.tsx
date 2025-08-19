import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  MapPin, 
  Settings,
  Save,
  X,
  AlertTriangle
} from "lucide-react";
import { ZoneCapacity } from "@/types/leadTypes";
import { usePoolReserva } from "@/hooks/usePoolReserva";

interface ZoneCapacityManagementProps {
  zoneCapacities: ZoneCapacity[];
  onClose: () => void;
}

export const ZoneCapacityManagement = ({ zoneCapacities, onClose }: ZoneCapacityManagementProps) => {
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ maxima: number; umbral: number }>({ maxima: 0, umbral: 0 });
  
  const { updateZoneCapacity, loading } = usePoolReserva();

  const handleEditZone = (zone: ZoneCapacity) => {
    setEditingZone(zone.zona_id);
    setEditValues({ 
      maxima: zone.capacidad_maxima, 
      umbral: zone.umbral_saturacion 
    });
  };

  const handleSaveZone = async (zonaId: string) => {
    const success = await updateZoneCapacity(zonaId, editValues.maxima, editValues.umbral);
    if (success) {
      setEditingZone(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingZone(null);
    setEditValues({ maxima: 0, umbral: 0 });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Gestión de Capacidades por Zona</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Configura la capacidad máxima y el umbral de saturación para cada zona operativa.
        </div>

        <div className="grid gap-4">
          {zoneCapacities.map((zone) => (
            <Card key={zone.zona_id} className={zone.zona_saturada ? 'border-red-200 bg-red-50/30' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">{zone.zona_nombre}</h3>
                    {zone.zona_saturada && (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Saturada
                      </Badge>
                    )}
                  </div>
                  
                  {editingZone !== zone.zona_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditZone(zone)}
                    >
                      Editar
                    </Button>
                  )}
                </div>

                {editingZone === zone.zona_id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`maxima-${zone.zona_id}`}>Capacidad Máxima</Label>
                        <Input
                          id={`maxima-${zone.zona_id}`}
                          type="number"
                          min="1"
                          value={editValues.maxima}
                          onChange={(e) => setEditValues(prev => ({ ...prev, maxima: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`umbral-${zone.zona_id}`}>Umbral de Saturación</Label>
                        <Input
                          id={`umbral-${zone.zona_id}`}
                          type="number"
                          min="1"
                          max={editValues.maxima}
                          value={editValues.umbral}
                          onChange={(e) => setEditValues(prev => ({ ...prev, umbral: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveZone(zone.zona_id)}
                        disabled={loading || editValues.maxima < 1 || editValues.umbral > editValues.maxima}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Guardar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Capacidad ocupada:</span>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {zone.capacidad_actual} / {zone.capacidad_maxima}
                        </span>
                      </div>
                    </div>
                    
                    <Progress 
                      value={(zone.capacidad_actual / zone.capacidad_maxima) * 100} 
                      className="h-2"
                    />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        Umbral de saturación: <span className="font-medium">{zone.umbral_saturacion}</span>
                      </div>
                      <div>
                        Espacios disponibles: <span className="font-medium text-green-600">{zone.espacios_disponibles}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {zoneCapacities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
            <p>No hay zonas configuradas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};