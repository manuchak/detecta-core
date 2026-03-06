import { useState, useEffect } from 'react';
import { HardDrive, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getOfflineStorageSize, aggressiveCleanup } from '@/lib/offlineStorage';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StorageCleanupCard({ className }: { className?: string }) {
  const { toast } = useToast();
  const [totalSize, setTotalSize] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'cleaning' | 'done'>('idle');
  const [freed, setFreed] = useState(0);

  useEffect(() => {
    getOfflineStorageSize()
      .then((s) => setTotalSize(s.total))
      .catch(() => setTotalSize(0));
  }, []);

  // Don't render if nothing stored or still loading
  if (totalSize === null || totalSize === 0) return null;

  const handleCleanup = async () => {
    setStatus('cleaning');
    try {
      const result = await aggressiveCleanup();
      setFreed(result.bytesFreed);
      setStatus('done');

      const newSize = await getOfflineStorageSize();
      setTotalSize(newSize.total);

      toast({
        title: '🧹 Espacio liberado',
        description: `Se liberaron ${formatBytes(result.bytesFreed)} (${result.photosRemoved} fotos)`,
      });
    } catch {
      setStatus('idle');
      toast({
        title: 'Error',
        description: 'No se pudo limpiar el almacenamiento',
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
          <HardDrive className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            Almacenamiento local
          </p>
          <p className="text-xs text-muted-foreground">
            {status === 'done'
              ? `Liberados ${formatBytes(freed)}`
              : `${formatBytes(totalSize)} en uso`}
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCleanup}
        disabled={status === 'cleaning' || status === 'done'}
        className="flex-shrink-0 h-8 gap-1.5"
      >
        {status === 'cleaning' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : status === 'done' ? (
          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
        {status === 'cleaning'
          ? 'Limpiando...'
          : status === 'done'
            ? 'Listo'
            : 'Liberar espacio'}
      </Button>
    </div>
  );
}
