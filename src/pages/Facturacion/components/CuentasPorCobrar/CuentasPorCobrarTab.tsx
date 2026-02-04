import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Calendar } from 'lucide-react';
import { 
  useAgingCuentasPorCobrar, 
  useCxCMetrics, 
  AgingData 
} from '../../hooks/useCuentasPorCobrar';
import { AgingKPIBar } from './AgingKPIBar';
import { AgingTable } from './AgingTable';
import { SeguimientoCobranzaModal } from './SeguimientoCobranzaModal';
import * as XLSX from 'xlsx';

export function CuentasPorCobrarTab() {
  const { data: agingData = [], isLoading, refetch } = useAgingCuentasPorCobrar();
  const metrics = useCxCMetrics(agingData);
  
  const [selectedCliente, setSelectedCliente] = useState<AgingData | null>(null);
  const [showCobranzaModal, setShowCobranzaModal] = useState(false);

  const handleCobranza = (cliente: AgingData) => {
    setSelectedCliente(cliente);
    setShowCobranzaModal(true);
  };

  const handleViewClient = (cliente: AgingData) => {
    // TODO: Open client detail drawer/modal
    console.log('View client:', cliente);
  };

  const handleExport = () => {
    const exportData = agingData.map(d => ({
      'Cliente': d.cliente_nombre,
      'RFC': d.cliente_rfc,
      'Total Facturado': d.total_facturado,
      'Total Pagado': d.total_pagado,
      'Saldo Pendiente': d.saldo_pendiente,
      'Vigente': d.vigente,
      '1-30 días': d.vencido_1_30,
      '31-60 días': d.vencido_31_60,
      '61-90 días': d.vencido_61_90,
      '>90 días': d.vencido_90_mas,
      'Días Crédito': d.dias_credito,
      'Límite Crédito': d.limite_credito,
      'Prioridad': d.prioridad_cobranza,
      '# Facturas': d.num_facturas,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aging CxC');
    XLSX.writeFile(wb, `aging_cxc_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Calculate upcoming actions summary
  const clientesConVencido90 = agingData.filter(d => (d.vencido_90_mas || 0) > 0).length;
  const totalVencidoProximo = agingData.reduce((sum, d) => sum + (d.vencido_1_30 || 0), 0);

  return (
    <div className="space-y-4">
      {/* KPI Bar */}
      <AgingKPIBar metrics={metrics} isLoading={isLoading} />

      {/* Main Content */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Antigüedad de Saldos por Cliente
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={handleExport}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Exportar
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <AgingTable 
            data={agingData}
            isLoading={isLoading}
            onViewClient={handleViewClient}
            onCobranza={handleCobranza}
          />
        </CardContent>
      </Card>

      {/* Alerts Summary */}
      {(clientesConVencido90 > 0 || totalVencidoProximo > 0) && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-4 text-sm">
              <Calendar className="h-4 w-4 text-amber-600" />
              <div className="flex gap-6">
                {clientesConVencido90 > 0 && (
                  <span className="text-red-700 dark:text-red-400">
                    <strong>{clientesConVencido90}</strong> clientes con saldo &gt;90 días
                  </span>
                )}
                {totalVencidoProximo > 0 && (
                  <span className="text-amber-700 dark:text-amber-400">
                    <strong>${totalVencidoProximo.toLocaleString('es-MX')}</strong> próximo a vencer (1-30d)
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cobranza Modal */}
      <SeguimientoCobranzaModal 
        open={showCobranzaModal}
        onOpenChange={setShowCobranzaModal}
        cliente={selectedCliente}
      />
    </div>
  );
}
