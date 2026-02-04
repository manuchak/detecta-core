import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, CreditCard, FileText } from 'lucide-react';
import { 
  useAgingCuentasPorCobrar, 
  useCxCMetrics, 
  AgingData 
} from '../../hooks/useCuentasPorCobrar';
import { FacturaCliente } from '../../hooks/useFacturasCliente';
import { AgingKPIBar } from './AgingKPIBar';
import { AgingTable } from './AgingTable';
import { SeguimientoCobranzaModal } from './SeguimientoCobranzaModal';
import { ClienteFacturasDrawer } from './ClienteFacturasDrawer';
import { RegistrarPagoModal } from './RegistrarPagoModal';
import { EstadoCuentaModal } from './EstadoCuentaModal';
import { AgendaCobranzaPanel } from './AgendaCobranzaPanel';
import { HistorialCobranzaTimeline } from './HistorialCobranzaTimeline';
import * as XLSX from 'xlsx';

export function CuentasPorCobrarTab() {
  const { data: agingData = [], isLoading, refetch } = useAgingCuentasPorCobrar();
  const metrics = useCxCMetrics(agingData);
  
  // Modal states
  const [selectedCliente, setSelectedCliente] = useState<AgingData | null>(null);
  const [showCobranzaModal, setShowCobranzaModal] = useState(false);
  const [showFacturasDrawer, setShowFacturasDrawer] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showEstadoCuentaModal, setShowEstadoCuentaModal] = useState(false);
  const [facturaPreseleccionada, setFacturaPreseleccionada] = useState<FacturaCliente | null>(null);

  const handleCobranza = (cliente: AgingData) => {
    setSelectedCliente(cliente);
    setShowCobranzaModal(true);
  };

  const handleViewClient = (cliente: AgingData) => {
    setSelectedCliente(cliente);
    setShowFacturasDrawer(true);
  };

  const handleRegistrarPago = (cliente: AgingData) => {
    setSelectedCliente(cliente);
    setFacturaPreseleccionada(null);
    setShowPagoModal(true);
  };

  const handleRegistrarPagoFactura = (factura: FacturaCliente) => {
    // Find the cliente from agingData
    const cliente = agingData.find(c => c.cliente_id === factura.cliente_id);
    if (cliente) {
      setSelectedCliente(cliente);
      setFacturaPreseleccionada(factura);
      setShowPagoModal(true);
    }
  };

  const handleVerEstadoCuenta = (cliente: AgingData) => {
    setSelectedCliente(cliente);
    setShowEstadoCuentaModal(true);
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

  return (
    <div className="space-y-4">
      {/* KPI Bar */}
      <AgingKPIBar metrics={metrics} isLoading={isLoading} />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Aging Table - Takes 2 columns */}
        <div className="lg:col-span-2">
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
        </div>

        {/* Side Panel - Agenda + Historial */}
        <div className="space-y-4">
          <AgendaCobranzaPanel 
            onAccionClick={(accion) => {
              const cliente = agingData.find(c => c.cliente_id === accion.cliente_id);
              if (cliente) {
                setSelectedCliente(cliente);
                if (accion.tipo === 'promesa' || accion.tipo === 'vencimiento') {
                  setShowFacturasDrawer(true);
                } else {
                  setShowCobranzaModal(true);
                }
              }
            }}
          />
          
          <HistorialCobranzaTimeline maxItems={10} />
        </div>
      </div>

      {/* Modals */}
      <SeguimientoCobranzaModal 
        open={showCobranzaModal}
        onOpenChange={setShowCobranzaModal}
        cliente={selectedCliente}
      />

      <ClienteFacturasDrawer
        open={showFacturasDrawer}
        onOpenChange={setShowFacturasDrawer}
        cliente={selectedCliente}
        onRegistrarPago={handleRegistrarPagoFactura}
        onVerDetalle={(factura) => {
          // Could open a detail modal in the future
          console.log('Ver detalle factura:', factura);
        }}
      />

      <RegistrarPagoModal
        open={showPagoModal}
        onOpenChange={(open) => {
          setShowPagoModal(open);
          if (!open) setFacturaPreseleccionada(null);
        }}
        cliente={selectedCliente}
        facturaPreseleccionada={facturaPreseleccionada}
      />

      <EstadoCuentaModal
        open={showEstadoCuentaModal}
        onOpenChange={setShowEstadoCuentaModal}
        cliente={selectedCliente}
      />
    </div>
  );
}
