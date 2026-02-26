import { useState } from 'react';
import { FileText, Edit, Eye, EyeOff, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlantillasLegal, type PlantillaContrato } from '@/hooks/useLegalTemplates';
import TemplateEditor from './TemplateEditor';

const TemplatesList = () => {
  const { data: plantillas, isLoading } = usePlantillasLegal();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PlantillaContrato | null>(null);

  const filtered = (plantillas || []).filter((p) => {
    if (!showInactive && !p.activa) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.nombre.toLowerCase().includes(q) || p.tipo_contrato.toLowerCase().includes(q);
    }
    return true;
  });

  if (editingTemplate) {
    return (
      <TemplateEditor
        plantilla={editingTemplate}
        onClose={() => setEditingTemplate(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar plantilla..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
          className="gap-1.5"
        >
          {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showInactive ? 'Ocultar inactivas' : 'Mostrar inactivas'}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No se encontraron plantillas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className={`cursor-pointer transition-all hover:shadow-md ${!p.activa ? 'opacity-60' : ''}`}
              onClick={() => setEditingTemplate(p)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{p.nombre}</CardTitle>
                  <Badge variant={p.activa ? 'default' : 'secondary'} className="shrink-0 text-xs">
                    {p.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <Badge variant="outline" className="text-xs">{p.tipo_contrato}</Badge>
                {p.descripcion && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.descripcion}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>v{p.version || 1}</span>
                  <span>{p.variables_requeridas?.length || 0} variables</span>
                </div>
                <Button size="sm" variant="ghost" className="w-full gap-1.5 mt-1">
                  <Edit className="h-3.5 w-3.5" /> Editar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplatesList;
