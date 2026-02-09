import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Trash2, RefreshCw, ZoomIn } from 'lucide-react';

interface EvidenceThumbnailProps {
  url: string;
  onRemove: () => void;
  onReplace: () => void;
}

export function EvidenceThumbnail({ url, onRemove, onReplace }: EvidenceThumbnailProps) {
  const [showFull, setShowFull] = useState(false);

  return (
    <>
      <div className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-border bg-muted">
        <img
          src={url}
          alt="Evidencia"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-white hover:text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setShowFull(true); }}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-white hover:text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); onReplace(); }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Mobile: always-visible delete button */}
        <button
          type="button"
          className="absolute top-0.5 right-0.5 sm:hidden bg-destructive/80 text-white rounded-full p-1"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Full-size view */}
      <Dialog open={showFull} onOpenChange={setShowFull}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl p-2">
          <img src={url} alt="Evidencia" className="w-full rounded-lg" />
        </DialogContent>
      </Dialog>
    </>
  );
}
