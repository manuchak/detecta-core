import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewClientBannerProps {
  clienteName: string;
  onCreateNew: () => void;
}

export function NewClientBanner({ clienteName, onCreateNew }: NewClientBannerProps) {
  return (
    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-amber-900 dark:text-amber-100">
            Cliente nuevo detectado
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            "<span className="font-medium">{clienteName}</span>" no existe en el sistema. 
            Se creará automáticamente al configurar la ruta.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={onCreateNew}
          className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Continuar
        </Button>
      </div>
    </div>
  );
}
