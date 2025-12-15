import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, LogOut, Mail } from "lucide-react";

export const PendingActivation = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Detecta</h1>
          <p className="text-muted-foreground">Portal de Custodios</p>
        </div>
        
        <div className="bg-card p-8 rounded-lg shadow-sm border text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Cuenta Pendiente de Activación</h2>
            <p className="text-muted-foreground text-sm">
              Tu cuenta ha sido creada exitosamente, pero está pendiente de activación por un administrador.
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-md space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user?.email || 'tu correo registrado'}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Te notificaremos por email cuando tu cuenta esté lista para acceder al portal.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Si tienes dudas, contacta al administrador del sistema.
            </p>
            
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingActivation;
