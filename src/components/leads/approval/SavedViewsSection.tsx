import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SavedView } from '@/hooks/useFilterPersistence';

interface SavedViewsSectionProps {
  savedViews: SavedView[];
  onSaveView: (name: string) => void;
  onLoadView: (view: SavedView) => void;
  onDeleteView: (viewId: string) => void;
}

export const SavedViewsSection: React.FC<SavedViewsSectionProps> = ({
  savedViews,
  onSaveView,
  onLoadView,
  onDeleteView,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const handleSave = () => {
    if (newViewName.trim()) {
      onSaveView(newViewName.trim());
      setNewViewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Vistas guardadas
        </h4>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Guardar vista
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="flex items-center gap-2">
          <Input
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
            placeholder="Nombre de la vista..."
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewViewName('');
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleSave}
            disabled={!newViewName.trim()}
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      )}

      {savedViews.length === 0 && !isAdding ? (
        <p className="text-xs text-muted-foreground py-2">
          Guarda combinaciones de filtros para acceso rápido
        </p>
      ) : (
        <div className="space-y-1">
          {savedViews.map((view) => (
            <div
              key={view.id}
              className="group flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => onLoadView(view)}
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm">{view.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteView(view.id);
                }}
              >
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
