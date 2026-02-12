import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, FileCheck, AlertTriangle, CheckCircle2, XCircle, 
  Clock, Ban, Loader2, ClipboardCheck 
} from 'lucide-react';
import { useCustodianDocsForProfile, type CustodianDocument } from '../../hooks/useCustodianDocsForProfile';
import { useSancionesAplicadas } from '@/hooks/useSanciones';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface CumplimientoTabProps {
  custodioId: string;
  telefono: string | null;
  nombre: string;
}

const DOCS_OBLIGATORIOS = ['licencia_conducir', 'tarjeta_circulacion', 'poliza_seguro'];

function getDocStatus(doc: CustodianDocument): 'vigente' | 'por_vencer' | 'vencido' | 'sin_vigencia' {
  if (!doc.fecha_vigencia) return 'sin_vigencia';
  const dias = differenceInDays(new Date(doc.fecha_vigencia), new Date());
  if (dias < 0) return 'vencido';
  if (dias <= 30) return 'por_vencer';
  return 'vigente';
}

function useChecklistStats(telefono: string | null) {
  return useQuery({
    queryKey: ['checklist-cumplimiento', telefono],
    queryFn: async () => {
      if (!telefono) return { total: 0, completados: 0, recientes: [] };

      const { data: checklists, error } = await supabase
        .from('checklist_servicio')
        .select('id, estado, fecha_checklist, created_at')
        .eq('custodio_telefono', telefono)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) { console.error(error); return { total: 0, completados: 0, recientes: [] }; }

      const total = checklists?.length || 0;
      const completados = checklists?.filter(c => c.estado === 'completado' || c.estado === 'sincronizado').length || 0;
      const recientes = (checklists || []).slice(0, 10);

      return { total, completados, recientes };
    },
    enabled: !!telefono,
  });
}

export function CumplimientoTab({ custodioId, telefono, nombre }: CumplimientoTabProps) {
  const { data: documents = [], isLoading: docsLoading } = useCustodianDocsForProfile(telefono);
  const { data: sanciones = [], isLoading: sancionesLoading } = useSancionesAplicadas({ operativoId: custodioId });
  const { data: checklistStats, isLoading: checklistLoading } = useChecklistStats(telefono);

  const isLoading = docsLoading || sancionesLoading || checklistLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Cálculos de métricas ---
  const docsVigentes = documents.filter(d => getDocStatus(d) === 'vigente').length;
  const docsPorVencer = documents.filter(d => getDocStatus(d) === 'por_vencer').length;
  const docsVencidos = documents.filter(d => getDocStatus(d) === 'vencido').length;
  const docsFaltantes = DOCS_OBLIGATORIOS.filter(
    tipo => !documents.some(d => d.tipo_documento === tipo)
  );

  const sancionesActivas = sanciones.filter(s => s.estado === 'activa');
  const checkTotal = checklistStats?.total || 0;
  const checkCompletados = checklistStats?.completados || 0;
  const tasaChecklist = checkTotal > 0 ? (checkCompletados / checkTotal) * 100 : 100;

  // Score: 3 factores ponderados igualmente
  const scoreDocs = documents.length > 0 
    ? ((docsVigentes / documents.length) * 100) 
    : (docsFaltantes.length > 0 ? 0 : 100);
  const scoreSanciones = sancionesActivas.length === 0 ? 100 : 0;
  const scoreGeneral = Math.round((scoreDocs + scoreSanciones + tasaChecklist) / 3);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Cumple';
    if (score >= 50) return 'Atención';
    return 'Crítico';
  };

  return (
    <div className="space-y-6">
      {/* 1. Resumen de Cumplimiento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`border ${getScoreColor(scoreGeneral)}`}>
          <CardContent className="pt-4 pb-3 text-center">
            <Shield className="h-6 w-6 mx-auto mb-1 opacity-80" />
            <p className="text-2xl font-bold">{scoreGeneral}%</p>
            <p className="text-xs font-medium">{getScoreLabel(scoreGeneral)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <FileCheck className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{docsVigentes}<span className="text-sm text-muted-foreground">/{documents.length}</span></p>
            <p className="text-xs text-muted-foreground">Docs vigentes</p>
            {(docsPorVencer > 0 || docsVencidos > 0) && (
              <div className="flex gap-1 justify-center mt-1">
                {docsPorVencer > 0 && <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1">{docsPorVencer} por vencer</Badge>}
                {docsVencidos > 0 && <Badge variant="destructive" className="text-[10px] px-1">{docsVencidos} vencidos</Badge>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Ban className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{sancionesActivas.length}</p>
            <p className="text-xs text-muted-foreground">Sanciones activas</p>
            {sancionesActivas.length > 0 && (
              <Badge variant="destructive" className="text-[10px] mt-1">⚠ Suspendido</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <ClipboardCheck className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{Math.round(tasaChecklist)}%</p>
            <p className="text-xs text-muted-foreground">Checklists ({checkCompletados}/{checkTotal})</p>
            {tasaChecklist < 50 && checkTotal > 0 && (
              <Badge variant="destructive" className="text-[10px] mt-1">Tasa baja</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2. Documentos y Vigencias */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Documentos y Vigencias
            {docsFaltantes.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">{docsFaltantes.length} obligatorios faltan</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {docsFaltantes.length > 0 && (
            <div className="mb-3 p-2 rounded-md bg-destructive/10 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Faltan documentos obligatorios: {docsFaltantes.map(d => d.replace(/_/g, ' ')).join(', ')}</span>
            </div>
          )}
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin documentos registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Verificado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map(doc => {
                  const status = getDocStatus(doc);
                  const esObligatorio = DOCS_OBLIGATORIOS.includes(doc.tipo_documento);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="text-sm">
                        {doc.tipo_documento.replace(/_/g, ' ')}
                        {esObligatorio && <span className="text-[10px] text-primary ml-1">●</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {doc.fecha_vigencia 
                          ? format(new Date(doc.fecha_vigencia), 'dd MMM yyyy', { locale: es })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {status === 'vigente' && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Vigente</Badge>}
                        {status === 'por_vencer' && <Badge className="bg-amber-100 text-amber-700 text-[10px]">Por vencer</Badge>}
                        {status === 'vencido' && <Badge variant="destructive" className="text-[10px]">Vencido</Badge>}
                        {status === 'sin_vigencia' && <Badge variant="outline" className="text-[10px]">Sin fecha</Badge>}
                      </TableCell>
                      <TableCell>
                        {doc.verificado 
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 3. Sanciones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Sanciones
            {sancionesActivas.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">{sancionesActivas.length} activa(s)</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {sanciones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin sanciones registradas</p>
          ) : (
            <div className="space-y-2">
              {sanciones.map(s => {
                const estadoBadge = {
                  activa: <Badge variant="destructive" className="text-[10px]">Activa</Badge>,
                  cumplida: <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Cumplida</Badge>,
                  apelada: <Badge className="bg-amber-100 text-amber-700 text-[10px]">Apelada</Badge>,
                  revocada: <Badge variant="outline" className="text-[10px]">Revocada</Badge>,
                };
                return (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-md border text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{s.sancion?.nombre || 'Sanción'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(s.fecha_inicio), 'dd/MM/yy')} → {format(new Date(s.fecha_fin), 'dd/MM/yy')} · {s.dias_suspension}d
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.sancion?.categoria && (
                        <Badge variant="outline" className="text-[10px] capitalize">{s.sancion.categoria.replace('_', ' ')}</Badge>
                      )}
                      {estadoBadge[s.estado] || <Badge variant="outline" className="text-[10px]">{s.estado}</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Cumplimiento de Checklists */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Checklists Pre-Servicio
            {tasaChecklist < 50 && checkTotal > 0 && (
              <Badge variant="destructive" className="text-[10px]">Tasa baja</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {checkTotal === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin checklists registrados</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${tasaChecklist >= 80 ? 'bg-emerald-500' : tasaChecklist >= 50 ? 'bg-amber-500' : 'bg-destructive'}`}
                    style={{ width: `${Math.min(tasaChecklist, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{Math.round(tasaChecklist)}%</span>
              </div>
              <div className="space-y-1">
                {checklistStats?.recientes.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm p-1.5 rounded hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      {(c.estado === 'completado' || c.estado === 'sincronizado')
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        : <Clock className="h-3.5 w-3.5 text-amber-500" />}
                      <span className="text-muted-foreground">
                        {c.fecha_checklist 
                          ? format(new Date(c.fecha_checklist), 'dd MMM yyyy', { locale: es })
                          : c.created_at 
                            ? format(new Date(c.created_at), 'dd MMM yyyy', { locale: es })
                            : '—'}
                      </span>
                    </div>
                    <Badge 
                      variant={(c.estado === 'completado' || c.estado === 'sincronizado') ? 'default' : 'outline'} 
                      className="text-[10px] capitalize"
                    >
                      {c.estado || 'pendiente'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
