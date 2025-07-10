import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-border/40 shadow-sm">
          <CardContent className="p-8 text-center space-y-6">
            {/* Error Code */}
            <div className="space-y-2">
              <div className="text-6xl font-bold text-muted-foreground/60">
                404
              </div>
              <div className="h-px bg-border w-16 mx-auto"></div>
            </div>

            {/* Message */}
            <div className="space-y-3">
              <h1 className="text-xl font-semibold text-foreground">
                Página no encontrada
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La página que buscas no existe o ha sido movida. 
                Verifica la URL o regresa al inicio.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button asChild className="w-full">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Ir al inicio
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <button onClick={() => window.history.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver atrás
                </button>
              </Button>
            </div>

            {/* Help Links */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
                <Link 
                  to="/landing" 
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  <HelpCircle className="w-3 h-3 mr-1" />
                  Ayuda
                </Link>
                <Link 
                  to="/" 
                  className="flex items-center hover:text-foreground transition-colors"
                >
                  <Search className="w-3 h-3 mr-1" />
                  Buscar
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Path Info (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Ruta intentada: <code className="font-mono">{location.pathname}</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
