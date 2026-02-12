import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSmartAuthRedirect } from "@/hooks/useSmartAuthRedirect";
import { Eye, EyeOff } from "lucide-react";
import { ResendConfirmationForm } from "@/components/auth/ResendConfirmationForm";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();
  
  useSmartAuthRedirect();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await signIn(email, password);
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Detectar error de email no confirmado
      if (error?.message?.toLowerCase().includes("email not confirmed")) {
        setShowResendConfirmation(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mostrar formulario de reenvío si el email no está confirmado
  if (showResendConfirmation) {
    return (
      <ResendConfirmationForm 
        email={email} 
        onBack={() => setShowResendConfirmation(false)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Iniciar Sesión
        </h2>
        <p className="text-base text-muted-foreground mt-2">
          Ingresa tus datos para entrar a tu cuenta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nombre@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="h-12 text-base"
          />
          <p className="text-sm text-muted-foreground">
            Usa el email con el que te registraste
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-base">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Escribe tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-12 text-base pr-14"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
        
        <div className="text-center space-y-3 pt-2">
          <Link 
            to="/auth/forgot-password" 
            className="block text-base text-primary font-medium hover:underline py-2"
          >
            ¿Olvidaste tu contraseña?
          </Link>
          
          <div className="text-base">
            <span className="text-muted-foreground">¿No tienes una cuenta?</span>{" "}
            <Link 
              to="/auth/register" 
              className="text-primary hover:underline font-medium"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
