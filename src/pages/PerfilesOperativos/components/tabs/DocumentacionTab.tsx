import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Upload,
  UserCheck,
  Ban
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useProfileDocuments, useDocumentStats, DOCUMENTO_LABELS } from '../../hooks/useProfileDocuments';
import { useCustodianDocsForProfile, useCustodianDocStats, CustodianDocument } from '../../hooks/useCustodianDocsForProfile';
import { useVerifyDocument, useRejectDocument } from '../../hooks/useVerifyDocument';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { ChevronDown } from 'lucide-react';
import { AdminDocumentUploadDialog } from './AdminDocumentUploadDialog';

const QUICK_REJECT_REASONS = [
  'Foto ilegible',
  'Documento incorrecto',
  'Fecha no visible',
  'Documento vencido',
  'Información incorrecta',
];

interface DocumentacionTabProps {
  candidatoId: string | null;
  telefono: string | null;
}

export function DocumentacionTab({ candidatoId, telefono }: DocumentacionTabProps) {
  const { data: recruitmentDocs, isLoading: loadingRecruitment } = useProfileDocuments(candidatoId);
  const { stats: recruitmentStats } = useDocumentStats(candidatoId);
  const { data: custodianDocs, isLoading: loadingCustodian } = useCustodianDocsForProfile(telefono);
  const { stats: custodianStats } = useCustodianDocStats(telefono);
  const verifyMutation = useVerifyDocument(telefono);
  const rejectMutation = useRejectDocument(telefono);
  const { user } = useStableAuth();
  
  const [custodianOpen, setCustodianOpen] = useState(true);
  const [recruitmentOpen, setRecruitmentOpen] = useState(true);
  const [rejectingDoc, setRejectingDoc] = useState<CustodianDocument | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const isLoading = loadingRecruitment || loadingCustodian;

  // Combined stats
  const totalDocs = recruitmentStats.total + custodianStats.total;
  const totalValidos = recruitmentStats.validos + custodianStats.verificados;
  const totalPendientes = recruitmentStats.pendientes + custodianStats.pendientes;
  const totalPorVencer = recruitmentStats.porVencer + custodianStats.porVencer;
  const totalRechazados = custodianStats.rechazados;
  const completionRate = totalDocs > 0 ? (totalValidos / totalDocs) * 100 : 0;

  if (!candidatoId && !telefono) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay un candidato asociado para ver documentos</p>
          <p className="text-sm mt-2">Este perfil no tiene enlace con el sistema de reclutamiento</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'valido':
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="h-3 w-3 mr-1" />Válido</Badge>;
      case 'pendiente':
        return <Badge className="bg-amber-500/10 text-amber-500"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'invalido':
        return <Badge className="bg-red-500/10 text-red-500"><XCircle className="h-3 w-3 mr-1" />Inválido</Badge>;
      case 'requiere_revision':
        return <Badge className="bg-orange-500/10 text-orange-500"><AlertTriangle className="h-3 w-3 mr-1" />Revisar</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const getVencimientoBadge = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) return null;
    
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = differenceInDays(vencimiento, new Date());
    
    if (diasRestantes < 0) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    if (diasRestantes <= 30) {
      return <Badge className="bg-orange-500/10 text-orange-500">Vence en {diasRestantes} días</Badge>;
    }
    if (diasRestantes <= 90) {
      return <Badge className="bg-amber-500/10 text-amber-500">Vence en {diasRestantes} días</Badge>;
    }
    return null;
  };

  const handleVerify = (doc: CustodianDocument, verificado: boolean) => {
    verifyMutation.mutate({
      docId: doc.id,
      verificado,
      verificadoPor: user?.id || ''
    });
  };

  const handleReject = () => {
    if (!rejectingDoc || !rejectReason.trim()) return;
    rejectMutation.mutate({
      docId: rejectingDoc.id,
      motivoRechazo: rejectReason.trim(),
      rechazadoPor: user?.id || ''
    }, {
      onSuccess: () => {
        setRejectingDoc(null);
        setRejectReason('');
      }
    });
  };

  const getDocStatusBadge = (doc: CustodianDocument) => {
    if (doc.verificado) {
      return (
        <Badge className="bg-green-500/10 text-green-500">
          <ShieldCheck className="h-3 w-3 mr-1" />Verificado
        </Badge>
      );
    }
    if (doc.rechazado) {
      return (
        <Badge variant="destructive">
          <Ban className="h-3 w-3 mr-1" />Rechazado
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/10 text-amber-500">
        <Clock className="h-3 w-3 mr-1" />Pendiente
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Resumen Unificado */}
      <div className={`grid gap-4 ${totalRechazados > 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalDocs}</div>
            <p className="text-sm text-muted-foreground">Total Documentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{totalValidos}</div>
            <p className="text-sm text-muted-foreground">Validados / Verificados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-500">{totalPendientes}</div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        {totalRechazados > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{totalRechazados}</div>
              <p className="text-sm text-muted-foreground">Rechazados</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-500">{totalPorVencer}</div>
            <p className="text-sm text-muted-foreground">Por Vencer</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de progreso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Progreso de Documentación
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {Math.round(completionRate)}% completo
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={completionRate} className="h-2" />
        </CardContent>
      </Card>

      {/* Documentos del Portal Custodio */}
      {telefono && (
        <Collapsible open={custodianOpen} onOpenChange={setCustodianOpen}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex-1 justify-between p-0 h-auto hover:bg-transparent">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-500" />
                    Documentos del Custodio (Portal)
                    <Badge variant="secondary" className="ml-2">{custodianStats.total}</Badge>
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${custodianOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Subir Documento
              </Button>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {custodianDocs && custodianDocs.length > 0 ? (
                  <div className="space-y-3">
                    {custodianDocs.map((doc) => (
                      <div 
                        key={doc.id} 
                        className={`flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors ${
                          doc.rechazado 
                            ? 'border-destructive/50 bg-destructive/5' 
                            : 'border-border/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {DOCUMENTO_LABELS[doc.tipo_documento] || doc.tipo_documento}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Subido: {format(new Date(doc.created_at), "d MMM yyyy", { locale: es })}
                              {doc.fecha_vigencia && (
                                <> • Vence: {format(new Date(doc.fecha_vigencia), "d MMM yyyy", { locale: es })}</>
                              )}
                            </p>
                            {doc.verificado && doc.verificado_por && (
                              <p className="text-xs text-green-600 flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />
                                Verificado 
                                {doc.fecha_verificacion && (
                                  <> el {format(new Date(doc.fecha_verificacion), "d MMM yyyy", { locale: es })}</>
                                )}
                              </p>
                            )}
                            {doc.rechazado && doc.motivo_rechazo && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <Ban className="h-3 w-3" />
                                Motivo: {doc.motivo_rechazo}
                              </p>
                            )}
                            {doc.notas && (
                              <p className="text-xs text-muted-foreground italic">"{doc.notas}"</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {getVencimientoBadge(doc.fecha_vigencia)}
                          {getDocStatusBadge(doc)}
                          {doc.foto_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.foto_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {!doc.verificado && !doc.rechazado && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-green-600 border-green-600/30 hover:bg-green-500/10"
                                onClick={() => handleVerify(doc, true)}
                                disabled={verifyMutation.isPending}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verificar
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => { setRejectingDoc(doc); setRejectReason(''); }}
                                disabled={rejectMutation.isPending}
                              >
                                <Ban className="h-3 w-3 mr-1" />
                                Rechazar
                              </Button>
                            </>
                          )}
                          {doc.rechazado && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 border-green-600/30 hover:bg-green-500/10"
                              onClick={() => handleVerify(doc, true)}
                              disabled={verifyMutation.isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verificar
                            </Button>
                          )}
                          {doc.verificado && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-muted-foreground"
                              onClick={() => handleVerify(doc, false)}
                              disabled={verifyMutation.isPending}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Desmarcar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">El custodio no ha subido documentos desde el portal</p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Upload Dialog */}
      {telefono && (
        <AdminDocumentUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          telefono={telefono}
        />
      )}

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectingDoc} onOpenChange={(open) => { if (!open) setRejectingDoc(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar documento</AlertDialogTitle>
            <AlertDialogDescription>
              Indica el motivo del rechazo para que el custodio sepa qué corregir.
              {rejectingDoc && (
                <span className="block mt-1 font-medium text-foreground">
                  {DOCUMENTO_LABELS[rejectingDoc.tipo_documento] || rejectingDoc.tipo_documento}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex flex-wrap gap-2">
              {QUICK_REJECT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    rejectReason === reason
                      ? 'bg-destructive/10 border-destructive text-destructive'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                  onClick={() => setRejectReason(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Motivo del rechazo..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rechazando...' : 'Confirmar Rechazo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Documentos de Reclutamiento */}
      {candidatoId && (
        <Collapsible open={recruitmentOpen} onOpenChange={setRecruitmentOpen}>
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    Documentos de Reclutamiento
                    <Badge variant="secondary" className="ml-2">{recruitmentStats.total}</Badge>
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${recruitmentOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {recruitmentDocs && recruitmentDocs.length > 0 ? (
                  <div className="space-y-3">
                    {recruitmentDocs.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="font-medium text-sm">
                              {DOCUMENTO_LABELS[doc.tipo_documento] || doc.tipo_documento}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Subido: {format(new Date(doc.created_at), "d MMM yyyy", { locale: es })}
                              {doc.fecha_vencimiento && (
                                <> • Vence: {format(new Date(doc.fecha_vencimiento), "d MMM yyyy", { locale: es })}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getVencimientoBadge(doc.fecha_vencimiento)}
                          {getEstadoBadge(doc.estado_validacion)}
                          {doc.archivo_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay documentos de reclutamiento</p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
