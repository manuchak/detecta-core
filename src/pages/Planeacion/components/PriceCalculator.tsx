import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, MapPin, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PriceEstimate {
  precio_sugerido: number;
  precio_custodio: number;
  costo_operativo: number;
  margen_estimado: number;
  ruta_encontrada: string;
}

export const PriceCalculator = () => {
  const [cliente, setCliente] = useState('');
  const [destino, setDestino] = useState('');
  const [distanciaKm, setDistanciaKm] = useState('');
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  const calculatePrice = async () => {
    if (!cliente || !destino) {
      toast.error('Por favor ingresa cliente y destino');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('buscar_precio_ruta', {
        p_cliente_nombre: cliente,
        p_destino: destino,
        p_distancia_km: distanciaKm ? Number(distanciaKm) : null
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setEstimate(data[0]);
      } else {
        toast.error('No se pudo calcular el precio');
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      toast.error('Error al calcular el precio');
    } finally {
      setLoading(false);
    }
  };

  const resetCalculator = () => {
    setCliente('');
    setDestino('');
    setDistanciaKm('');
    setEstimate(null);
  };

  const getMarginColor = (percentage: number) => {
    if (percentage >= 20) return 'text-success';
    if (percentage >= 10) return 'text-warning';
    return 'text-destructive';
  };

  const getMarginBadgeVariant = (percentage: number) => {
    if (percentage >= 20) return 'default';
    if (percentage >= 10) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Precios por Ruta
          </CardTitle>
          <CardDescription>
            Ingresa los datos del servicio para obtener una estimación de precio basada en la matriz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                placeholder="Nombre del cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="destino">Destino</Label>
              <Input
                id="destino"
                placeholder="Ciudad o destino"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="distancia">Distancia (KM) - Opcional</Label>
              <Input
                id="distancia"
                type="number"
                placeholder="Kilómetros"
                value={distanciaKm}
                onChange={(e) => setDistanciaKm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={calculatePrice}
              disabled={loading || !cliente || !destino}
              className="gap-2"
            >
              <Calculator className="h-4 w-4" />
              {loading ? 'Calculando...' : 'Calcular Precio'}
            </Button>
            
            <Button variant="outline" onClick={resetCalculator}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {estimate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Estimación de Precio
            </CardTitle>
            <CardDescription>
              Basado en: {estimate.ruta_encontrada}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Precio al Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    ${estimate.precio_sugerido.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pago al Custodio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ${estimate.precio_custodio.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Costo Operativo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    ${estimate.costo_operativo.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Margen Neto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getMarginColor((estimate.margen_estimado / estimate.precio_sugerido) * 100)}`}>
                    ${estimate.margen_estimado.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Breakdown Analysis */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Análisis de Rentabilidad
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cost Breakdown */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-muted-foreground">Desglose de Costos</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Precio al Cliente</span>
                      <span className="font-mono">${estimate.precio_sugerido.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span className="text-sm">- Pago Custodio</span>
                      <span className="font-mono">-${estimate.precio_custodio.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span className="text-sm">- Costo Operativo</span>
                      <span className="font-mono">-${estimate.costo_operativo.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-sm">Margen Neto</span>
                      <span className="font-mono">${estimate.margen_estimado.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Profitability Metrics */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-muted-foreground">Métricas de Rentabilidad</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Margen de Utilidad</span>
                      <Badge variant={getMarginBadgeVariant((estimate.margen_estimado / estimate.precio_sugerido) * 100)}>
                        {((estimate.margen_estimado / estimate.precio_sugerido) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Costo por KM</span>
                      <span className="font-mono text-sm">
                        {distanciaKm ? `$${(estimate.costo_operativo / Number(distanciaKm)).toFixed(0)}/km` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Precio por KM</span>
                      <span className="font-mono text-sm">
                        {distanciaKm ? `$${(estimate.precio_sugerido / Number(distanciaKm)).toFixed(0)}/km` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {((estimate.margen_estimado / estimate.precio_sugerido) * 100) < 15 && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium">Margen Bajo</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Este servicio tiene un margen menor al 15%. Considera revisar los costos o ajustar el precio.
                  </p>
                </div>
              )}
            </div>

            {/* Source Information */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Fuente de Pricing</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {estimate.ruta_encontrada}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};