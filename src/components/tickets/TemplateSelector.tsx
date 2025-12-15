import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FileText, Search, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  nombre: string;
  descripcion: string | null;
  plantilla_respuesta: string | null;
  categoria_id: string;
  categoria_nombre?: string;
}

interface TemplateSelectorProps {
  categoriaId?: string | null;
  custodianName?: string;
  ticketNumber?: string;
  onSelect: (text: string) => void;
}

export const TemplateSelector = ({
  categoriaId,
  custodianName,
  ticketNumber,
  onSelect
}: TemplateSelectorProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_subcategorias_custodio')
        .select(`
          id,
          nombre,
          descripcion,
          plantilla_respuesta,
          categoria_id,
          categoria:ticket_categorias_custodio(nombre)
        `)
        .eq('activo', true)
        .not('plantilla_respuesta', 'is', null)
        .order('orden');

      if (error) throw error;

      setTemplates((data || []).map((t: any) => ({
        id: t.id,
        nombre: t.nombre,
        descripcion: t.descripcion,
        plantilla_respuesta: t.plantilla_respuesta,
        categoria_id: t.categoria_id,
        categoria_nombre: t.categoria?.nombre || 'General'
      })));
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !search || 
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      t.plantilla_respuesta?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = !categoriaId || t.categoria_id === categoriaId;
    
    return matchesSearch && (categoriaId ? matchesCategory : true);
  });

  // Group by category
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.categoria_nombre || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  const handleSelect = (template: Template) => {
    if (!template.plantilla_respuesta) return;
    
    // Replace variables
    let text = template.plantilla_respuesta;
    text = text.replace(/\{\{nombre\}\}/g, custodianName || 'Estimado usuario');
    text = text.replace(/\{\{ticket\}\}/g, ticketNumber || '');
    text = text.replace(/\{\{fecha\}\}/g, new Date().toLocaleDateString('es-MX'));
    
    onSelect(text);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Zap className="h-4 w-4" />
          Plantillas
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar plantilla..."
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Cargando plantillas...
            </div>
          ) : Object.keys(groupedTemplates).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <FileText className="h-8 w-8 mb-2" />
              <p>No se encontraron plantillas</p>
            </div>
          ) : (
            <div className="p-2 space-y-4">
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <div className="px-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {categoryTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleSelect(template)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md',
                          'hover:bg-accent transition-colors',
                          'focus:outline-none focus:ring-2 focus:ring-ring'
                        )}
                      >
                        <p className="font-medium text-sm">{template.nombre}</p>
                        {template.descripcion && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {template.descripcion}
                          </p>
                        )}
                        {template.plantilla_respuesta && (
                          <p className="text-xs text-muted-foreground/70 line-clamp-2 mt-1 italic">
                            "{template.plantilla_respuesta.slice(0, 80)}..."
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default TemplateSelector;
