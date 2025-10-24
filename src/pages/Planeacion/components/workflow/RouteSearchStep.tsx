import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, DollarSign, AlertTriangle, CheckCircle, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useClientesFromPricing, useDestinosFromPricing } from '@/hooks/useClientesFromPricing';
import { useOrigenesConFrecuencia } from '@/hooks/useOrigenesConFrecuencia';
import { CreateRouteModal } from './CreateRouteModal';
import { useQueryClient } from '@tanstack/react-query';

interface RouteData {
  cliente_nombre: string;
  origen_texto: string;
  destino_texto: string;
  precio_sugerido?: number;
  precio_custodio?: number;
  pago_custodio_sin_arma?: number;
  costo_operativo?: number;
  margen_estimado?: number;
  distancia_km?: number;
  tipo_servicio?: string;
  incluye_armado?: boolean;
}

interface RouteSearchStepProps {
  onComplete: (data: RouteData) => void;
  initialDraft?: Partial<RouteData>;
  onDraftChange?: (draft: Partial<RouteData>) => void;
}

export function RouteSearchStep({ onComplete, initialDraft, onDraftChange }: RouteSearchStepProps) {
  const [cliente, setCliente] = useState(initialDraft?.cliente_nombre || '');
  const [origen, setOrigen] = useState(initialDraft?.origen_texto || '');
  const [destino, setDestino] = useState(initialDraft?.destino_texto || '');
  const [distanciaKm, setDistanciaKm] = useState(initialDraft?.distancia_km?.toString() || '');
  const [priceEstimate, setPriceEstimate] = useState<any>(initialDraft?.precio_sugerido ? {
    precio_sugerido: initialDraft.precio_sugerido,
    precio_custodio: initialDraft.precio_custodio,
    pago_custodio_sin_arma: initialDraft.pago_custodio_sin_arma,
    costo_operativo: initialDraft.costo_operativo,
    margen_estimado: initialDraft.margen_estimado,
    distancia_km: initialDraft.distancia_km,
    tipo_servicio: initialDraft.tipo_servicio,
    incluye_armado: initialDraft.incluye_armado,
  } : null);
  const [loading, setLoading] = useState(false);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchError, setSearchError] = useState<string>('');
  const [isUpdatingFromCreation, setIsUpdatingFromCreation] = useState(false);

  const queryClient = useQueryClient();
  const { data: clientesFromPricing = [] } = useClientesFromPricing();
  const { data: origenesConFrecuencia = [] } = useOrigenesConFrecuencia(cliente);
  const { data: destinosFromPricing = [] } = useDestinosFromPricing(cliente, origen);

  // Filtrar clientes para sugerencias
  const clienteSuggestions = clientesFromPricing
    .filter(c => c.cliente_nombre.toLowerCase().includes(cliente.toLowerCase()))
    .slice(0, 5);

  // Auto-buscar precio cuando se tengan cliente, origen y destino
  useEffect(() => {
    // No buscar si estamos actualizando desde creación de ruta
    if (isUpdatingFromCreation) return;
    
    // Verificar frescura de queries antes de buscar
    const origenesState = queryClient.getQueryState(['origenes-con-frecuencia', cliente]);
    const destinosState = queryClient.getQueryState(['destinos-from-pricing', cliente, origen]);
    
    const now = Date.now();
    const isDataFresh = origenesState?.dataUpdatedAt && (now - origenesState.dataUpdatedAt) < 10000 &&
                        destinosState?.dataUpdatedAt && (now - destinosState.dataUpdatedAt) < 10000;
    
    if (cliente && origen && destino && isDataFresh) {
      searchPrice();
    }
  }, [cliente, origen, destino, isUpdatingFromCreation, queryClient]);

  const searchPrice = async () => {
    if (!cliente || !origen || !destino) return;

    setLoading(true);
    try {
      // Búsqueda directa con origen incluido
      const { data, error } = await supabase
        .from('matriz_precios_rutas')
        .select('cliente_nombre, origen_texto, destino_texto, valor_bruto, precio_custodio, pago_custodio_sin_arma, costo_operativo, margen_neto_calculado, distancia_km, tipo_servicio')
        .eq('activo', true)
        .eq('cliente_nombre', cliente)
        .eq('origen_texto', origen)
        .eq('destino_texto', destino)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const row = data as any;
        const incluye_armado = row.tipo_servicio && !['SIN ARMA', 'Sin arma', 'SN ARMA', 'NO ARMADA', 'No Armada'].includes(row.tipo_servicio);
        setPriceEstimate({
          precio_sugerido: row.valor_bruto ?? null,
          precio_custodio: row.precio_custodio ?? null,
          pago_custodio_sin_arma: row.pago_custodio_sin_arma ?? null,
          costo_operativo: row.costo_operativo ?? null,
          margen_estimado: row.margen_neto_calculado ?? null,
          distancia_km: row.distancia_km ?? null,
          tipo_servicio: row.tipo_servicio ?? null,
          incluye_armado,
          ruta_encontrada: `${row.origen_texto} → ${row.destino_texto}`
        });
        setSearchError('');
        toast.success('Pricing encontrado');
        return;
      }

      // Fallback: búsqueda flexible por destino
      const like = await supabase
        .from('matriz_precios_rutas')
        .select('cliente_nombre, origen_texto, destino_texto, valor_bruto, precio_custodio, pago_custodio_sin_arma, costo_operativo, margen_neto_calculado, distancia_km, tipo_servicio')
        .eq('activo', true)
        .eq('cliente_nombre', cliente)
        .eq('origen_texto', origen)
        .ilike('destino_texto', `%${destino}%`)
        .limit(1)
        .maybeSingle();

      if (like.data) {
        const row = like.data as any;
        const incluye_armado = row.tipo_servicio && !['SIN ARMA', 'Sin arma', 'SN ARMA', 'NO ARMADA', 'No Armada'].includes(row.tipo_servicio);
        setPriceEstimate({
          precio_sugerido: row.valor_bruto ?? null,
          precio_custodio: row.precio_custodio ?? null,
          pago_custodio_sin_arma: row.pago_custodio_sin_arma ?? null,
          costo_operativo: row.costo_operativo ?? null,
          margen_estimado: row.margen_neto_calculado ?? null,
          distancia_km: row.distancia_km ?? null,
          tipo_servicio: row.tipo_servicio ?? null,
          incluye_armado,
          ruta_encontrada: `${row.origen_texto} → ${row.destino_texto}`
        });
        setSearchError('');
        toast.warning('Pricing encontrado con coincidencia parcial');
      } else {
        setPriceEstimate(null);
        setSearchError(`No se encontró pricing para la ruta ${origen} → ${destino}. Puedes crear una nueva ruta para continuar.`);
        toast.error(`No se encontró pricing para ${cliente}: ${origen} → ${destino}`);
      }
    } catch (err: any) {
      console.error('Error searching price:', err);
      toast.error('Error al buscar precio');
      setPriceEstimate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!cliente || !origen || !destino) {
      toast.error('Por favor completa cliente, origen y destino');
      return;
    }

    const routeData: RouteData = {
      cliente_nombre: cliente,
      origen_texto: origen,
      destino_texto: destino,
      precio_sugerido: priceEstimate?.precio_sugerido,
      precio_custodio: priceEstimate?.precio_custodio,
      pago_custodio_sin_arma: priceEstimate?.pago_custodio_sin_arma,
      costo_operativo: priceEstimate?.costo_operativo,
      margen_estimado: priceEstimate?.margen_estimado,
      distancia_km: priceEstimate?.distancia_km || (distanciaKm ? Number(distanciaKm) : undefined),
      tipo_servicio: priceEstimate?.tipo_servicio,
      incluye_armado: priceEstimate?.incluye_armado
    };

    onComplete(routeData);
  };

  const selectClientSuggestion = (clienteNombre: string) => {
    setCliente(clienteNombre);
    setShowClientSuggestions(false);
    // Limpiar origen y destino cuando se cambia cliente
    setOrigen('');
    setDestino('');
    
    // Notify draft change
    if (onDraftChange) {
      onDraftChange({ cliente_nombre: clienteNombre, origen_texto: '', destino_texto: '' });
    }
  };

  const handleRouteCreated = async (newRoute: any) => {
    try {
      setIsUpdatingFromCreation(true);
      
      // Validar que la ruta tenga los campos necesarios
      if (!newRoute?.origen_texto || !newRoute?.destino_texto) {
        console.error('Nueva ruta incompleta:', newRoute);
        toast.error('Error: La ruta creada está incompleta');
        return;
      }
      
      // After route is created, automatically select it and continue
      const incluye_armado = newRoute.tipo_servicio && 
        !['SIN ARMA', 'Sin arma', 'SN ARMA', 'NO ARMADA', 'No Armada'].includes(newRoute.tipo_servicio);
      
      setPriceEstimate({
        precio_sugerido: newRoute.valor_bruto ?? null,
        precio_custodio: newRoute.precio_custodio ?? null,
        pago_custodio_sin_arma: newRoute.pago_sin_arma ?? null,
        costo_operativo: newRoute.costo_operativo ?? null,
        margen_estimado: null,
        distancia_km: newRoute.distancia_km ?? null,
        tipo_servicio: newRoute.tipo_servicio ?? null,
        incluye_armado,
        ruta_encontrada: `${newRoute.origen_texto} → ${newRoute.destino_texto}`
      });
      
      setSearchError('');
      toast.success('Ruta seleccionada automáticamente', {
        description: 'Puedes continuar con el siguiente paso'
      });
    } catch (error) {
      console.error('Error en handleRouteCreated:', error);
      toast.error('Error al procesar la nueva ruta');
    } finally {
      setIsUpdatingFromCreation(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            1. Búsqueda de Ruta y Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Input Fields - Single Line Layout */}
          <div className="space-y-6">
            {/* Row 1: Client Selection */}
            <div className="space-y-2 relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center border">
                  1
                </div>
                <Label htmlFor="cliente" className="text-sm font-semibold">
                  Seleccionar Cliente
                  <span className="text-destructive ml-1">*</span>
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="cliente"
                  placeholder="Escriba el nombre del cliente..."
                  value={cliente}
                  onChange={(e) => {
                    const newCliente = e.target.value;
                    setCliente(newCliente);
                    setShowClientSuggestions(newCliente.length > 0);
                    
                    // Notify draft change
                    if (onDraftChange) {
                      onDraftChange({ 
                        cliente_nombre: newCliente, 
                        origen_texto: origen, 
                        destino_texto: destino,
                        distancia_km: distanciaKm ? Number(distanciaKm) : undefined
                      });
                    }
                  }}
                  onFocus={() => setShowClientSuggestions(cliente.length > 0)}
                  className={`h-12 text-base ${cliente ? 'form-field-completed' : 'form-field-required'}`}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              
              {/* Enhanced Client Suggestions */}
              {showClientSuggestions && clienteSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 bg-background border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1">
                  {clienteSuggestions.map((c, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-3 hover:bg-muted/80 border-b border-border last:border-b-0 transition-colors"
                      onClick={() => selectClientSuggestion(c.cliente_nombre)}
                    >
                      <div className="font-semibold text-foreground">{c.cliente_nombre}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {c.servicios_count} rutas disponibles
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Row 2: Route Selection (Single Line) */}
            {cliente && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                 <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center border">
                   2
                 </div>
                    <Label htmlFor="origen" className="text-sm font-semibold">
                      Punto de Origen
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                  </div>
                  <Select 
                    value={origen} 
                    onValueChange={(value) => {
                      setOrigen(value);
                      setDestino('');
                      
                      // Notify draft change
                      if (onDraftChange) {
                        onDraftChange({ 
                          cliente_nombre: cliente, 
                          origen_texto: value, 
                          destino_texto: '',
                          distancia_km: distanciaKm ? Number(distanciaKm) : undefined
                        });
                      }
                    }}
                    disabled={!cliente}
                  >
                    <SelectTrigger className={`h-12 ${origen ? 'form-field-completed' : 'form-field-required'}`}>
                      <SelectValue placeholder="Seleccionar origen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {origenesConFrecuencia.map((origenData) => (
                        <SelectItem key={origenData.origen} value={origenData.origen}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{origenData.origen}</span>
                            {origenData.frecuencia > 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {origenData.frecuencia > 10 ? '⭐ Frecuente' : `${origenData.frecuencia}x`}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                 <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center border">
                   3
                 </div>
                    <Label htmlFor="destino" className="text-sm font-semibold">
                      Destino Final
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                  </div>
                  <Select 
                    value={destino} 
                    onValueChange={(value) => {
                      setDestino(value);
                      
                      // Notify draft change
                      if (onDraftChange) {
                        onDraftChange({ 
                          cliente_nombre: cliente, 
                          origen_texto: origen, 
                          destino_texto: value,
                          distancia_km: distanciaKm ? Number(distanciaKm) : undefined
                        });
                      }
                    }}
                    disabled={!cliente || !origen}
                  >
                    <SelectTrigger className={`h-12 ${destino ? 'form-field-completed' : !origen ? 'opacity-50' : 'form-field-required'}`}>
                      <SelectValue placeholder={
                        !origen ? "Primero selecciona origen" : "Seleccionar destino..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {destinosFromPricing.map((destinoOption) => (
                        <SelectItem key={destinoOption} value={destinoOption}>
                          <div className="font-medium">{destinoOption}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                 <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center border">
                   4
                 </div>
                    <Label htmlFor="distancia" className="text-sm font-semibold">
                      Distancia (KM)
                      <span className="text-muted-foreground text-xs ml-1">opcional</span>
                    </Label>
                  </div>
                  <Input
                    id="distancia"
                    type="number"
                    placeholder="Ej: 150"
                    value={distanciaKm}
                    onChange={(e) => {
                      const newDistancia = e.target.value;
                      setDistanciaKm(newDistancia);
                      
                      // Notify draft change
                      if (onDraftChange) {
                        onDraftChange({ 
                          cliente_nombre: cliente, 
                          origen_texto: origen, 
                          destino_texto: destino,
                          distancia_km: newDistancia ? Number(newDistancia) : undefined
                        });
                      }
                    }}
                    className="h-12"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Search and Create Route Buttons */}
          {cliente && (
            <div className="flex gap-3">
              <Button 
                onClick={searchPrice}
                disabled={loading || !origen || !destino}
                size="lg"
                className="flex-1 h-12 gap-3 text-base font-semibold shadow-lg"
                variant="default"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Buscando pricing...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    {priceEstimate ? 'Actualizar Pricing' : 'Buscar Pricing'}
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                disabled={loading}
                size="lg"
                variant="outline"
                className="h-12 gap-3 text-base font-semibold shadow-lg"
              >
                <Plus className="h-5 w-5" />
                Crear Nueva Ruta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error display with Create Route option */}
      {searchError && !priceEstimate && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-semibold text-destructive">Ruta no encontrada</h4>
                  <p className="text-sm text-muted-foreground mt-1">{searchError}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={searchPrice}
                    disabled={loading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Intentar de Nuevo
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Nueva Ruta
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Minimal Price Results */}
      {priceEstimate && (
        <Card className="border-border bg-background">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted border">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-lg font-semibold">Ruta Confirmada</div>
                <div className="text-sm text-muted-foreground font-normal">
                  Pricing encontrado en matriz de precios
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Minimal Route Info */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background border">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Punto de Origen
                    </div>
                    <div className="font-semibold text-foreground">{origen}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background border">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Destino Final
                    </div>
                    <div className="font-semibold text-foreground">{destino}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background border">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Cliente
                    </div>
                    <div className="font-semibold text-foreground">{cliente}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Type & Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline"
                    className="text-sm px-3 py-1.5"
                  >
                    {priceEstimate.incluye_armado ? "Con Armado" : "Sin Armado"}
                  </Badge>
                  {priceEstimate.tipo_servicio && (
                    <span className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      {priceEstimate.tipo_servicio}
                    </span>
                  )}
                </div>
                
                {priceEstimate.distancia_km && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Distancia:</span>
                    <Badge variant="outline" className="font-mono">
                      {priceEstimate.distancia_km} km
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="text-2xl font-bold text-primary mb-1">
                    ${priceEstimate.precio_sugerido?.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Precio Cliente
                  </div>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    ${priceEstimate.precio_custodio?.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Pago Custodio
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      {cliente && origen && destino && (
        <div className="flex justify-end">
          <Button 
            onClick={handleContinue}
            size="lg"
            className="gap-2"
          >
            Continuar a Configuración
            <CheckCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      <CreateRouteModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        clientName={cliente}
        origin={origen}
        destination={destino}
        onRouteCreated={handleRouteCreated}
        freeTextMode={true}
      />
    </div>
  );
}