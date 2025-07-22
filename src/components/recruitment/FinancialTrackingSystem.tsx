import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RecruitmentMathEngine } from '@/lib/RecruitmentMathEngine';
import { Badge } from '@/components/ui/badge';

interface FinancialEntry {
  id?: string;
  concepto: string;
  monto: number;
  categoria_id: string;
  canal_reclutamiento: string;
  custodios_objetivo: number;
  custodios_reales: number;
  fecha_gasto: string;
  estado: 'pendiente' | 'aprobado' | 'pagado';
  notas?: string;
}

interface FinancialMetrics {
  realCPA: number;
  projectedCPA: number;
  efficiency: number;
  roi: number;
  totalInvestment: number;
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
    custodios_objetivo: 0,
    custodios_reales: 0,
    fecha_gasto: new Date().toISOString().split('T')[0],
    estado: 'pendiente'
  });
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const categories = [
    { id: 'staff', name: 'Personal' },
    { id: 'gps', name: 'GPS/Tecnología' },
    { id: 'plataforma', name: 'Plataforma Digital' },
    { id: 'publicidad', name: 'Publicidad' },
    { id: 'eventos', name: 'Eventos' },
    { id: 'referidos', name: 'Bonos Referidos' }
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
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      calculateMetrics();
    }
  }, [entries]);

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
        custodios_objetivo: entry.custodios_objetivo || 0,
        custodios_reales: entry.custodios_reales || 0,
        fecha_gasto: entry.fecha_gasto || '',
        estado: (entry.estado === 'aprobado' || entry.estado === 'pagado' ? entry.estado : 'pendiente') as 'pendiente' | 'aprobado' | 'pagado',
        notas: entry.notas || ''
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

  const calculateMetrics = () => {
    const totalInvestment = entries.reduce((sum, entry) => 
      entry.estado !== 'pendiente' ? sum + entry.monto : sum, 0
    );
    
    const totalCustodiosReales = entries.reduce((sum, entry) => 
      sum + entry.custodios_reales, 0
    );
    
    const totalCustodiosObjetivo = entries.reduce((sum, entry) => 
      sum + entry.custodios_objetivo, 0
    );

    const realCPA = RecruitmentMathEngine.calculateRealCPA(
      totalInvestment,
      totalCustodiosReales,
      30
    );

    const projectedCPA = totalCustodiosObjetivo > 0 ? 
      totalInvestment / totalCustodiosObjetivo : 0;

    const efficiency = projectedCPA > 0 ? 
      (projectedCPA - realCPA) / projectedCPA * 100 : 0;

    // Calcular LTV promedio (estimado)
    const estimatedLTV = 15000; // Promedio estimado basado en servicios
    const roi = realCPA > 0 ? (estimatedLTV / realCPA - 1) * 100 : 0;

    // Validación cruzada
    const validation = RecruitmentMathEngine.crossValidateMetrics({
      cpa: realCPA,
      retention: 0.85, // Estimado
      ltv: estimatedLTV,
      roi: roi,
      volume: totalCustodiosReales
    });

    setMetrics({
      realCPA,
      projectedCPA,
      efficiency,
      roi,
      totalInvestment,
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
          custodios_objetivo: newEntry.custodios_objetivo,
          custodios_reales: newEntry.custodios_reales,
          fecha_gasto: newEntry.fecha_gasto,
          estado: newEntry.estado,
          notas: newEntry.notas,
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
        custodios_objetivo: 0,
        custodios_reales: 0,
        fecha_gasto: new Date().toISOString().split('T')[0],
        estado: 'pendiente'
      });

      fetchEntries();
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">CPA Real</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.realCPA.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.efficiency > 0 ? '+' : ''}{metrics.efficiency.toFixed(1)}% vs objetivo
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Inversión Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.totalInvestment.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 días
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
      )}

      {/* Formulario de nuevo gasto */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nuevo Gasto de Adquisición</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Label htmlFor="custodios_objetivo">Custodios Objetivo</Label>
              <Input
                id="custodios_objetivo"
                type="number"
                value={newEntry.custodios_objetivo}
                onChange={(e) => setNewEntry(prev => ({ ...prev, custodios_objetivo: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="custodios_reales">Custodios Reales</Label>
              <Input
                id="custodios_reales"
                type="number"
                value={newEntry.custodios_reales}
                onChange={(e) => setNewEntry(prev => ({ ...prev, custodios_reales: parseInt(e.target.value) || 0 }))}
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