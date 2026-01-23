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
  Loader2
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useProfileDocuments, useDocumentStats, DOCUMENTO_LABELS } from '../../hooks/useProfileDocuments';

interface DocumentacionTabProps {
  candidatoId: string | null;
}

export function DocumentacionTab({ candidatoId }: DocumentacionTabProps) {
  const { data: documents, isLoading } = useProfileDocuments(candidatoId);
  const { stats } = useDocumentStats(candidatoId);

  if (!candidatoId) {
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

  const completionRate = stats.total > 0 ? (stats.validos / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Documentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{stats.validos}</div>
            <p className="text-sm text-muted-foreground">Validados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-500">{stats.pendientes}</div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-500">{stats.porVencer}</div>
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

      {/* Lista de documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
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
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No hay documentos registrados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
