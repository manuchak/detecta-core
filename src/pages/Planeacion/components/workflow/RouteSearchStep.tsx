import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Search, MapPin, DollarSign, AlertTriangle, CheckCircle, Plus, RefreshCw, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAllClientes, useDestinosFromPricing } from '@/hooks/useClientesFromPricing';
import { useOrigenesConFrecuencia } from '@/hooks/useOrigenesConFrecuencia';
import { CreateRouteModal } from './CreateRouteModal';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface RouteData {
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
  es_ruta_reparto?: boolean;
  puntos_intermedios?: Array<{
    orden: number;
    nombre: string;
    direccion: string;
    tiempo_estimado_parada_min: number;
    observaciones?: string;
  }>;
  numero_paradas?: number;
  searchError?: string; // ✅ NUEVO: Persistir errores
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
  const [esRutaReparto, setEsRutaReparto] = useState(initialDraft?.es_ruta_reparto || false);
  const [puntosIntermedios, setPuntosIntermedios] = useState<Array<{
    orden: number;
    nombre: string;
    direccion: string;
    tiempo_estimado_parada_min: number;
    observaciones?: string;
  }>>(initialDraft?.puntos_intermedios || []);
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
  const [searchError, setSearchError] = useState<string>(initialDraft?.searchError || '');
  const [isUpdatingFromCreation, setIsUpdatingFromCreation] = useState(false);

  const queryClient = useQueryClient();
  const { data: allClientes = [] } = useAllClientes();
  const { data: origenesConFrecuencia = [] } = useOrigenesConFrecuencia(cliente);
  const { 
    data: destinosFromPricing = [], 
    isLoading: isLoadingDestinos,
    isError: isErrorDestinos,
    error: errorDestinos
  } = useDestinosFromPricing(cliente, origen);

  // Filtrar clientes para sugerencias
  const clienteSuggestions = allClientes
    .filter(c => c.nombre.toLowerCase().includes(cliente.toLowerCase()))
    .slice(0, 8); // Aumentar a 8 sugerencias
  
  // Verificar si el cliente escrito es nuevo
  const isNewClient = cliente.trim().length >= 3 && !allClientes.some(c => 
    c.nombre.toLowerCase() === cliente.toLowerCase()
  );

  // Auto-buscar precio cuando se tengan cliente, origen y destino
  useEffect(() => {
    // No buscar si estamos actualizando desde creación de ruta
    if (isUpdatingFromCreation) return;
    
    // No buscar si destinos aún están cargando
    if (isLoadingDestinos) return;
    
    // Verificar frescura de queries antes de buscar
    const origenesState = queryClient.getQueryState(['origenes-con-frecuencia', cliente]);
    const destinosState = queryClient.getQueryState(['destinos-from-pricing', cliente, origen]);
    
    const now = Date.now();
    const isDataFresh = origenesState?.dataUpdatedAt && (now - origenesState.dataUpdatedAt) < 10000 &&
                        destinosState?.dataUpdatedAt && (now - destinosState.dataUpdatedAt) < 10000;
    
    if (cliente && origen && destino && isDataFresh && !isLoadingDestinos) {
      searchPrice();
    }
  }, [cliente, origen, destino, isUpdatingFromCreation, queryClient, isLoadingDestinos]);

  // Función helper para normalizar texto de ubicaciones
  const normalizeLocationText = (text: string): string => {
    return text
      .toUpperCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/\s*(EDO\.?\s*MEX\.?|EDOMEX|ESTADO DE MEXICO)\s*$/i, '') // Quitar sufijos
      .replace(/\s+/g, ' ')
      .replace(/,\s*/g, ' ')
      .trim();
  };

  // Extraer palabra clave principal de una ubicación
  const extractPrimaryKeyword = (text: string): string => {
    const normalized = normalizeLocationText(text);
    return normalized.split(' ')[0] || text;
  };

  const searchPrice = async () => {
    if (!cliente || !origen || !destino) return;

    setLoading(true);
    setSearchError(''); // Limpiar errores previos
    
    try {
      console.log('🔍 [RouteSearchStep] Buscando precio (flexible):', {
        cliente,
        origen,
        destino,
        origenKeyword: extractPrimaryKeyword(origen),
        esRutaReparto,
        puntosIntermedios: puntosIntermedios.length
      });

      // 🆕 SI ES RUTA REPARTO, usar RPC especializado
      if (esRutaReparto) {
        const { data, error } = await supabase.rpc('buscar_precio_ruta_reparto', {
          p_cliente_nombre: cliente,
          p_origen: origen,
          p_destino_final: destino,
          p_numero_paradas: puntosIntermedios.length
        });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const row = data[0];
          setPriceEstimate({
            precio_sugerido: row.valor_bruto ?? null,
            precio_custodio: row.precio_custodio ?? null,
            costo_operativo: row.costo_operativo ?? null,
            distancia_km: row.distancia_km ?? null,
            tipo_servicio: row.tipo_servicio ?? null,
            es_ruta_reparto: true,
            puntos_intermedios: row.puntos_intermedios,
            numero_paradas: row.numero_paradas,
            ruta_encontrada: `${row.origen_texto} → ${row.destino_texto} (${row.numero_paradas} paradas)`
          });
          setSearchError('');
          toast.success(`Pricing encontrado para ruta de reparto (${row.numero_paradas} paradas)`);
          return;
        } else {
          setPriceEstimate(null);
          setSearchError(`No se encontró pricing para ruta de reparto ${origen} → ${destino}. Puedes crear una nueva.`);
          toast.warning('No se encontró pricing para ruta de reparto. Puedes crear una nueva.');
        }
        setLoading(false);
        return;
      }

      // === BÚSQUEDA FLEXIBLE EN 3 NIVELES ===
      
      // NIVEL 1: Búsqueda exacta (case-insensitive)
      const { data: exactData, error: exactError } = await supabase
        .from('matriz_precios_rutas')
        .select('cliente_nombre, origen_texto, destino_texto, valor_bruto, precio_custodio, pago_custodio_sin_arma, costo_operativo, margen_neto_calculado, distancia_km, tipo_servicio')
        .eq('activo', true)
        .ilike('cliente_nombre', cliente)
        .ilike('origen_texto', origen)
        .ilike('destino_texto', destino)
        .limit(1)
        .maybeSingle();

      if (exactError) throw exactError;

      if (exactData) {
        const row = exactData as any;
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

      // NIVEL 2: Búsqueda flexible por palabras clave (origen flexible)
      const origenKeyword = extractPrimaryKeyword(origen);
      const destinoKeyword = extractPrimaryKeyword(destino);
      
      console.log('🔍 [RouteSearchStep] Búsqueda NIVEL 2 con keywords:', { origenKeyword, destinoKeyword });
      
      const { data: flexData, error: flexError } = await supabase
        .from('matriz_precios_rutas')
        .select('cliente_nombre, origen_texto, destino_texto, valor_bruto, precio_custodio, pago_custodio_sin_arma, costo_operativo, margen_neto_calculado, distancia_km, tipo_servicio')
        .eq('activo', true)
        .ilike('cliente_nombre', cliente)
        .ilike('origen_texto', `%${origenKeyword}%`)
        .ilike('destino_texto', `%${destinoKeyword}%`)
        .limit(1)
        .maybeSingle();

      if (flexError) throw flexError;

      if (flexData) {
        const row = flexData as any;
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
        toast.success('Pricing encontrado (coincidencia flexible)');
        return;
      }

      // NIVEL 3: Búsqueda solo por destino (más flexible aún)
      const { data: destinoOnlyData, error: destinoOnlyError } = await supabase
        .from('matriz_precios_rutas')
        .select('cliente_nombre, origen_texto, destino_texto, valor_bruto, precio_custodio, pago_custodio_sin_arma, costo_operativo, margen_neto_calculado, distancia_km, tipo_servicio')
        .eq('activo', true)
        .ilike('cliente_nombre', cliente)
        .ilike('destino_texto', `%${destinoKeyword}%`)
        .limit(5);

      if (destinoOnlyError) throw destinoOnlyError;

      if (destinoOnlyData && destinoOnlyData.length > 0) {
        // Buscar la mejor coincidencia de origen entre los resultados
        const bestMatch = destinoOnlyData.find(row => {
          const rowOrigenNorm = normalizeLocationText(row.origen_texto);
          const searchOrigenNorm = normalizeLocationText(origen);
          return rowOrigenNorm.includes(origenKeyword) || searchOrigenNorm.includes(extractPrimaryKeyword(row.origen_texto));
        }) || destinoOnlyData[0];

        const row = bestMatch as any;
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
        toast.warning(`Pricing aproximado encontrado: ${row.origen_texto} → ${row.destino_texto}`);
        return;
      }

      // No se encontró nada
      setPriceEstimate(null);
      setSearchError(`No se encontró pricing para la ruta ${origen} → ${destino}. Puedes crear una nueva ruta para continuar.`);
      toast.error(`No se encontró pricing para ${cliente}: ${origen} → ${destino}`);
    } catch (err: any) {
      console.error('❌ [RouteSearchStep] Error searching price:', {
        error: err,
        message: err?.message,
        stack: err?.stack,
        cliente,
        origen,
        destino
      });
      
      const errorMessage = err?.message || 'Error desconocido al buscar precio';
      toast.error('Error al buscar precio', {
        description: errorMessage
      });
      setPriceEstimate(null);
      const error = `Error: ${errorMessage}`;
      setSearchError(error);
      
      // ✅ NUEVO: Persistir error en draft
      if (onDraftChange) {
        onDraftChange({
          cliente_nombre: cliente,
          origen_texto: origen,
          destino_texto: destino,
          searchError: error
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!cliente || cliente.trim().length < 3) {
      toast.error('Escribe al menos 3 caracteres para el nombre del cliente');
      return;
    }
    
    if (!origen || !destino) {
      toast.error('Por favor completa origen y destino');
      return;
    }
    
    if (esRutaReparto && puntosIntermedios.length === 0) {
      toast.error('Agrega al menos un punto intermedio para ruta de reparto');
      return;
    }

    // Validar que todos los puntos tengan nombre y dirección
    if (esRutaReparto) {
      const puntosIncompletos = puntosIntermedios.filter(
        p => !p.nombre.trim() || !p.direccion.trim()
      );
      
      if (puntosIncompletos.length > 0) {
        toast.error(`Completa los datos de ${puntosIncompletos.length} punto(s) intermedio(s)`);
        return;
      }
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
      incluye_armado: priceEstimate?.incluye_armado,
      es_ruta_reparto: esRutaReparto,
      puntos_intermedios: esRutaReparto ? puntosIntermedios : [],
      numero_paradas: puntosIntermedios.length
    };

    onComplete(routeData);
  };

  const selectClientSuggestion = (clienteNombre: string) => {
    setCliente(clienteNombre);
    setShowClientSuggestions(false);
    // Limpiar origen y destino cuando se cambia cliente
    setOrigen('');
    setDestino('');
    setPriceEstimate(null);
    setSearchError('');
    
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
                      onClick={() => selectClientSuggestion(c.nombre)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-foreground">{c.nombre}</div>
                        {c.tiene_rutas ? (
                          <Badge variant="secondary" className="text-xs">
                            {c.rutas_count} {c.rutas_count === 1 ? 'ruta' : 'rutas'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950">
                            Cliente registrado
                          </Badge>
                        )}
                      </div>
                      {c.tiene_rutas && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          Rutas disponibles
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Indicador de Cliente Nuevo */}
              {isNewClient && (
                <Alert className="mt-2 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Cliente nuevo:</strong> "{cliente}" será registrado automáticamente al crear la ruta
                  </AlertDescription>
                </Alert>
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
                    <SelectTrigger 
                      className={`h-12 ${destino ? 'form-field-completed' : !origen ? 'opacity-50' : 'form-field-required'}`}
                      disabled={!cliente || !origen || isLoadingDestinos}
                    >
                      <SelectValue placeholder={
                        !origen 
                          ? "Primero selecciona origen" 
                          : isLoadingDestinos 
                            ? "Cargando destinos..." 
                            : "Seleccionar destino..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingDestinos ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                          Cargando destinos disponibles...
                        </div>
                      ) : isErrorDestinos ? (
                        <div className="p-4 text-center text-sm text-destructive">
                          <AlertTriangle className="h-4 w-4 mx-auto mb-2" />
                          Error al cargar destinos. Intenta de nuevo.
                        </div>
                      ) : destinosFromPricing.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mx-auto mb-2" />
                          No hay destinos disponibles para {origen}
                          <div className="mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setShowCreateModal(true)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Crear nueva ruta
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {destinosFromPricing.map((destinoOption) => (
                            <SelectItem key={destinoOption} value={destinoOption}>
                              <div className="font-medium">{destinoOption}</div>
                            </SelectItem>
                          ))}
                        </>
                      )}
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

            {/* 🆕 TOGGLE PARA RUTA DE REPARTO */}
            {cliente && origen && destino && (
              <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                <Switch
                  id="es-ruta-reparto"
                  checked={esRutaReparto}
                  onCheckedChange={(checked) => {
                    setEsRutaReparto(checked);
                    if (!checked) setPuntosIntermedios([]);
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor="es-ruta-reparto" className="text-sm font-medium cursor-pointer">
                    Ruta de reparto (múltiples puntos de entrega)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Activa si el servicio incluye entregas en varios puntos con el mismo custodio
                  </p>
                </div>
                <Badge variant={esRutaReparto ? "default" : "outline"}>
                  {esRutaReparto ? `${puntosIntermedios.length} paradas` : 'Punto a punto'}
                </Badge>
              </div>
            )}

            {/* 🆕 SECCIÓN DE PUNTOS INTERMEDIOS */}
            {esRutaReparto && (
              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Puntos de Entrega Intermedios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {puntosIntermedios.map((punto, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold shrink-0 mt-2">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Nombre del punto (ej: Sucursal Centro)"
                          value={punto.nombre}
                          onChange={(e) => {
                            const updated = [...puntosIntermedios];
                            updated[index] = { ...updated[index], nombre: e.target.value };
                            setPuntosIntermedios(updated);
                          }}
                        />
                        <Input
                          placeholder="Dirección completa"
                          value={punto.direccion}
                          onChange={(e) => {
                            const updated = [...puntosIntermedios];
                            updated[index] = { ...updated[index], direccion: e.target.value };
                            setPuntosIntermedios(updated);
                          }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Tiempo en parada (min)"
                            value={punto.tiempo_estimado_parada_min}
                            onChange={(e) => {
                              const updated = [...puntosIntermedios];
                              updated[index] = { ...updated[index], tiempo_estimado_parada_min: parseInt(e.target.value) || 15 };
                              setPuntosIntermedios(updated);
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setPuntosIntermedios(puntosIntermedios.filter((_, i) => i !== index))}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPuntosIntermedios([...puntosIntermedios, {
                      orden: puntosIntermedios.length + 1,
                      nombre: '',
                      direccion: '',
                      tiempo_estimado_parada_min: 15
                    }])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar punto de entrega
                  </Button>
                  
                  {puntosIntermedios.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Resumen de Ruta:</span>
                        <Badge>{puntosIntermedios.length + 2} puntos totales</Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>1. {origen} (Origen)</div>
                        {puntosIntermedios.map((p, i) => (
                          <div key={i}>{i + 2}. {p.nombre || `Parada ${i + 1}`}</div>
                        ))}
                        <div>{puntosIntermedios.length + 2}. {destino} (Destino final)</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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