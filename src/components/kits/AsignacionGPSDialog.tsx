import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Cpu, CreditCard, HardDrive, Star, AlertCircle } from 'lucide-react';
import { useKitsInstalacion, GpsRecomendacion, SimDisponible, MicroSDDisponible } from '@/hooks/useKitsInstalacion';

interface AsignacionGPSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programacionId: string;
  tipoInstalacion: string;
  sensoresRequeridos: string[];
  onKitCreated?: () => void;
}

export const AsignacionGPSDialog = ({ 
  open, 
  onOpenChange, 
  programacionId, 
  tipoInstalacion,
  sensoresRequeridos,
  onKitCreated 
}: AsignacionGPSDialogProps) => {
  const [gpsSeleccionado, setGpsSeleccionado] = useState<string>('');
  const [simSeleccionada, setSimSeleccionada] = useState<string>('');
  const [microsdSeleccionada, setMicrosdSeleccionada] = useState<string>('');
  const [gpsRecomendados, setGpsRecomendados] = useState<GpsRecomendacion[]>([]);
  const [simsDisponibles, setSimsDisponibles] = useState<SimDisponible[]>([]);
  const [microsdsDisponibles, setMicrosdsDisponibles] = useState<MicroSDDisponible[]>([]);
  const [isLoadingRecomendaciones, setIsLoadingRecomendaciones] = useState(false);
  const [tipoSimRecomendado, setTipoSimRecomendado] = useState<string>('');
  const [requiereMicrosd, setRequiereMicrosd] = useState<boolean>(false);

  const { 
    recomendarGPS, 
    obtenerSimDisponibles, 
    obtenerMicroSDDisponibles,
    createKit,
    isCreatingKit 
  } = useKitsInstalacion();

  // Cargar recomendaciones cuando se abre el diálogo
  useEffect(() => {
    if (open && programacionId) {
      cargarRecomendaciones();
    }
  }, [open, programacionId, tipoInstalacion, sensoresRequeridos]);

  // Cargar SIM cuando se selecciona un GPS o cambia el tipo recomendado
  useEffect(() => {
    if (tipoSimRecomendado) {
      cargarSimsDisponibles(tipoSimRecomendado);
    }
  }, [tipoSimRecomendado]);

  // Cargar microSD cuando se requiere
  useEffect(() => {
    if (requiereMicrosd) {
      cargarMicrosdsDisponibles();
    }
  }, [requiereMicrosd]);

  const cargarRecomendaciones = async () => {
    setIsLoadingRecomendaciones(true);
    try {
      const recomendaciones = await recomendarGPS(tipoInstalacion, sensoresRequeridos);
      setGpsRecomendados(recomendaciones);
      
      // Seleccionar automáticamente el GPS con mejor score
      if (recomendaciones.length > 0) {
        const mejorGps = recomendaciones[0];
        setGpsSeleccionado(mejorGps.gps_id);
        setTipoSimRecomendado(mejorGps.tipo_sim_recomendado);
        setRequiereMicrosd(mejorGps.requiere_microsd);
      }
    } catch (error) {
      console.error('Error al cargar recomendaciones:', error);
    } finally {
      setIsLoadingRecomendaciones(false);
    }
  };

  const cargarSimsDisponibles = async (tipoPlan?: string) => {
    try {
      const sims = await obtenerSimDisponibles(tipoPlan);
      setSimsDisponibles(sims);
      
      // Seleccionar automáticamente la primera SIM si hay alguna
      if (sims.length > 0) {
        setSimSeleccionada(sims[0].sim_id);
      }
    } catch (error) {
      console.error('Error al cargar SIMs:', error);
    }
  };

  const cargarMicrosdsDisponibles = async () => {
    try {
      const microsds = await obtenerMicroSDDisponibles(32); // Mínimo 32GB
      setMicrosdsDisponibles(microsds);
      
      // Seleccionar automáticamente la primera microSD si hay alguna
      if (microsds.length > 0) {
        setMicrosdSeleccionada(microsds[0].microsd_id);
      }
    } catch (error) {
      console.error('Error al cargar microSDs:', error);
    }
  };

  const handleGpsChange = (gpsId: string) => {
    setGpsSeleccionado(gpsId);
    const gpsSeleccionadoData = gpsRecomendados.find(g => g.gps_id === gpsId);
    if (gpsSeleccionadoData) {
      setTipoSimRecomendado(gpsSeleccionadoData.tipo_sim_recomendado);
      setRequiereMicrosd(gpsSeleccionadoData.requiere_microsd);
      
      // Limpiar selecciones previas
      setSimSeleccionada('');
      setMicrosdSeleccionada('');
    }
  };

  const handleCrearKit = () => {
    if (!gpsSeleccionado) return;

    createKit({
      programacionId,
      gpsId: gpsSeleccionado,
      simId: simSeleccionada || undefined,
      microsdId: microsdSeleccionada || undefined,
    });

    onKitCreated?.();
    onOpenChange(false);
  };

  const gpsSeleccionadoData = gpsRecomendados.find(g => g.gps_id === gpsSeleccionado);
  const simSeleccionadaData = simsDisponibles.find(s => s.sim_id === simSeleccionada);
  const microsdSeleccionadaData = microsdsDisponibles.find(m => m.microsd_id === microsdSeleccionada);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Asignación de Kit GPS Completo
          </DialogTitle>
          <DialogDescription>
            Selecciona los componentes del kit de instalación basado en las recomendaciones del sistema.
          </DialogDescription>
        </DialogHeader>

        {isLoadingRecomendaciones ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando recomendaciones...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sección GPS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Dispositivo GPS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={gpsSeleccionado} onValueChange={handleGpsChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un dispositivo GPS" />
                  </SelectTrigger>
                  <SelectContent>
                    {gpsRecomendados.map((gps) => (
                      <SelectItem key={gps.gps_id} value={gps.gps_id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span>{gps.marca} {gps.modelo}</span>
                            <Badge variant="outline">{gps.numero_serie}</Badge>
                            {gps.score_compatibilidad >= 90 && (
                              <Badge variant="default" className="bg-green-600">
                                <Star className="h-3 w-3 mr-1" />
                                Recomendado
                              </Badge>
                            )}
                          </div>
                          <Badge variant="secondary">
                            Score: {gps.score_compatibilidad}%
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {gpsSeleccionadoData && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{gpsSeleccionadoData.marca} {gpsSeleccionadoData.modelo}</p>
                        <p className="text-sm text-muted-foreground">Serie: {gpsSeleccionadoData.numero_serie}</p>
                      </div>
                      <Badge variant={gpsSeleccionadoData.score_compatibilidad >= 90 ? 'default' : 'secondary'}>
                        Compatibilidad: {gpsSeleccionadoData.score_compatibilidad}%
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sección SIM */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Tarjeta SIM
                  {tipoSimRecomendado && (
                    <Badge variant="outline">Recomendado: {tipoSimRecomendado}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={simSeleccionada} onValueChange={setSimSeleccionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una tarjeta SIM" />
                  </SelectTrigger>
                  <SelectContent>
                    {simsDisponibles.map((sim) => (
                      <SelectItem key={sim.sim_id} value={sim.sim_id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span>{sim.numero_sim}</span>
                            <Badge variant="outline">{sim.operador}</Badge>
                            <Badge variant="secondary">{sim.tipo_plan}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ${sim.costo_mensual}/mes
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {simSeleccionadaData && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{simSeleccionadaData.numero_sim}</p>
                        <p className="text-sm text-muted-foreground">
                          {simSeleccionadaData.operador} - {simSeleccionadaData.tipo_plan}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${simSeleccionadaData.costo_mensual}/mes</p>
                        <p className="text-sm text-muted-foreground">
                          {simSeleccionadaData.datos_incluidos_mb} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {simsDisponibles.length === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700">
                      No hay tarjetas SIM disponibles del tipo recomendado
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sección MicroSD */}
            {requiereMicrosd && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Tarjeta MicroSD
                    <Badge variant="outline">Requerida</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={microsdSeleccionada} onValueChange={setMicrosdSeleccionada}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una tarjeta microSD" />
                    </SelectTrigger>
                    <SelectContent>
                      {microsdsDisponibles.map((microsd) => (
                        <SelectItem key={microsd.microsd_id} value={microsd.microsd_id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <span>{microsd.marca} {microsd.modelo}</span>
                              <Badge variant="outline">{microsd.numero_serie}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{microsd.capacidad_gb}GB</Badge>
                              {microsd.clase_velocidad && (
                                <Badge variant="outline">{microsd.clase_velocidad}</Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {microsdSeleccionadaData && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {microsdSeleccionadaData.marca} {microsdSeleccionadaData.modelo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Serie: {microsdSeleccionadaData.numero_serie}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{microsdSeleccionadaData.capacidad_gb}GB</p>
                          <p className="text-sm text-muted-foreground">
                            {microsdSeleccionadaData.clase_velocidad}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {microsdsDisponibles.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700">
                        No hay tarjetas microSD disponibles. El kit no se puede completar.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Resumen del Kit */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Kit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>GPS:</span>
                    <span className="font-medium">
                      {gpsSeleccionadoData ? 
                        `${gpsSeleccionadoData.marca} ${gpsSeleccionadoData.modelo}` : 
                        'No seleccionado'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>SIM:</span>
                    <span className="font-medium">
                      {simSeleccionadaData ? 
                        `${simSeleccionadaData.numero_sim} (${simSeleccionadaData.operador})` : 
                        'No seleccionada'
                      }
                    </span>
                  </div>
                  {requiereMicrosd && (
                    <div className="flex justify-between items-center">
                      <span>MicroSD:</span>
                      <span className="font-medium">
                        {microsdSeleccionadaData ? 
                          `${microsdSeleccionadaData.marca} ${microsdSeleccionadaData.capacidad_gb}GB` : 
                          'No seleccionada'
                        }
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCrearKit} 
                disabled={!gpsSeleccionado || isCreatingKit || (requiereMicrosd && !microsdSeleccionada)}
              >
                {isCreatingKit ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creando Kit...
                  </>
                ) : (
                  'Crear Kit de Instalación'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};