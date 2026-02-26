import { useState } from 'react';
import { GitBranch, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  usePlantillasLegal,
  usePlantillaVersiones,
  useRollbackPlantilla,
  type PlantillaVersion,
} from '@/hooks/useLegalTemplates';
import SafeHtml from '@/components/common/SafeHtml';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TemplateVersionHistory = () => {
  const { data: plantillas, isLoading: loadingPlantillas } = usePlantillasLegal();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const { data: versiones, isLoading: loadingVersiones } = usePlantillaVersiones(selectedId);
  const rollback = useRollbackPlantilla();

  const selectedPlantilla = plantillas?.find((p) => p.id === selectedId);

  const handleRollback = async (version: PlantillaVersion) => {
    if (!selectedId) return;
    if (!confirm(`¿Restaurar a la versión ${version.version}? El contenido actual se guardará como versión.`)) return;
    await rollback.mutateAsync({ plantillaId: selectedId, version });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedId || ''} onValueChange={(v) => { setSelectedId(v); setExpandedVersion(null); }}>
          <SelectTrigger className="w-80">
            <SelectValue placeholder="Seleccionar plantilla..." />
          </SelectTrigger>
          <SelectContent>
            {(plantillas || []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre} (v{p.version || 1})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedId ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Selecciona una plantilla para ver su historial de versiones</p>
          </CardContent>
        </Card>
      ) : loadingVersiones ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !versiones?.length ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>Sin historial de versiones para esta plantilla</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Current version */}
          {selectedPlantilla && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge>Actual</Badge> v{selectedPlantilla.version || 1}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {selectedPlantilla.updated_at &&
                      format(new Date(selectedPlantilla.updated_at), "d MMM yyyy, HH:mm", { locale: es })}
                  </span>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Version timeline */}
          {versiones.map((v) => (
            <Card key={v.id}>
              <CardHeader
                className="pb-2 cursor-pointer"
                onClick={() => setExpandedVersion(expandedVersion === v.id ? null : v.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedVersion === v.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">v{v.version}</span>
                    {v.change_description && (
                      <span className="text-xs text-muted-foreground">— {v.change_description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(v.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-7 text-xs"
                      onClick={(e) => { e.stopPropagation(); handleRollback(v); }}
                      disabled={rollback.isPending}
                    >
                      <RotateCcw className="h-3 w-3" /> Restaurar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedVersion === v.id && (
                <CardContent className="pt-0">
                  <div className="border rounded-lg p-4 bg-muted/30 max-h-80 overflow-y-auto">
                    <SafeHtml content={v.contenido_html} className="prose prose-sm max-w-none" />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateVersionHistory;
