// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

// Helper function for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

interface FinancialEntry {
  id: string;
  concepto: string;
  monto: number;
  categoria_id: string | null;
  canal_reclutamiento: string | null;
  fecha_gasto: string;
  estado: string;
  leads_generados?: number | null;
  custodios_reales?: number | null;
  descripcion?: string | null;
}

export const FinancialTrackingSystem = () => {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gastos_externos')
        .select('*')
        .order('fecha_gasto', { ascending: false })
        .limit(20); // Mostrar solo los últimos 20

      if (error) throw error;

      setEntries((data || []) as FinancialEntry[]);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
            <span className="text-2xl">💰</span>
          </div>
          <h3 className="text-lg font-medium mb-2">No hay gastos registrados</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Usa la pestaña "Gestionar Gastos" para registrar tus primeros gastos de reclutamiento
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalInvestment = entries
    .filter(entry => entry.estado === 'aprobado')
    .reduce((sum, entry) => sum + entry.monto, 0);

  const totalCustodians = entries
    .reduce((sum, entry) => sum + (entry.custodios_reales || 0), 0);

  return (
    <div className="space-y-6">
      {/* Resumen simple */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invertido
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {formatCurrency(totalInvestment)}
            </div>
            <p className="text-sm text-muted-foreground">
              Gastos aprobados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custodios Obtenidos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {totalCustodians}
            </div>
            <p className="text-sm text-muted-foreground">
              Total registrado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo Promedio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {totalCustodians > 0 ? formatCurrency(totalInvestment / totalCustodians) : '$0'}
            </div>
            <p className="text-sm text-muted-foreground">
              Por custodio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de gastos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gastos Recientes</h3>
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="border-l-4 border-l-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{entry.concepto}</h4>
                      <Badge 
                        variant={entry.estado === 'aprobado' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {entry.estado}
                      </Badge>
                    </div>
                    
                    {entry.descripcion && (
                      <p className="text-sm text-muted-foreground">
                        {entry.descripcion}
                      </p>
                    )}
                    
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>📅 {new Date(entry.fecha_gasto).toLocaleDateString('es-MX')}</span>
                      {entry.canal_reclutamiento && (
                        <span>📢 {entry.canal_reclutamiento}</span>
                      )}
                      {entry.custodios_reales && entry.custodios_reales > 0 && (
                        <span>👥 {entry.custodios_reales} custodios</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatCurrency(entry.monto)}
                    </div>
                    {entry.custodios_reales && entry.custodios_reales > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(entry.monto / entry.custodios_reales)} c/u
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};