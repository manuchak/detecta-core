import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTicketConfig, ResponseTemplate } from '@/hooks/useTicketConfig';
import { Loader2, Plus, Search, FileText, Trash2, Edit2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

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
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Templates de Respuesta</h1>
          <p className="text-muted-foreground">
            Gestiona plantillas de respuesta rápida para tickets
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => {
              const categoria = categorias.find(c => c.id === template.categoria_id);
              
              return (
                <Card key={template.id} className="relative group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">{template.nombre}</CardTitle>
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
                          className="h-8 w-8 text-destructive"
                          onClick={() => setTemplateToDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {categoria && (
                      <Badge variant="secondary" className="w-fit">
                        {categoria.nombre}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.contenido}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {template.variables_disponibles?.map((v) => (
                        <Badge key={v} variant="outline" className="text-xs">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Usado {template.uso_count || 0} veces
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredTemplates.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No se encontraron templates
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
  );
};

export default TicketTemplatesPage;
