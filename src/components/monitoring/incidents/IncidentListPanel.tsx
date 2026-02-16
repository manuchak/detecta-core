import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Shield, AlertTriangle, FileText, Loader2, XCircle, Check, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { SignaturePad } from '@/components/custodian/checklist/SignaturePad';
import {
  useIncidentesList, useIncidenteResumen, useUpdateIncidente,
  TIPOS_INCIDENTE, SEVERIDADES,
  type IncidenteOperativo, type EstadoIncidente, type SeveridadIncidente, type FiltrosIncidentes,
} from '@/hooks/useIncidentesOperativos';
import { IncidentReportForm } from './IncidentReportForm';
import { exportIncidentePDF } from './IncidentPDFExporter';
import { useIncidenteCronologia } from '@/hooks/useIncidentesOperativos';

const ESTADOS_BADGE: Record<string, string> = {
  borrador: 'bg-gray-500/10 text-gray-600',
  abierto: 'bg-blue-500/10 text-blue-600',
  en_investigacion: 'bg-purple-500/10 text-purple-600',
  resuelto: 'bg-emerald-500/10 text-emerald-600',
  cerrado: 'bg-muted text-muted-foreground',
};

const ROLES_CERRAR_INCIDENTE = ['admin', 'owner', 'coordinador_operaciones'];

export const IncidentListPanel: React.FC = () => {
  const [filtros, setFiltros] = useState<FiltrosIncidentes>({});
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedIncident, setSelectedIncident] = useState<IncidenteOperativo | null>(null);
  const [closingIncidentId, setClosingIncidentId] = useState<string | null>(null);
  const [firmaCierre, setFirmaCierre] = useState<string | null>(null);

  const { userRole, user } = useAuth();
  const canClose = ROLES_CERRAR_INCIDENTE.includes(userRole || '');

  const { data: incidentes = [], isLoading } = useIncidentesList(filtros);
  const { data: resumen } = useIncidenteResumen();
  const updateMutation = useUpdateIncidente();

  const handleNew = () => {
    setSelectedIncident(null);
    setView('form');
  };

  const handleEdit = (inc: IncidenteOperativo) => {
    setSelectedIncident(inc);
    setView('form');
  };

  const handleBack = () => {
    setView('list');
    setSelectedIncident(null);
  };

  const handleConfirmClose = async () => {
    if (!closingIncidentId || !firmaCierre) return;
    try {
      await updateMutation.mutateAsync({
        id: closingIncidentId,
        estado: 'cerrado',
        fecha_resolucion: new Date().toISOString(),
        firma_cierre_base64: firmaCierre,
        firma_cierre_email: user?.email || null,
        firma_cierre_timestamp: new Date().toISOString(),
      } as any);
      toast.success('Incidente cerrado');
    } catch (err: any) {
      toast.error(err.message || 'Error al cerrar incidente');
    } finally {
      setClosingIncidentId(null);
      setFirmaCierre(null);
    }
  };

  if (view === 'form') {
    return <IncidentReportForm incidente={selectedIncident} onBack={handleBack} />;
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Borradores', value: resumen?.borradores || 0, color: 'text-gray-600' },
          { label: 'Abiertos', value: resumen?.abiertos || 0, color: 'text-blue-600' },
          { label: 'En investigación', value: resumen?.en_investigacion || 0, color: 'text-purple-600' },
          { label: 'Resueltos', value: resumen?.resueltos || 0, color: 'text-emerald-600' },
          { label: 'Cerrados', value: resumen?.cerrados || 0, color: 'text-muted-foreground' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={filtros.estado || 'todos'}
            onValueChange={v => setFiltros(p => ({ ...p, estado: v === 'todos' ? null : v as EstadoIncidente }))}
          >
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="abierto">Abierto</SelectItem>
              <SelectItem value="en_investigacion">En investigación</SelectItem>
              <SelectItem value="resuelto">Resuelto</SelectItem>
              <SelectItem value="cerrado">Cerrado</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filtros.severidad || 'todos'}
            onValueChange={v => setFiltros(p => ({ ...p, severidad: v === 'todos' ? null : v as SeveridadIncidente }))}
          >
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Severidad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {SEVERIDADES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleNew} className="gap-1 h-8 text-xs">
          <Plus className="h-3 w-3" />
          Nuevo Reporte
        </Button>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : incidentes.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Shield className="h-12 w-12 text-muted-foreground/20 mx-auto" />
              <p className="text-sm font-medium">Sin incidentes registrados</p>
              <p className="text-xs text-muted-foreground">Crea un nuevo reporte para comenzar a documentar</p>
              <Button onClick={handleNew} variant="outline" className="gap-1 mt-2">
                <Plus className="h-3 w-3" />
                Crear primer reporte
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {incidentes.map(inc => {
                const sev = SEVERIDADES.find(s => s.value === inc.severidad);
                const tipoLabel = TIPOS_INCIDENTE.find(t => t.value === inc.tipo)?.label || inc.tipo;
                const incAny = inc as any;
                return (
                  <button
                    key={inc.id}
                    onClick={() => handleEdit(inc)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    {/* Línea 1: Badges + Tipo + Fecha */}
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[9px] h-5 px-2 shrink-0 ${sev?.color || ''}`}>
                        {inc.severidad}
                      </Badge>
                      <Badge variant="outline" className={`text-[9px] h-5 px-2 shrink-0 ${ESTADOS_BADGE[inc.estado] || ''}`}>
                        {inc.estado}
                      </Badge>
                      <span className="text-xs font-medium truncate flex-1">{tipoLabel}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                        {format(new Date(inc.fecha_incidente), 'dd/MM/yy HH:mm', { locale: es })}
                      </span>
                      {canClose && inc.estado !== 'cerrado' && (
                        <button
                          type="button"
                          title="Cerrar incidente"
                          onClick={(e) => { e.stopPropagation(); setClosingIncidentId(inc.id); }}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {/* Línea 2: Cliente | Zona | Servicio | Atribuible */}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                      {inc.cliente_nombre && <span>{inc.cliente_nombre}</span>}
                      {inc.cliente_nombre && inc.zona && <span>•</span>}
                      {inc.zona && <span>{inc.zona}</span>}
                      {incAny.id_servicio_texto && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Link2 className="h-3 w-3" />{incAny.id_servicio_texto}</span>
                        </>
                      )}
                      {inc.atribuible_operacion && (
                        <>
                          <span>•</span>
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        </>
                      )}
                    </div>
                    {/* Línea 3: Descripción + Indicadores de firma */}
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] text-muted-foreground truncate flex-1">
                        {inc.descripcion?.length > 60 ? inc.descripcion.slice(0, 60) + '…' : inc.descripcion}
                      </p>
                      {inc.firma_creacion_base64 && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 gap-0.5 shrink-0 border-emerald-300 text-emerald-600">
                          <Check className="h-2.5 w-2.5" /> Firmado
                        </Badge>
                      )}
                      {inc.firma_cierre_base64 && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 shrink-0 border-blue-300 text-blue-600">
                          🔒 Cerrado
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AlertDialog para confirmar cierre */}
      <AlertDialog open={!!closingIncidentId} onOpenChange={(open) => { if (!open) { setClosingIncidentId(null); setFirmaCierre(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cierre de incidente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cambiará el estado a cerrado. Firma digital requerida para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <SignaturePad value={firmaCierre} onChange={setFirmaCierre} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} disabled={!firmaCierre || updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Cerrar incidente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
