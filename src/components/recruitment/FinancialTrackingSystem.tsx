import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RecruitmentMathEngine } from '@/lib/RecruitmentMathEngine';
import { Badge } from '@/components/ui/badge';
import { useFormatters } from '@/hooks/useFormatters';

interface FinancialEntry {
  id?: string;
  concepto: string;
  monto: number;
  categoria_id: string;
  canal_reclutamiento: string;
  fecha_gasto: string;
  estado: 'pendiente' | 'aprobado' | 'pagado';
  notas?: string;
  proveedor?: string;
  metodo_pago?: string;
  numero_factura?: string;
  leads_generados?: number;
  entrevistas_realizadas?: number;
  documentacion_completada?: number;
}

interface FinancialMetrics {
  realCPA: number;
  projectedCPA: number;
  efficiency: number;
  roi: number;
  totalInvestment: number;
  conversionRate: number;
  costPerLead: number;
  leadToCustomerRate: number;
  monthlyApprovalRate: number;
  totalLeads: number;
  totalApprovals: number;
  validation: {
    isValid: boolean;
    inconsistencies: string[];
    confidenceScore: number;
  };
}

export const FinancialTrackingSystem = () => {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [newEntry, setNewEntry] = useState<FinancialEntry>({
    concepto: '',
    monto: 0,
    categoria_id: '',
    canal_reclutamiento: '',
    fecha_gasto: new Date().toISOString().split('T')[0],
    estado: 'pendiente',
    leads_generados: 0,
    entrevistas_realizadas: 0,
    documentacion_completada: 0
  });
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [candidatesData, setCandidatesData] = useState<any[]>([]);
  const { toast } = useToast();
  const { formatCurrency } = useFormatters();

  const categories = [
    { id: 'staff', name: 'Personal/Recursos Humanos' },
    { id: 'gps', name: 'GPS/Tecnología' },
    { id: 'plataforma', name: 'Plataforma Digital' },
    { id: 'publicidad', name: 'Publicidad/Marketing' },
    { id: 'eventos', name: 'Eventos/Ferias' },
    { id: 'referidos', name: 'Bonos Referidos' },
    { id: 'toxicologia', name: 'Toxicología/Evaluaciones' },
    { id: 'evaluaciones', name: 'Evaluaciones/Capacitación' },
    { id: 'operaciones', name: 'Gastos Operativos' }
  ];

  const channels = [
    'Facebook Ads',
    'Google Ads',
    'LinkedIn',
    'Referidos',
    'Eventos Presenciales',
    'WhatsApp',
    'Directo',
    'Otros'
  ];

  useEffect(() => {
    fetchEntries();
    fetchCandidatesData();
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      calculateMetrics();
    }
  }, [entries, candidatesData]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gastos_externos')
        .select('*')
        .order('fecha_gasto', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const formattedEntries = (data || []).map(entry => ({
        id: entry.id,
        concepto: entry.concepto || '',
        monto: entry.monto || 0,
        categoria_id: entry.categoria_id || '',
        canal_reclutamiento: entry.canal_reclutamiento || '',
        fecha_gasto: entry.fecha_gasto || '',
        estado: (entry.estado === 'aprobado' || entry.estado === 'pagado' ? entry.estado : 'pendiente') as 'pendiente' | 'aprobado' | 'pagado',
        notas: entry.notas || '',
        proveedor: entry.proveedor || '',
        metodo_pago: entry.metodo_pago || '',
        numero_factura: entry.numero_factura || ''
      }));

      setEntries(formattedEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los gastos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidatesData = async () => {
    try {
      const { data, error } = await supabase
        .from('candidatos_custodios')
        .select('*')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      setCandidatesData(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const calculateMetrics = () => {
    const totalInvestment = entries.reduce((sum, entry) => 
      entry.estado !== 'pendiente' ? sum + entry.monto : sum, 0
    );

    // Calcular métricas de candidatos
    const totalLeads = candidatesData.filter(c => c.estado_proceso === 'lead').length;
    const totalEntrevistas = candidatesData.filter(c => c.estado_proceso === 'entrevista').length;
    const totalDocumentacion = candidatesData.filter(c => c.estado_proceso === 'documentacion').length;
    const totalActivos = candidatesData.filter(c => c.estado_proceso === 'activo').length;

    const leadToCustomerRate = totalLeads > 0 ? (totalActivos / totalLeads) * 100 : 0;
    const monthlyApprovalRate = totalEntrevistas > 0 ? (totalActivos / totalEntrevistas) * 100 : 0;
    const costPerLead = totalLeads > 0 ? totalInvestment / totalLeads : 0;

    // CPA basado en datos reales de candidatos
    const realCPA = totalActivos > 0 ? totalInvestment / totalActivos : 0;
    const projectedCPA = totalLeads > 0 ? totalInvestment / totalLeads : 0;
    const efficiency = projectedCPA > 0 ? 
      (projectedCPA - realCPA) / projectedCPA * 100 : 0;

    const conversionRate = totalLeads > 0 ? (totalActivos / totalLeads) * 100 : 0;

    // Calcular LTV promedio (estimado)
    const estimatedLTV = 15000; // Promedio estimado basado en servicios
    const roi = realCPA > 0 ? (estimatedLTV / realCPA - 1) * 100 : 0;

    // Validación cruzada
    const validation = RecruitmentMathEngine.crossValidateMetrics({
      cpa: realCPA,
      retention: 0.85, // Estimado
      ltv: estimatedLTV,
      roi: roi,
      volume: totalActivos
    });

    setMetrics({
      realCPA,
      projectedCPA,
      efficiency,
      roi,
      totalInvestment,
      conversionRate,
      costPerLead,
      leadToCustomerRate,
      monthlyApprovalRate,
      totalLeads,
      totalApprovals: totalActivos,
      validation
    });
  };

  const addEntry = async () => {
    if (!newEntry.concepto || !newEntry.monto || !newEntry.canal_reclutamiento) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gastos_externos')
        .insert([{
          concepto: newEntry.concepto,
          monto: newEntry.monto,
          categoria_id: newEntry.categoria_id || null,
          canal_reclutamiento: newEntry.canal_reclutamiento,
          fecha_gasto: newEntry.fecha_gasto,
          estado: newEntry.estado,
          notas: newEntry.notas,
          proveedor: newEntry.proveedor,
          metodo_pago: newEntry.metodo_pago,
          numero_factura: newEntry.numero_factura,
          registrado_por: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Gasto registrado correctamente"
      });

      // Reset form
      setNewEntry({
        concepto: '',
        monto: 0,
        categoria_id: '',
        canal_reclutamiento: '',
        fecha_gasto: new Date().toISOString().split('T')[0],
        estado: 'pendiente',
        leads_generados: 0,
        entrevistas_realizadas: 0,
        documentacion_completada: 0
      });

      fetchEntries();
      fetchCandidatesData();
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el gasto",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Métricas en tiempo real */}
      {metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">CPA Real</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.realCPA)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.efficiency > 0 ? '+' : ''}{metrics.efficiency.toFixed(1)}% vs objetivo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tasa de Conversión</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.conversionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Lead a Custodio Activo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Costo por Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.costPerLead)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalLeads} leads generados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">ROI Estimado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.roi.toFixed(1)}%
                </div>
                <Badge variant={metrics.roi > 200 ? 'default' : 'secondary'}>
                  {metrics.roi > 200 ? 'Excelente' : 'En desarrollo'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Aprobación Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.monthlyApprovalRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Entrevista a Activo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Inversión Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.totalInvestment)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Últimos 90 días
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Validación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.validation.confidenceScore * 100).toFixed(0)}%
                </div>
                <Badge variant={metrics.validation.isValid ? 'default' : 'destructive'}>
                  {metrics.validation.isValid ? 'Válido' : 'Revisar'}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Formulario de nuevo gasto */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nuevo Gasto de Adquisición</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="concepto">Concepto *</Label>
              <Input
                id="concepto"
                value={newEntry.concepto}
                onChange={(e) => setNewEntry(prev => ({ ...prev, concepto: e.target.value }))}
                placeholder="Describe el gasto..."
              />
            </div>

            <div>
              <Label htmlFor="monto">Monto *</Label>
              <Input
                id="monto"
                type="number"
                value={newEntry.monto}
                onChange={(e) => setNewEntry(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={newEntry.categoria_id}
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, categoria_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="canal">Canal de Reclutamiento *</Label>
              <Select
                value={newEntry.canal_reclutamiento}
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, canal_reclutamiento: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona canal" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map(channel => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="proveedor">Proveedor</Label>
              <Input
                id="proveedor"
                value={newEntry.proveedor || ''}
                onChange={(e) => setNewEntry(prev => ({ ...prev, proveedor: e.target.value }))}
                placeholder="Nombre del proveedor"
              />
            </div>

            <div>
              <Label htmlFor="metodo_pago">Método de Pago</Label>
              <Select
                value={newEntry.metodo_pago || ''}
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, metodo_pago: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="leads_generados">Leads Esperados</Label>
              <Input
                id="leads_generados"
                type="number"
                value={newEntry.leads_generados || 0}
                onChange={(e) => setNewEntry(prev => ({ ...prev, leads_generados: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="entrevistas_realizadas">Entrevistas Esperadas</Label>
              <Input
                id="entrevistas_realizadas"
                type="number"
                value={newEntry.entrevistas_realizadas || 0}
                onChange={(e) => setNewEntry(prev => ({ ...prev, entrevistas_realizadas: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={newEntry.estado}
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, estado: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero_factura">Número de Factura</Label>
              <Input
                id="numero_factura"
                value={newEntry.numero_factura || ''}
                onChange={(e) => setNewEntry(prev => ({ ...prev, numero_factura: e.target.value }))}
                placeholder="Número de factura"
              />
            </div>

            <div>
              <Label htmlFor="fecha_gasto">Fecha del Gasto</Label>
              <Input
                id="fecha_gasto"
                type="date"
                value={newEntry.fecha_gasto}
                onChange={(e) => setNewEntry(prev => ({ ...prev, fecha_gasto: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notas">Notas Adicionales</Label>
            <Textarea
              id="notas"
              value={newEntry.notas || ''}
              onChange={(e) => setNewEntry(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Notas adicionales sobre el gasto..."
              rows={3}
            />
          </div>

          <Button onClick={addEntry} className="w-full">
            Registrar Gasto
          </Button>
        </CardContent>
      </Card>

      {/* Alertas de validación */}
      {metrics && !metrics.validation.isValid && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Inconsistencias Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-4 space-y-1">
              {metrics.validation.inconsistencies.map((issue, index) => (
                <li key={index} className="text-sm">{issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};