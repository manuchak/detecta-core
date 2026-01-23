import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  Award, 
  Trophy,
  BookOpen,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLMSStats } from '../../hooks/useProfileLMS';

interface CapacitacionTabProps {
  userId: string | null;
}

export function CapacitacionTab({ userId }: CapacitacionTabProps) {
  const { stats, isLoading, inscripciones, certificados, badges } = useLMSStats(userId);

  if (!userId) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay un usuario asociado para ver capacitación</p>
          <p className="text-sm mt-2">Este perfil no tiene enlace con el sistema LMS</p>
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
      case 'completado':
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'en_progreso':
        return <Badge className="bg-blue-500/10 text-blue-500"><Clock className="h-3 w-3 mr-1" />En Progreso</Badge>;
      case 'pendiente':
        return <Badge className="bg-amber-500/10 text-amber-500"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen de estadísticas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats.cursosInscritos}</div>
            <p className="text-xs text-muted-foreground">Cursos Inscritos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{stats.cursosCompletados}</div>
            <p className="text-xs text-muted-foreground">Completados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <GraduationCap className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{stats.progresoPromedio}%</div>
            <p className="text-xs text-muted-foreground">Progreso Promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold">{stats.certificados}</div>
            <p className="text-xs text-muted-foreground">Certificados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{stats.badges}</div>
            <p className="text-xs text-muted-foreground">Badges</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cursos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Cursos Inscritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inscripciones && inscripciones.length > 0 ? (
              <div className="space-y-4">
                {inscripciones.map((inscripcion) => (
                  <div 
                    key={inscripcion.id} 
                    className="p-3 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">
                        {inscripcion.curso?.titulo || 'Curso'}
                      </p>
                      {getEstadoBadge(inscripcion.estado)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progreso</span>
                        <span>{inscripcion.progreso_porcentaje}%</span>
                      </div>
                      <Progress value={inscripcion.progreso_porcentaje} className="h-1.5" />
                    </div>
                    {inscripcion.calificacion_final !== null && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Calificación: <span className="font-medium">{inscripcion.calificacion_final}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin cursos inscritos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificados y Badges */}
        <div className="space-y-6">
          {/* Certificados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificados Obtenidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {certificados && certificados.length > 0 ? (
                <div className="space-y-3">
                  {certificados.map((cert) => (
                    <div 
                      key={cert.id}
                      className="flex items-center gap-3 p-2 rounded-lg border border-border/50"
                    >
                      <Award className="h-8 w-8 text-amber-500" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{cert.curso_titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(cert.fecha_emision), "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {cert.codigo_verificacion}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Award className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sin certificados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Badges Ganados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badges && badges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/50 border border-border/50"
                      title={badge.descripcion}
                    >
                      <span className="text-lg">{badge.icono}</span>
                      <span className="text-sm font-medium">{badge.nombre}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Trophy className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sin badges</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
