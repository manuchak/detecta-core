import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  UserCheck
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useProfileDocuments, useDocumentStats, DOCUMENTO_LABELS } from '../../hooks/useProfileDocuments';
import { useCustodianDocsForProfile, useCustodianDocStats, CustodianDocument } from '../../hooks/useCustodianDocsForProfile';
import { useVerifyDocument } from '../../hooks/useVerifyDocument';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { ChevronDown } from 'lucide-react';

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
  const { user } = useStableAuth();
  
  const [custodianOpen, setCustodianOpen] = useState(true);
  const [recruitmentOpen, setRecruitmentOpen] = useState(true);

  const isLoading = loadingRecruitment || loadingCustodian;

  // Combined stats
  const totalDocs = recruitmentStats.total + custodianStats.total;
  const totalValidos = recruitmentStats.validos + custodianStats.verificados;
  const totalPendientes = recruitmentStats.pendientes + custodianStats.pendientes;
  const totalPorVencer = recruitmentStats.porVencer + custodianStats.porVencer;
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

  return (
    <div className="space-y-6">
      {/* Resumen Unificado */}
      <div className="grid gap-4 md:grid-cols-4">
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
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-500" />
                    Documentos del Custodio (Portal)
                    <Badge variant="secondary" className="ml-2">{custodianStats.total}</Badge>
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${custodianOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {custodianDocs && custodianDocs.length > 0 ? (
                  <div className="space-y-3">
                    {custodianDocs.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="flex items-start justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
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
                            {doc.notas && (
                              <p className="text-xs text-muted-foreground italic">"{doc.notas}"</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {getVencimientoBadge(doc.fecha_vigencia)}
                          {doc.verificado ? (
                            <Badge className="bg-green-500/10 text-green-500">
                              <ShieldCheck className="h-3 w-3 mr-1" />Verificado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-500">
                              <Clock className="h-3 w-3 mr-1" />Pendiente
                            </Badge>
                          )}
                          {doc.foto_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.foto_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {!doc.verificado && (
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
