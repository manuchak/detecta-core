import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface QuickCommentButtonProps {
  serviceId: string;
  currentComment?: string;
  className?: string;
}

export function QuickCommentButton({ serviceId, currentComment, className = '' }: QuickCommentButtonProps) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState(currentComment || '');
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('servicios_planificados')
        .update({ comentarios_planeacion: comment.trim() || null })
        .eq('id', serviceId);

      if (error) throw error;

      toast.success('Comentario guardado');
      queryClient.invalidateQueries({ queryKey: ['scheduled-services'] });
      setOpen(false);
    } catch (error) {
      console.error('Error saving comment:', error);
      toast.error('Error al guardar comentario');
    } finally {
      setIsSaving(false);
    }
  };

  const hasComment = !!currentComment && currentComment.trim().length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className={`apple-button-ghost-small opacity-0 group-hover:opacity-100 transition-opacity relative ${className}`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {hasComment && (
            <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-primary border-0" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4" 
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Comentario interno (Planeación)
          </label>
          <Textarea
            placeholder="Datos pendientes, origen pendiente, equipos especiales, etc."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="resize-none h-24"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1" />
              )}
              Guardar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
