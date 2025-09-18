import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useClientesFromPricing, useOrigenesFromPricing, useDestinosFromPricing } from '@/hooks/useClientesFromPricing';

interface RouteData {
  cliente_nombre: string;
  origen_texto: string;
  destino_texto: string;
  precio_sugerido?: number;
  precio_custodio?: number;
  costo_operativo?: number;
  margen_estimado?: number;
  distancia_km?: number;
}

interface RouteSearchStepProps {
  onComplete: (data: RouteData) => void;
}

export function RouteSearchStep({ onComplete }: RouteSearchStepProps) {
  const [cliente, setCliente] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [distanciaKm, setDistanciaKm] = useState('');
  const [priceEstimate, setPriceEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  const { data: clientesFromPricing = [] } = useClientesFromPricing();
  const { data: origenesFromPricing = [] } = useOrigenesFromPricing(cliente);
  const { data: destinosFromPricing = [] } = useDestinosFromPricing(cliente, origen);

  // Filtrar clientes para sugerencias
  const clienteSuggestions = clientesFromPricing
    .filter(c => c.cliente_nombre.toLowerCase().includes(cliente.toLowerCase()))
    .slice(0, 5);

  // Auto-buscar precio cuando se tengan cliente, origen y destino
  useEffect(() => {
    if (cliente && origen && destino) {
      searchPrice();
    }
  }, [cliente, origen, destino]);

  const searchPrice = async () => {
    if (!cliente || !origen || !destino) return;

    setLoading(true);
    try {
      // Búsqueda directa con origen incluido
      const { data, error } = await supabase
        .from('matriz_precios_rutas')
        .select('cliente_nombre, origen_texto, destino_texto, valor_bruto, precio_custodio, costo_operativo, margen_neto_calculado, distancia_km')
        .eq('activo', true)
        .eq('cliente_nombre', cliente)
        .eq('origen_texto', origen)
        .eq('destino_texto', destino)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const row = data as any;
        setPriceEstimate({
          precio_sugerido: row.valor_bruto ?? null,
          precio_custodio: row.precio_custodio ?? null,
          costo_operativo: row.costo_operativo ?? null,
          margen_estimado: row.margen_neto_calculado ?? null,
          distancia_km: row.distancia_km ?? null,
          ruta_encontrada: `${row.origen_texto} → ${row.destino_texto}`
        });
        toast.success('Pricing encontrado');
        return;
      }

      // Fallback: búsqueda flexible por destino
      const like = await supabase
        .from('matriz_precios_rutas')
        .select('cliente_nombre, origen_texto, destino_texto, valor_bruto, precio_custodio, costo_operativo, margen_neto_calculado, distancia_km')
        .eq('activo', true)
        .eq('cliente_nombre', cliente)
        .eq('origen_texto', origen)
        .ilike('destino_texto', `%${destino}%`)
        .limit(1)
        .maybeSingle();

      if (like.data) {
        const row = like.data as any;
        setPriceEstimate({
          precio_sugerido: row.valor_bruto ?? null,
          precio_custodio: row.precio_custodio ?? null,
          costo_operativo: row.costo_operativo ?? null,
          margen_estimado: row.margen_neto_calculado ?? null,
          distancia_km: row.distancia_km ?? null,
          ruta_encontrada: `${row.origen_texto} → ${row.destino_texto}`
        });
        toast.warning('Pricing encontrado con coincidencia parcial');
      } else {
        setPriceEstimate(null);
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
      costo_operativo: priceEstimate?.costo_operativo,
      margen_estimado: priceEstimate?.margen_estimado,
      distancia_km: priceEstimate?.distancia_km || (distanciaKm ? Number(distanciaKm) : undefined)
    };

    onComplete(routeData);
  };

  const selectClientSuggestion = (clienteNombre: string) => {
    setCliente(clienteNombre);
    setShowClientSuggestions(false);
    // Limpiar origen y destino cuando se cambia cliente
    setOrigen('');
    setDestino('');
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
        <CardContent className="space-y-4">
          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 relative">
              <Label htmlFor="cliente">Cliente *</Label>
              <Input
                id="cliente"
                placeholder="Buscar cliente..."
                value={cliente}
                onChange={(e) => {
                  setCliente(e.target.value);
                  setShowClientSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => setShowClientSuggestions(cliente.length > 0)}
              />
              
              {/* Client Suggestions */}
              {showClientSuggestions && clienteSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {clienteSuggestions.map((c, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => selectClientSuggestion(c.cliente_nombre)}
                    >
                      <div className="font-medium">{c.cliente_nombre}</div>
                      <div className="text-xs text-muted-foreground">{c.servicios_count} destinos disponibles</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2 relative">
              <Label htmlFor="origen">Origen *</Label>
              <Select 
                value={origen} 
                onValueChange={(value) => {
                  setOrigen(value);
                  // Limpiar destino cuando se cambia origen
                  setDestino('');
                }}
                disabled={!cliente}
              >
                <SelectTrigger>
                  <SelectValue placeholder={cliente ? "Seleccionar origen..." : "Primero selecciona cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {origenesFromPricing.map((origenOption) => (
                    <SelectItem key={origenOption} value={origenOption}>
                      {origenOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 relative">
              <Label htmlFor="destino">Destino *</Label>
              <Select 
                value={destino} 
                onValueChange={setDestino}
                disabled={!cliente || !origen}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !cliente ? "Primero selecciona cliente" : 
                    !origen ? "Primero selecciona origen" : 
                    "Seleccionar destino..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  {destinosFromPricing.map((destinoOption) => (
                    <SelectItem key={destinoOption} value={destinoOption}>
                      {destinoOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="distancia">Distancia (KM)</Label>
              <Input
                id="distancia"
                type="number"
                placeholder="Opcional"
                value={distanciaKm}
                onChange={(e) => setDistanciaKm(e.target.value)}
              />
            </div>
          </div>

          {/* Search Button */}
          <Button 
            onClick={searchPrice}
            disabled={loading || !cliente || !origen || !destino}
            className="w-full gap-2"
            variant={priceEstimate ? "outline" : "default"}
          >
            <Search className="h-4 w-4" />
            {loading ? 'Buscando...' : priceEstimate ? 'Actualizar Pricing' : 'Buscar Pricing'}
          </Button>
        </CardContent>
      </Card>

      {/* Price Estimate Results */}
      {priceEstimate && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Pricing Encontrado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  ${priceEstimate.precio_sugerido?.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Precio Cliente</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${priceEstimate.precio_custodio?.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Pago Custodio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  ${priceEstimate.costo_operativo?.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Costo Operativo</div>
              </div>
            </div>

            {/* Source Information */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ruta base:</span>
                <span className="text-sm">{priceEstimate.ruta_encontrada}</span>
              </div>
              {priceEstimate.distancia_km && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Distancia:</span>
                  <Badge variant="outline">{priceEstimate.distancia_km} km</Badge>
                </div>
              )}
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
    </div>
  );
}