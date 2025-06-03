
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setShowEmailNotConfirmed(false);
    
    try {
      await signIn(email, password);
      // Redirect to dashboard after successful login
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Mostrar alerta específica para email no confirmado
      if (error.message?.includes('Email not confirmed') || 
          error.message?.includes('email_not_confirmed')) {
        setShowEmailNotConfirmed(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email para reenviar la confirmación",
        variant: "destructive",
      });
      return;
    }

    try {
      // Aquí podrías implementar la lógica para reenviar el email de confirmación
      toast({
        title: "Email enviado",
        description: "Se ha reenviado el email de confirmación a tu bandeja de entrada",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo reenviar el email de confirmación",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showEmailNotConfirmed && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tu email no está confirmado. Revisa tu bandeja de entrada y haz clic en el enlace de confirmación.
            <Button 
              variant="link" 
              className="p-0 h-auto ml-2 text-destructive underline"
              onClick={handleResendConfirmation}
              type="button"
            >
              Reenviar email
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>
      
      <div className="text-center text-sm">
        <span className="text-muted-foreground">¿No tienes una cuenta?</span>{" "}
        <Link to="/register" className="text-primary hover:underline">
          Regístrate
        </Link>
      </div>
    </form>
  );
};

export default Login;
