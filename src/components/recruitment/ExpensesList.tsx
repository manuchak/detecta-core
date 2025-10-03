import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Clock, ChevronDown, ChevronUp, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExpenseTimeline } from './ExpenseTimeline';

// Helper function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

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
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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

  // Cálculos de métricas financieras
  const totalInvestment = gastos
    .filter(gasto => gasto.estado === 'aprobado')
    .reduce((sum, gasto) => sum + gasto.monto, 0);

  const totalCustodians = gastos
    .reduce((sum, gasto) => sum + (gasto.custodios_reales || 0), 0);

  const pendingGastos = gastos.filter(g => g.estado === 'pendiente');
  const allSelected = selectedGastos.length === pendingGastos.length && pendingGastos.length > 0;

  // Filter gastos based on active tab and search
  const filteredGastos = useMemo(() => {
    let filtered = gastos;

    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter(g => g.estado === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(g => 
        g.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.categoria_principal?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.canal_reclutamiento?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [gastos, activeTab, searchTerm]);

  const statusCounts = useMemo(() => ({
    all: gastos.length,
    pendiente: gastos.filter(g => g.estado === 'pendiente').length,
    aprobado: gastos.filter(g => g.estado === 'aprobado').length,
    rechazado: gastos.filter(g => g.estado === 'rechazado').length,
  }), [gastos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas financieras compactas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invertido</p>
                <p className="text-xl font-bold">{formatCurrency(totalInvestment)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custodios</p>
                <p className="text-xl font-bold">{totalCustodians}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CPA</p>
                <p className="text-xl font-bold">
                  {totalCustodians > 0 ? formatCurrency(totalInvestment / totalCustodians) : '$0'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Lista de gastos con tabs */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl">Gestión de Gastos</CardTitle>
            
            {/* Search bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar gastos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                Todos
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {statusCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pendiente" className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Pendientes
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {statusCounts.pendiente}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="aprobado" className="flex items-center gap-2">
                <Check className="h-3 w-3" />
                Aprobados
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {statusCounts.aprobado}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="rechazado" className="flex items-center gap-2">
                <X className="h-3 w-3" />
                Rechazados
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {statusCounts.rechazado}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* Bulk actions for pending */}
              {activeTab === 'pendiente' && pendingGastos.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      id="select-all"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Seleccionar todos ({pendingGastos.length})
                    </label>
                  </div>
                  
                  {selectedGastos.length > 0 && (
                    <>
                      <div className="h-6 w-px bg-border" />
                      <span className="text-sm text-muted-foreground">
                        {selectedGastos.length} seleccionado(s)
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(selectedGastos, 'aprobar')}
                        disabled={processingIds.some(id => selectedGastos.includes(id))}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApprove(selectedGastos, 'rechazar')}
                        disabled={processingIds.some(id => selectedGastos.includes(id))}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rechazar
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Expenses list */}
              {filteredGastos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 rounded-full bg-muted items-center justify-center mb-4">
                    <Filter className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No se encontraron gastos con ese criterio' : 'No hay gastos en esta categoría'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGastos.map((gasto) => (
                    <Card
                      key={gasto.id}
                      className="group hover:shadow-md transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {gasto.estado === 'pendiente' && activeTab === 'pendiente' && (
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
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{gasto.concepto}</h3>
                                {getStatusBadge(gasto.estado)}
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                <div>
                                  <span className="text-2xl font-bold text-primary">
                                    ${gasto.monto.toLocaleString('es-MX')}
                                  </span>
                                </div>
                                <div className="text-muted-foreground">
                                  📅 {safeFormatDate(gasto.fecha)}
                                </div>
                                <div>
                                  <Badge variant="secondary">
                                    {gasto.categoria_principal?.nombre}
                                  </Badge>
                                </div>
                                <div>
                                  <Badge variant="outline">
                                    {gasto.canal_reclutamiento?.nombre}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {gasto.estado === 'pendiente' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove([gasto.id], 'aprobar')}
                                  disabled={processingIds.includes(gasto.id)}
                                  className="bg-green-600 hover:bg-green-700 h-8"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleApprove([gasto.id], 'rechazar')}
                                  disabled={processingIds.includes(gasto.id)}
                                  className="h-8"
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
                              className="h-8"
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
                          <div className="pt-4 border-t mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-sm">Detalles</h4>
                                {gasto.descripcion && (
                                  <div className="text-sm">
                                    <span className="font-medium text-muted-foreground">Descripción: </span>
                                    <p className="mt-1">{gasto.descripcion}</p>
                                  </div>
                                )}
                                <div className="text-sm">
                                  <span className="font-medium text-muted-foreground">Subcategoría: </span>
                                  {gasto.subcategoria?.nombre}
                                </div>
                                {gasto.notas_aprobacion && (
                                  <div className="text-sm">
                                    <span className="font-medium text-muted-foreground">Notas: </span>
                                    <p className="mt-1">{gasto.notas_aprobacion}</p>
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <h4 className="font-semibold text-sm mb-3">Timeline</h4>
                                <ExpenseTimeline
                                  createdAt={gasto.created_at}
                                  approvedAt={gasto.aprobado_en}
                                  rejectedAt={gasto.rechazado_en}
                                  estado={gasto.estado}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};