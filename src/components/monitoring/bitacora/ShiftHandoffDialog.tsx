import React, { useState, useMemo, useEffect } from 'react';
import type { HandoffResult } from '@/hooks/useShiftHandoff';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowRightLeft, AlertTriangle, AlertCircle, Clock, ChevronRight,
  ChevronLeft, User, Zap, CheckCircle2, Download,
} from 'lucide-react';
import { useMonitoristaAssignment, MonitoristaProfile, getCurrentTurno, getTurnoLabel } from '@/hooks/useMonitoristaAssignment';
import { useShiftHandoff, distributeEquitably, type ServiceContext } from '@/hooks/useShiftHandoff';
import { useUserRole } from '@/hooks/useUserRole';
import { SignaturePad } from '@/components/custodian/checklist/SignaturePad';
import { pdf } from '@react-pdf/renderer';
import { HandoffActaPDF, type HandoffActaData } from './pdf/HandoffActaPDF';

const PRIVILEGED_ROLES = ['admin', 'owner', 'coordinador_operaciones', 'monitoring_supervisor'] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, restricts outgoing to only this monitorist (self-handoff) */
  selfMonitoristaId?: string;
}

const TURNOS = [
  { value: 'matutino', label: 'Matutino' },
  { value: 'vespertino', label: 'Vespertino' },
  { value: 'nocturno', label: 'Nocturno' },
];

const STEP_LABELS = ['Contexto', 'Entrantes', 'Confirmar y Firmar'];

export const ShiftHandoffDialog: React.FC<Props> = ({ open, onOpenChange, selfMonitoristaId }) => {
  const { monitoristas, assignmentsByMonitorista } = useMonitoristaAssignment();
  const { userId, hasAnyRole } = useUserRole();
  const isPrivileged = hasAnyRole(PRIVILEGED_ROLES as any);
  // Effective self ID: explicit prop OR auto-detected for non-privileged users
  const effectiveSelfId = selfMonitoristaId || (!isPrivileged ? userId : null);
  const [step, setStep] = useState(0);
  const [selectedSalienteIds, setSelectedSalienteIds] = useState<Set<string>>(new Set());
  const [selectedEntranteIds, setSelectedEntranteIds] = useState<Set<string>>(new Set());
  const [turnoEntrante, setTurnoEntrante] = useState('matutino');
  const [notasGenerales, setNotasGenerales] = useState('');
  const [notasPorServicio, setNotasPorServicio] = useState<Record<string, string>>({});
  const [distribucionMode, setDistribucionMode] = useState<'auto' | 'manual'>('auto');
  const [manualDistribucion, setManualDistribucion] = useState<Record<string, string>>({});
  const [firmaEntrega, setFirmaEntrega] = useState<string | null>(null);
  const [firmaEntrante, setFirmaEntrante] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(0);
      setSelectedSalienteIds(effectiveSelfId ? new Set([effectiveSelfId]) : new Set());
      setSelectedEntranteIds(new Set());
      setNotasGenerales('');
      setNotasPorServicio({});
      setManualDistribucion({});
      setFirmaEntrega(null);
      setFirmaEntrante(null);
    }
  }, [open, effectiveSelfId]);

  const salientes = monitoristas.filter(m => selectedSalienteIds.has(m.id));
  const { serviciosContext, totalIncidentes, isLoading, executeHandoff } = useShiftHandoff(salientes);

  // Enriched services with per-service notes
  const enrichedServicios: ServiceContext[] = serviciosContext.map(s => ({
    ...s,
    notas_servicio: notasPorServicio[s.servicio_id] || '',
  }));

  // Available entrantes = monitoristas not in salientes
  const availableEntrantes = monitoristas.filter(m => !selectedSalienteIds.has(m.id));

  // Distribution
  const entranteIds = Array.from(selectedEntranteIds);
  const distribucion = useMemo(() => {
    if (distribucionMode === 'manual') return manualDistribucion;
    return distributeEquitably(enrichedServicios, entranteIds);
  }, [distribucionMode, manualDistribucion, enrichedServicios, entranteIds]);

  // Toggle saliente
  const toggleSaliente = (id: string) => {
    if (effectiveSelfId) return; // locked in self-mode or non-privileged
    setSelectedSalienteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleEntrante = (id: string) => {
    setSelectedEntranteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const canProceedStep0 = selectedSalienteIds.size > 0 && enrichedServicios.length > 0;
  const canProceedStep1 = selectedEntranteIds.size > 0;
  const hasIncidents = totalIncidentes > 0;

  const handleConfirm = () => {
    const entrantes = monitoristas.filter(m => selectedEntranteIds.has(m.id));
    executeHandoff.mutate({
      salientes,
      entrantes,
      turnoEntrante,
      servicios: enrichedServicios,
      distribucion,
      notasGenerales,
      firmaDataUrl: firmaEntrega || undefined,
      firmaEntranteDataUrl: firmaEntrante || undefined,
    }, {
      onSuccess: async (result) => {
        // Generate and download PDF
        try {
          const actaData: HandoffActaData = {
            turnoSaliente: getCurrentTurno(),
            turnoEntrante,
            salientes: result.payload.salientes.map(m => ({ id: m.id, display_name: m.display_name })),
            entrantes: result.payload.entrantes.map(m => ({ id: m.id, display_name: m.display_name })),
            serviciosTransferidos: result.serviciosTransferidos,
            serviciosCerrados: result.serviciosCerrados,
            incidentesAbiertos: result.incidentesAbiertos,
            notasGenerales,
            firmaBase64: firmaEntrega || undefined,
            firmaEntranteBase64: firmaEntrante || undefined,
            firmaEmail: result.userEmail || undefined,
            firmaTimestamp: new Date().toISOString(),
          };
          const blob = await pdf(<HandoffActaPDF data={actaData} />).toBlob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `acta-entrega-turno-${new Date().toISOString().slice(0, 10)}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error('Error generando PDF del acta:', e);
        }
        onOpenChange(false);
      },
    });
  };

  const getEntranteName = (id: string) => monitoristas.find(m => m.id === id)?.display_name?.split(' ')[0] || '?';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" /> Entrega de Turno
          </DialogTitle>
          <DialogDescription>
            {STEP_LABELS.map((label, i) => (
              <span key={i} className={i === step ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                {i > 0 && ' → '}{label}
              </span>
            ))}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          {/* ─── STEP 0: Context ─── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                  {effectiveSelfId ? 'Monitorista saliente (tú)' : 'Monitoristas salientes'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(effectiveSelfId ? monitoristas.filter(m => m.id === effectiveSelfId) : monitoristas.filter(m => m.en_turno)).map(m => {
                    const count = (assignmentsByMonitorista[m.id] || []).length;
                    const selected = selectedSalienteIds.has(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleSaliente(m.id)}
                        disabled={!!effectiveSelfId}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-colors ${
                          selected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-accent'
                        } ${effectiveSelfId ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <User className="h-3 w-3" />
                        {m.display_name.split(' ')[0]} · {count} serv.
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedSalienteIds.size > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
                      Servicios activos ({enrichedServicios.length})
                    </label>
                    <div className="flex items-center gap-2">
                      {totalIncidentes > 0 && (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <AlertCircle className="h-3 w-3" /> {totalIncidentes} incidentes abiertos
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isLoading ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Cargando servicios...</p>
                  ) : enrichedServicios.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sin servicios activos para transferir</p>
                  ) : (
                    <div className="space-y-1">
                      {enrichedServicios.map(svc => (
                        <div
                          key={svc.servicio_id}
                          className={`border rounded-md p-2.5 space-y-1.5 ${
                            svc.tiene_incidente ? 'border-destructive/50 bg-destructive/5' : 'border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {svc.tiene_incidente && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                              <span className="text-xs font-medium truncate">{svc.cliente}</span>
                              <Badge variant="outline" className="text-[9px] shrink-0">{svc.fase}</Badge>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                              <Clock className="h-3 w-3" />
                              {svc.minutos_inactivo > 60
                                ? `${Math.floor(svc.minutos_inactivo / 60)}h ${svc.minutos_inactivo % 60}m`
                                : `${svc.minutos_inactivo}m`} sin actividad
                            </div>
                          </div>

                          {svc.ultimo_evento && (
                            <p className="text-[10px] text-muted-foreground">
                              Último: {svc.ultimo_evento}
                            </p>
                          )}

                          {svc.incidentes.map(inc => (
                            <div key={inc.id} className="flex items-center gap-1.5 text-[10px] text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              <Badge variant="destructive" className="text-[9px]">{inc.severidad}</Badge>
                              <span className="truncate">{inc.tipo}: {inc.descripcion.slice(0, 60)}</span>
                            </div>
                          ))}

                          <Textarea
                            placeholder="Notas para este servicio..."
                            className="text-[11px] min-h-[28px] h-7 py-1 px-2 resize-none"
                            value={notasPorServicio[svc.servicio_id] || ''}
                            onChange={e => setNotasPorServicio(prev => ({
                              ...prev,
                              [svc.servicio_id]: e.target.value,
                            }))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 1: Incoming selection ─── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Turno entrante</label>
                <Select value={turnoEntrante} onValueChange={setTurnoEntrante}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TURNOS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Selecciona monitoristas entrantes (1 o más)
                </label>
                <div className="space-y-1">
                  {availableEntrantes.map(m => (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={selectedEntranteIds.has(m.id)}
                        onCheckedChange={() => toggleEntrante(m.id)}
                      />
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{m.display_name}</span>
                      {m.en_turno && (
                        <Badge variant="secondary" className="text-[9px]">En turno</Badge>
                      )}
                    </label>
                  ))}
                  {availableEntrantes.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No hay monitoristas disponibles</p>
                  )}
                </div>
              </div>

              {selectedEntranteIds.size > 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Distribución de servicios</label>
                  <div className="flex gap-2">
                    <Button
                      variant={distribucionMode === 'auto' ? 'default' : 'outline'}
                      size="sm"
                      className="text-[10px] h-7"
                      onClick={() => setDistribucionMode('auto')}
                    >
                      <Zap className="h-3 w-3 mr-1" /> Automática
                    </Button>
                    <Button
                      variant={distribucionMode === 'manual' ? 'default' : 'outline'}
                      size="sm"
                      className="text-[10px] h-7"
                      onClick={() => setDistribucionMode('manual')}
                    >
                      Manual
                    </Button>
                  </div>

                  {distribucionMode === 'manual' && (
                    <div className="space-y-1">
                      {enrichedServicios.map(svc => (
                        <div key={svc.servicio_id} className="flex items-center gap-2 py-1">
                          <span className="text-[10px] truncate flex-1">{svc.cliente}</span>
                          <Select
                            value={manualDistribucion[svc.servicio_id] || ''}
                            onValueChange={val => setManualDistribucion(prev => ({
                              ...prev,
                              [svc.servicio_id]: val,
                            }))}
                          >
                            <SelectTrigger className="h-6 text-[10px] w-36">
                              <SelectValue placeholder="Asignar a..." />
                            </SelectTrigger>
                            <SelectContent>
                              {entranteIds.map(id => (
                                <SelectItem key={id} value={id}>
                                  {getEntranteName(id)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  Notas generales de entrega
                  {hasIncidents && <AlertTriangle className="h-3 w-3 text-destructive" />}
                </label>
                <Textarea
                  value={notasGenerales}
                  onChange={e => setNotasGenerales(e.target.value)}
                  placeholder="Describe el estado general del turno, pendientes críticos, etc."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* ─── STEP 2: Confirmation ─── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                <h4 className="text-xs font-semibold">Resumen de Entrega</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Salientes:</span>{' '}
                    {salientes.map(m => m.display_name.split(' ')[0]).join(', ')}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entrantes:</span>{' '}
                    {entranteIds.map(id => getEntranteName(id)).join(', ')}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Turno:</span>{' '}
                    {getTurnoLabel(getCurrentTurno())} → {getTurnoLabel(turnoEntrante)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Servicios:</span>{' '}
                    {enrichedServicios.length}
                  </div>
                </div>
              </div>

              {totalIncidentes > 0 && (
                <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {totalIncidentes} incidentes abiertos serán heredados por los entrantes
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Distribución final</label>
                {enrichedServicios.map(svc => {
                  const assignedTo = distribucion[svc.servicio_id];
                  return (
                    <div key={svc.servicio_id} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {svc.tiene_incidente && <AlertCircle className="h-3 w-3 text-destructive shrink-0" />}
                        <span className="text-[11px] truncate">{svc.cliente}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary" className="text-[10px]">
                          {assignedTo ? getEntranteName(assignedTo) : '—'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {notasGenerales && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Notas generales</label>
                  <p className="text-xs bg-muted/30 p-2 rounded-md">{notasGenerales}</p>
                </div>
              )}

            </div>
          )}
        </ScrollArea>

        {/* Firmas Digitales — fuera del ScrollArea para evitar conflicto touch */}
        {step === 2 && (
          <div className="relative z-10 space-y-3 px-1 pt-2 border-t border-border" style={{ touchAction: 'none' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SignaturePad
                value={firmaEntrega}
                onChange={setFirmaEntrega}
                label="✍️ Firma del Monitorista Saliente"
              />
              <SignaturePad
                value={firmaEntrante}
                onChange={setFirmaEntrante}
                label="✍️ Firma del Monitorista Entrante"
              />
            </div>

            <div className="rounded-md border border-muted bg-muted/20 p-3">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Al firmar, ambas partes confirman que los servicios, incidencias y pendientes operativos han sido 
                debidamente comunicados y aceptados, en cumplimiento con la normativa operativa vigente.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row justify-between gap-2 pt-2 border-t">
          <div>
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="h-3 w-3 mr-1" /> Atrás
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
            {step < 2 ? (
              <Button
                size="sm"
                disabled={step === 0 ? !canProceedStep0 : !canProceedStep1}
                onClick={() => setStep(s => s + 1)}
              >
                Siguiente <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                {(!firmaEntrega || !firmaEntrante) && (
                  <span className="text-xs text-destructive animate-pulse flex items-center gap-1">
                    ✍️ {!firmaEntrega && !firmaEntrante ? 'Faltan ambas firmas ↓' : !firmaEntrega ? 'Falta firma saliente ↓' : 'Falta firma entrante ↓'}
                  </span>
                )}
                <Button
                  size="sm"
                  disabled={executeHandoff.isPending || !firmaEntrega || !firmaEntrante}
                  onClick={handleConfirm}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Entregar Turno
                </Button>
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
