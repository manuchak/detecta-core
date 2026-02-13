import { useCSCapas, useUpdateCSCapa, useCreateCSCapa } from '@/hooks/useCSCapa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, AlertTriangle } from 'lucide-react';

const COLUMNS = [
  { key: 'abierto', label: 'Abierto', color: 'border-t-red-500' },
  { key: 'en_proceso', label: 'En Proceso', color: 'border-t-amber-500' },
  { key: 'implementado', label: 'Implementado', color: 'border-t-blue-500' },
  { key: 'verificado', label: 'Verificado', color: 'border-t-green-500' },
  { key: 'cerrado', label: 'Cerrado', color: 'border-t-slate-400' },
];

const NEXT_STATE: Record<string, string> = {
  abierto: 'en_proceso',
  en_proceso: 'implementado',
  implementado: 'verificado',
  verificado: 'cerrado',
};

export function CSCAPAKanban() {
  const { data: capas, isLoading } = useCSCapas();
  const updateCapa = useUpdateCSCapa();

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-3 mt-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    );
  }

  const moveNext = (id: string, currentEstado: string) => {
    const next = NEXT_STATE[currentEstado];
    if (next) {
      updateCapa.mutate({
        id,
        estado: next,
        ...(next === 'verificado' ? { eficacia_verificada: true } : {}),
      });
    }
  };

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto">
        {COLUMNS.map(col => {
          const items = (capas || []).filter(c => c.estado === col.key);
          return (
            <div key={col.key} className="min-w-[220px]">
              <div className={`border-t-4 ${col.color} rounded-t-lg`}>
                <div className="p-3 bg-secondary/30 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{col.label}</span>
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-2 min-h-[200px]">
                {items.map(capa => {
                  const isOverdue = capa.fecha_implementacion && new Date(capa.fecha_implementacion) < new Date() && capa.estado !== 'cerrado';
                  return (
                    <Card key={capa.id} className="shadow-sm">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-primary">{capa.numero_capa}</span>
                            <Badge variant="outline" className="text-[10px] capitalize">{capa.tipo}</Badge>
                          </div>
                          <p className="text-xs line-clamp-2">{capa.descripcion_no_conformidad}</p>
                          <p className="text-[10px] text-muted-foreground">{capa.cliente?.nombre}</p>
                          {capa.fecha_implementacion && (
                            <div className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {isOverdue && <AlertTriangle className="h-3 w-3" />}
                              Target: {format(new Date(capa.fecha_implementacion), "dd MMM", { locale: es })}
                            </div>
                          )}
                          {NEXT_STATE[capa.estado] && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full h-7 text-xs"
                              onClick={() => moveNext(capa.id, capa.estado)}
                              disabled={updateCapa.isPending}
                            >
                              <ArrowRight className="h-3 w-3 mr-1" /> Avanzar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
