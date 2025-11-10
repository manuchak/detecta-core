import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface LazyErrorBoundaryProps {
  children: React.ReactNode;
}

interface LazyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class LazyErrorBoundary extends React.Component<
  LazyErrorBoundaryProps,
  LazyErrorBoundaryState
> {
  constructor(props: LazyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    console.error('🚨 LazyErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyErrorBoundary error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <LazyErrorFallback onRetry={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}

function LazyErrorFallback({ onRetry }: { onRetry: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            No se pudo cargar la página
          </h2>
          <p className="text-muted-foreground">
            Ocurrió un error al cargar el módulo. Esto puede deberse a problemas de conexión o una actualización reciente.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button 
            onClick={() => window.location.reload()} 
            variant="default"
          >
            Reintentar
          </Button>
          <Button 
            onClick={() => navigate('/home')} 
            variant="outline"
          >
            Ir a Inicio
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Si el problema persiste, intenta limpiar la caché del navegador.
        </p>
      </div>
    </div>
  );
}
