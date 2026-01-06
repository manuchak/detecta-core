import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LMSMetricCard } from "./LMSMetricCard";
import { useLMSGamificacionMetrics } from "@/hooks/lms/useLMSGamificacionMetrics";
import { Zap, Medal, Trophy, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const LMSGamificacionDashboard: React.FC = () => {
  const { data: metrics, isLoading, error } = useLMSGamificacionMetrics();

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">Error al cargar métricas de gamificación</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'text-amber-500';
    if (index === 1) return 'text-slate-400';
    if (index === 2) return 'text-amber-700';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <LMSMetricCard
          title="Puntos Totales"
          value={metrics.puntosTotalesOtorgados.toLocaleString()}
          icon={Zap}
          description={`${metrics.usuariosConPuntos} usuarios con puntos`}
          variant="success"
        />
        <LMSMetricCard
          title="Badges Otorgados"
          value={metrics.badgesTotalesOtorgados}
          icon={Medal}
        />
        <LMSMetricCard
          title="Nivel Promedio"
          value={metrics.nivelPromedio.toFixed(1)}
          icon={Trophy}
          description="De 10 niveles posibles"
        />
        <LMSMetricCard
          title="Racha Promedio"
          value={`${metrics.rachaPromedio.toFixed(1)} días`}
          icon={Flame}
          description="Días consecutivos de estudio"
          variant={metrics.rachaPromedio >= 3 ? 'success' : 'default'}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por nivel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Nivel</CardTitle>
            <CardDescription>Usuarios en cada nivel (1-10)</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.distribucionNiveles.some(n => n.usuarios > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics.distribucionNiveles}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="nivel" 
                    tick={{ fontSize: 12 }} 
                    label={{ value: 'Nivel', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} usuarios (${props.payload.porcentaje}%)`, 
                      'Usuarios'
                    ]}
                  />
                  <Bar 
                    dataKey="usuarios" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay usuarios con niveles aún
              </div>
            )}
          </CardContent>
        </Card>

        {/* Badges más comunes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Badges Más Otorgados</CardTitle>
            <CardDescription>Top 5 badges por frecuencia</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.badgesMasComunes.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={metrics.badgesMasComunes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="otorgados"
                    nameKey="nombre"
                    label={({ nombre, percent }) => `${nombre} ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics.badgesMasComunes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay badges otorgados aún
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Leaderboard - Top 10
          </CardTitle>
          <CardDescription>Usuarios con más puntos en la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.topUsuariosPorPuntos.length > 0 ? (
            <div className="space-y-3">
              {metrics.topUsuariosPorPuntos.map((usuario, index) => (
                <div 
                  key={usuario.usuarioId} 
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className={`text-lg font-bold w-6 ${getRankColor(index)}`}>
                    #{index + 1}
                  </span>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(usuario.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{usuario.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-primary">{usuario.puntos.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">puntos</p>
                    </div>
                    <Badge variant="secondary">Nivel {usuario.nivel}</Badge>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Medal className="w-4 h-4" />
                      <span>{usuario.badges}</span>
                    </div>
                    {usuario.rachaActual > 0 && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Flame className="w-4 h-4" />
                        <span>{usuario.rachaActual}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No hay usuarios con puntos aún
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
