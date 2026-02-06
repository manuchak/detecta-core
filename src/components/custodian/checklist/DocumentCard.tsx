/**
 * Card que muestra un documento del custodio con su estado de vigencia
 * Simplificado: solo muestra estado y botón, el upload lo maneja el padre
 */
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DocumentExpiryBadge } from './DocumentExpiryBadge';
import type { DocumentoCustodio, TipoDocumentoCustodio } from '@/types/checklist';
import { DOCUMENTO_LABELS } from '@/types/checklist';

interface DocumentCardProps {
  documento?: DocumentoCustodio;
  tipoDocumento: TipoDocumentoCustodio;
  onRequestUpdate: () => void;
  isUpdating?: boolean;
  className?: string;
}

export function DocumentCard({
  documento,
  tipoDocumento,
  onRequestUpdate,
  isUpdating,
  className,
}: DocumentCardProps) {
  const isExpired = documento
    ? new Date(documento.fecha_vigencia) < new Date()
    : false;

  const needsUpdate = isExpired || !documento;

  return (
    <Card
      className={cn(
        'p-4 transition-all',
        isExpired && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isExpired
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                : 'bg-primary/10 text-primary'
            )}
          >
            <FileText className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground">
              {DOCUMENTO_LABELS[tipoDocumento]}
            </h4>

            {documento ? (
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Vigente hasta:{' '}
                    {format(new Date(documento.fecha_vigencia), "d 'de' MMMM yyyy", {
                      locale: es,
                    })}
                  </span>
                </div>
                <DocumentExpiryBadge fechaVigencia={documento.fecha_vigencia} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                No registrado
              </p>
            )}
          </div>
        </div>

        {needsUpdate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestUpdate}
            disabled={isUpdating}
            className="shrink-0"
          >
            <Upload className="w-4 h-4 mr-1" />
            {isUpdating ? 'Subiendo...' : documento ? 'Actualizar' : 'Subir'}
          </Button>
        )}
      </div>
    </Card>
  );
}
