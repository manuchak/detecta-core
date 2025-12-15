import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTicketConfig, ResponseTemplate } from '@/hooks/useTicketConfig';
import { Loader2, Plus, Search, FileText, Trash2, Edit2, ChevronRight, LayoutTemplate, TrendingUp } from 'lucide-react';
import { TemplateEditor } from '@/components/admin/tickets/TemplateEditor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';

const TicketTemplatesPage: React.FC = () => {
  const { templates, categorias, loading, createTemplate, updateTemplate, deleteTemplate } = useTicketConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<ResponseTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const filteredTemplates = templates.filter(t => 
    t.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.contenido.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by most used
  const sortedTemplates = [...filteredTemplates].sort((a, b) => (b.uso_count || 0) - (a.uso_count || 0));

  const handleSaveTemplate = async (template: Partial<ResponseTemplate>) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, template);
    } else {
      await createTemplate(template as any);
    }
    setEditingTemplate(null);
    setIsCreating(false);
  };

  const handleDeleteTemplate = async () => {
    if (templateToDelete) {
      await deleteTemplate(templateToDelete);
      setTemplateToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-fade-in">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Admin</span>
          <ChevronRight className="h-4 w-4" />
          <span>Tickets</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Templates</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <LayoutTemplate className="h-6 w-6 text-primary" />
              </div>
              Templates de Respuesta
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona plantillas de respuesta rápida para tickets
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2 shadow-lg">
            <Plus className="h-4 w-4" />
            Nuevo Template
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{templates.length}</p>
              <p className="text-xs text-muted-foreground">Total templates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{templates.reduce((sum, t) => sum + (t.uso_count || 0), 0)}</p>
              <p className="text-xs text-muted-foreground">Usos totales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{categorias.length}</p>
              <p className="text-xs text-muted-foreground">Categorías</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">
                {templates.length > 0 
                  ? Math.round(templates.reduce((sum, t) => sum + (t.uso_count || 0), 0) / templates.length)
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground">Promedio uso</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedTemplates.map((template) => {
                const categoria = categorias.find(c => c.id === template.categoria_id);
                const isPopular = (template.uso_count || 0) >= 10;
                
                return (
                  <Card 
                    key={template.id} 
                    className={cn(
                      "relative group transition-all duration-200 hover:shadow-md",
                      isPopular && "ring-2 ring-primary/20"
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-primary text-primary-foreground gap-1 shadow">
                          <TrendingUp className="h-3 w-3" />
                          Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <CardTitle className="text-base line-clamp-1">{template.nombre}</CardTitle>
                            {categoria && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {categoria.nombre}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setTemplateToDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="p-3 bg-muted/50 rounded-lg mb-3">
                        <p className="text-sm text-muted-foreground line-clamp-3 font-mono text-xs">
                          {template.contenido}
                        </p>
                      </div>
                      
                      {template.variables_disponibles && template.variables_disponibles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {template.variables_disponibles.map((v) => (
                            <Badge 
                              key={v} 
                              variant="outline" 
                              className="text-[10px] font-mono bg-primary/5 border-primary/20"
                            >
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Usado {template.uso_count || 0} veces</span>
                        {template.uso_count && template.uso_count > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min((template.uso_count / 50) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredTemplates.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No se encontraron templates</p>
                  <Button variant="outline" className="mt-4" onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer template
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editor Dialog */}
        <Dialog open={isCreating || !!editingTemplate} onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditingTemplate(null);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Nuevo Template'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate 
                  ? 'Modifica el contenido del template de respuesta'
                  : 'Crea un nuevo template de respuesta rápida'}
              </DialogDescription>
            </DialogHeader>
            <TemplateEditor
              template={editingTemplate || undefined}
              categorias={categorias}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setIsCreating(false);
                setEditingTemplate(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar template?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El template será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default TicketTemplatesPage;
