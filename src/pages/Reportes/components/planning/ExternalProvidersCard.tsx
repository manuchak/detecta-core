import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Building2, TrendingUp, Calendar, Users } from 'lucide-react';
import type { ProveedorExternoMetrics } from '../../types/planningResources';

interface ExternalProvidersCardProps {
  proveedores: ProveedorExternoMetrics[];
}

export default function ExternalProvidersCard({ proveedores }: ExternalProvidersCardProps) {
  const todosInactivos = proveedores.every(p => !p.activo);
  const totalServicios30d = proveedores.reduce((acc, p) => acc + p.servicios30d, 0);
  
  return (
    <Card className="shadow-apple-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-corporate-blue/10">
              <Building2 className="h-5 w-5 text-corporate-blue" />
            </div>
            <CardTitle className="text-lg">Proveedores Externos</CardTitle>
          </div>
          <Badge variant="secondary" className="text-sm font-medium">
            {totalServicios30d} servicios
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Grid comparativo de proveedores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proveedores.map(prov => (
            <div 
              key={prov.nombre} 
              className={`p-4 rounded-lg border transition-colors ${
                prov.activo 
                  ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
                  : 'bg-muted/30 border-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-base">{prov.nombre}</span>
                <Badge 
                  variant={prov.activo ? 'default' : 'secondary'}
                  className={prov.activo ? 'bg-green-600 text-white' : ''}
                >
                  {prov.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
54:                   <div className="flex items-center gap-2 text-sm">
55:                     <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
56:                     <span className="text-muted-foreground">Servicios</span>
57:                   </div>
58:                   <div className="text-xl font-bold">{prov.serviciosTotales}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Últimos 30d</span>
                  </div>
                  <div className={`text-xl font-bold ${
                    prov.servicios30d === 0 ? 'text-destructive' : ''
                  }`}>
                    {prov.servicios30d}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Días activos</span>
                  </div>
                  <div className="text-xl font-bold">{prov.diasActivos}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Armados</span>
                  </div>
                  <div className="text-xl font-bold">{prov.armadosActivos}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Alerta si todos están inactivos */}
        {todosInactivos && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Ningún proveedor externo ha sido utilizado en los últimos 30 días. 
              Verificar si existe necesidad de contratación externa o si hay problemas operativos.
            </span>
          </div>
        )}
        
        {/* Alerta si solo uno está activo */}
        {!todosInactivos && proveedores.some(p => !p.activo) && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {proveedores.filter(p => !p.activo).map(p => p.nombre).join(', ')} sin servicios recientes. 
              Considerar evaluación de SLA y disponibilidad.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
