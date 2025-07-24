import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// Función helper para formatear fechas de forma segura
const safeFormatDate = (dateValue: string | null | undefined, formatString: string = 'dd/MM/yyyy', options = { locale: es }): string => {
  if (!dateValue) return 'Fecha no disponible';
  
  try {
    const date = new Date(dateValue);
    if (!isValid(date)) return 'Fecha inválida';
    return format(date, formatString, options);
  } catch (error) {
    console.warn('Error formatting date:', dateValue, error);
    return 'Fecha inválida';
  }
};

interface Gasto {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  estado: string;
  categoria_principal: { nombre: string; color?: string } | null;
  subcategoria: { nombre: string } | null;
  canal_reclutamiento: { nombre: string; tipo: string } | null;
  aprobado_por: string | null;
  aprobado_en: string | null;
  rechazado_en: string | null;
  notas_aprobacion: string | null;
  descripcion: string | null;
  registrado_por: string | null;
  created_at: string;
  [key: string]: any; // Para manejar campos adicionales de la BD
}

export const ExpensesList = () => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [selectedGastos, setSelectedGastos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [expandedGasto, setExpandedGasto] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGastos = async () => {
    try {
      const { data, error } = await supabase
        .from('gastos_externos')
        .select(`
          *,
          categoria_principal:categoria_principal_id(nombre, color),
          subcategoria:subcategoria_id(nombre),
          canal_reclutamiento:canal_reclutamiento_id(nombre, tipo)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGastos((data || []) as unknown as Gasto[]);
    } catch (error) {
      console.error('Error fetching gastos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los gastos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGastos();
  }, []);

  const handleApprove = async (gastoIds: string[], action: 'aprobar' | 'rechazar') => {
    setProcessingIds(prev => [...prev, ...gastoIds]);
    
    try {
      const updateData = action === 'aprobar' 
        ? { estado: 'aprobado', aprobado_en: new Date().toISOString() }
        : { estado: 'rechazado', rechazado_en: new Date().toISOString() };

      const { error } = await supabase
        .from('gastos_externos')
        .update(updateData)
        .in('id', gastoIds);

      if (error) throw error;

      toast({
        title: action === 'aprobar' ? "Gastos Aprobados" : "Gastos Rechazados",
        description: `${gastoIds.length} gasto(s) ${action === 'aprobar' ? 'aprobado(s)' : 'rechazado(s)'} exitosamente`,
      });

      setSelectedGastos([]);
      fetchGastos();
    } catch (error) {
      console.error(`Error ${action}ing gastos:`, error);
      toast({
        title: "Error",
        description: `No se pudieron ${action} los gastos`,
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => !gastoIds.includes(id)));
    }
  };

  const handleSelectAll = () => {
    const pendingGastos = gastos.filter(g => g.estado === 'pendiente').map(g => g.id);
    setSelectedGastos(selectedGastos.length === pendingGastos.length ? [] : pendingGastos);
  };

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      pendiente: { label: 'Pendiente', variant: 'secondary' as const, icon: Clock },
      aprobado: { label: 'Aprobado', variant: 'default' as const, icon: Check },
      rechazado: { label: 'Rechazado', variant: 'destructive' as const, icon: X }
    };

    const config = statusConfig[estado as keyof typeof statusConfig] || statusConfig.pendiente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const pendingGastos = gastos.filter(g => g.estado === 'pendiente');
  const allSelected = selectedGastos.length === pendingGastos.length && pendingGastos.length > 0;

  if (loading) {
    return <div className="flex justify-center p-8">Cargando gastos...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gastos Recientes</CardTitle>
          {pendingGastos.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm cursor-pointer">
                Seleccionar todos los pendientes ({pendingGastos.length})
              </label>
            </div>
          )}
        </div>
        
        {selectedGastos.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm">{selectedGastos.length} gasto(s) seleccionado(s)</span>
            <Button
              size="sm"
              onClick={() => handleApprove(selectedGastos, 'aprobar')}
              disabled={processingIds.some(id => selectedGastos.includes(id))}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Aprobar Seleccionados
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleApprove(selectedGastos, 'rechazar')}
              disabled={processingIds.some(id => selectedGastos.includes(id))}
            >
              <X className="w-4 h-4 mr-1" />
              Rechazar Seleccionados
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {gastos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay gastos registrados</p>
        ) : (
          gastos.map((gasto) => (
            <div
              key={gasto.id}
              className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {gasto.estado === 'pendiente' && (
                    <Checkbox
                      checked={selectedGastos.includes(gasto.id)}
                      onCheckedChange={(checked) => {
                        setSelectedGastos(prev => 
                          checked 
                            ? [...prev, gasto.id]
                            : prev.filter(id => id !== gasto.id)
                        );
                      }}
                    />
                  )}
                  
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{gasto.concepto}</h3>
                      {getStatusBadge(gasto.estado)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">
                          ${gasto.monto.toLocaleString('es-MX')}
                        </span>
                      </div>
                      <div>{safeFormatDate(gasto.fecha)}</div>
                      <div>
                        {gasto.categoria_principal?.nombre} - {gasto.subcategoria?.nombre}
                      </div>
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {gasto.canal_reclutamiento?.nombre}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {gasto.estado === 'pendiente' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove([gasto.id], 'aprobar')}
                        disabled={processingIds.includes(gasto.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApprove([gasto.id], 'rechazar')}
                        disabled={processingIds.includes(gasto.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedGasto(
                      expandedGasto === gasto.id ? null : gasto.id
                    )}
                  >
                    {expandedGasto === gasto.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {expandedGasto === gasto.id && (
                <div className="pt-3 border-t space-y-2 text-sm">
                  {gasto.descripcion && (
                    <div>
                      <span className="font-medium">Descripción: </span>
                      {gasto.descripcion}
                    </div>
                  )}
                  {gasto.aprobado_en && (
                    <div className="text-green-600">
                      <span className="font-medium">Aprobado: </span>
                      {safeFormatDate(gasto.aprobado_en, 'dd/MM/yyyy HH:mm')}
                    </div>
                  )}
                  {gasto.rechazado_en && (
                    <div className="text-red-600">
                      <span className="font-medium">Rechazado: </span>
                      {safeFormatDate(gasto.rechazado_en, 'dd/MM/yyyy HH:mm')}
                    </div>
                  )}
                  {gasto.notas_aprobacion && (
                    <div>
                      <span className="font-medium">Notas: </span>
                      {gasto.notas_aprobacion}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};