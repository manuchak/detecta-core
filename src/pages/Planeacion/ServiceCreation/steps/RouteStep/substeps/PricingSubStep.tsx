import { useState } from 'react';
import { AlertCircle, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PricingResultCard } from '../components/PricingResultCard';
import { InlineRouteCreationForm } from '../components/InlineRouteCreationForm';
import { PricingResult, MatchType } from '../hooks/useRouteSubSteps';

interface PricingSubStepProps {
  cliente: string;
  origen: string;
  destino: string;
  pricingResult: PricingResult | null;
  pricingError: string | null;
  isSearching: boolean;
  matchType: MatchType;
  onConfirm: () => void;
  onRetry: () => void;
  onCreateRoute: () => void;
  onRouteCreated?: (result: PricingResult) => void;
}

export function PricingSubStep({
  cliente,
  origen,
  destino,
  pricingResult,
  pricingError,
  isSearching,
  matchType,
  onConfirm,
  onRetry,
  onCreateRoute,
  onRouteCreated
}: PricingSubStepProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Loading state
  if (isSearching) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Buscando pricing...</p>
              <p className="text-sm text-muted-foreground">
                {origen} → {destino}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state - pricing found
  if (pricingResult) {
    return (
      <PricingResultCard
        result={pricingResult}
        matchType={matchType}
        onConfirm={onConfirm}
      />
    );
  }

  // Handle route created from inline form
  const handleRouteCreated = (result: PricingResult) => {
    setShowCreateForm(false);
    if (onRouteCreated) {
      onRouteCreated(result);
    }
  };

  // Error/Not found state
  return (
    <Card className="border-2 border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-5 w-5" />
          {showCreateForm ? 'Crear Nueva Ruta' : 'Ruta no encontrada'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showCreateForm ? (
          <InlineRouteCreationForm
            cliente={cliente}
            origen={origen}
            destino={destino}
            onSuccess={handleRouteCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        ) : (
          <>
            <div className="bg-background/80 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                No se encontró pricing para:
              </p>
              <p className="font-medium">
                {cliente}: {origen} → {destino}
              </p>
            </div>

            {pricingError && (
              <p className="text-sm text-muted-foreground">
                {pricingError}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={onRetry}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Buscar de nuevo
              </Button>
              
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear nueva ruta
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
