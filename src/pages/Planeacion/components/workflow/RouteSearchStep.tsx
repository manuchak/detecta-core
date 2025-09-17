import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useClientesFromPricing, useDestinosFromPricing } from '@/hooks/useClientesFromPricing';

interface RouteData {
  cliente_nombre: string;
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
  const [destino, setDestino] = useState('');
  const [distanciaKm, setDistanciaKm] = useState('');
  const [priceEstimate, setPriceEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showDestinoSuggestions, setShowDestinoSuggestions] = useState(false);

  const { data: clientesFromPricing = [] } = useClientesFromPricing();
  const { data: destinosFromPricing = [] } = useDestinosFromPricing(cliente);

  // Filtrar clientes para sugerencias
  const clienteSuggestions = clientesFromPricing
    .filter(c => c.cliente_nombre.toLowerCase().includes(cliente.toLowerCase()))
    .slice(0, 5);

  // Filtrar destinos para sugerencias
  const destinoSuggestions = destinosFromPricing
    .filter(d => d.toLowerCase().includes(destino.toLowerCase()))
    .slice(0, 5);

  // Auto-buscar precio cuando se tengan cliente y destino
  useEffect(() => {
    if (cliente && destino && cliente.length > 2 && destino.length > 2) {
      searchPrice();
    }
  }, [cliente, destino]);

  const searchPrice = async () => {
    if (!cliente || !destino) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('buscar_precio_ruta', {
        p_cliente_nombre: cliente,
        p_destino: destino,
        p_distancia_km: distanciaKm ? Number(distanciaKm) : null
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setPriceEstimate(data[0]);
      } else {
        setPriceEstimate(null);
        toast.warning('No se encontró pricing para esta ruta');
      }
    } catch (error) {
      console.error('Error searching price:', error);
      toast.error('Error al buscar precio');
      setPriceEstimate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!cliente || !destino) {
      toast.error('Por favor completa cliente y destino');
      return;
    }

    const routeData: RouteData = {
      cliente_nombre: cliente,
      destino_texto: destino,
      precio_sugerido: priceEstimate?.precio_sugerido,
      precio_custodio: priceEstimate?.precio_custodio,
      costo_operativo: priceEstimate?.costo_operativo,
      margen_estimado: priceEstimate?.margen_estimado,
      distancia_km: distanciaKm ? Number(distanciaKm) : undefined
    };

    onComplete(routeData);
  };

  const selectClientSuggestion = (clienteNombre: string) => {
    setCliente(clienteNombre);
    setShowClientSuggestions(false);
    // Limpiar destino cuando se cambia cliente
    setDestino('');
  };

  const selectDestinoSuggestion = (destinoText: string) => {
    setDestino(destinoText);
    setShowDestinoSuggestions(false);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="destino">Destino *</Label>
              <Input
                id="destino"
                placeholder="Ciudad o destino"
                value={destino}
                onChange={(e) => {
                  setDestino(e.target.value);
                  setShowDestinoSuggestions(e.target.value.length > 0 && cliente.length > 0);
                }}
                onFocus={() => setShowDestinoSuggestions(destino.length > 0 && cliente.length > 0)}
              />
              
              {/* Destino Suggestions */}
              {showDestinoSuggestions && destinoSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {destinoSuggestions.map((d, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => selectDestinoSuggestion(d)}
                    >
                      <div className="font-medium">{d}</div>
                    </button>
                  ))}
                </div>
              )}
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
            disabled={loading || !cliente || !destino}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  ${priceEstimate.margen_estimado?.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Margen Neto</div>
              </div>
            </div>

            {/* Margin Analysis */}
            {priceEstimate.precio_sugerido && priceEstimate.margen_estimado && (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Margen de Utilidad:</span>
                </div>
                <Badge 
                  variant={
                    (priceEstimate.margen_estimado / priceEstimate.precio_sugerido * 100) >= 20 
                      ? "default" 
                      : (priceEstimate.margen_estimado / priceEstimate.precio_sugerido * 100) >= 10 
                      ? "secondary" 
                      : "destructive"
                  }
                >
                  {(priceEstimate.margen_estimado / priceEstimate.precio_sugerido * 100).toFixed(1)}%
                </Badge>
              </div>
            )}

            {/* Warning for low margins */}
            {priceEstimate.precio_sugerido && 
             priceEstimate.margen_estimado && 
             (priceEstimate.margen_estimado / priceEstimate.precio_sugerido * 100) < 15 && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">Margen Bajo</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Este servicio tiene un margen menor al 15%. Considera revisar costos.
                </p>
              </div>
            )}

            {/* Source Information */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ruta base:</span>
                <span className="text-sm">{priceEstimate.ruta_encontrada}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      {cliente && destino && (
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