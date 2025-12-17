import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      // The hash fragment contains the access token from Supabase
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (accessToken && type === "recovery") {
        // Set the session with the recovery token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get("refresh_token") || "",
        });

        if (error) {
          console.error("Error setting session:", error);
          setError("El enlace de recuperación es inválido o ha expirado");
        } else {
          setSessionReady(true);
        }
      } else {
        // Check if there's already a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionReady(true);
        } else {
          setError("No se encontró un enlace de recuperación válido. Por favor solicita uno nuevo.");
        }
      }
    };

    checkSession();
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "La contraseña debe contener al menos una mayúscula";
    }
    if (!/[a-z]/.test(pwd)) {
      return "La contraseña debe contener al menos una minúscula";
    }
    if (!/[0-9]/.test(pwd)) {
      return "La contraseña debe contener al menos un número";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error("Error updating password:", updateError);
        setError(updateError.message);
        toast({
          title: "Error",
          description: updateError.message,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "¡Contraseña actualizada!",
          description: "Tu contraseña ha sido actualizada exitosamente",
        });

        // Sign out and redirect to login after a delay
        setTimeout(async () => {
          await supabase.auth.signOut();
          navigate("/auth/login");
        }, 3000);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Ocurrió un error inesperado");
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar la contraseña",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">¡Contraseña actualizada!</h2>
        <p className="text-muted-foreground">
          Tu contraseña ha sido actualizada exitosamente. Serás redirigido al inicio de sesión...
        </p>
        <Link to="/auth/login" className="text-primary hover:underline text-sm">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  // Error state (invalid/expired link)
  if (error && !sessionReady) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Enlace inválido</h2>
        <p className="text-muted-foreground">{error}</p>
        <Link to="/auth/forgot-password">
          <Button variant="default">Solicitar nuevo enlace</Button>
        </Link>
      </div>
    );
  }

  // Loading state while checking session
  if (!sessionReady) {
    return (
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Verificando enlace de recuperación...</p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Nueva contraseña</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Ingresa tu nueva contraseña
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Password requirements */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-md">
          <p className="font-medium mb-2">La contraseña debe contener:</p>
          <ul className="space-y-1">
            <li className={password.length >= 8 ? "text-green-600" : ""}>
              • Mínimo 8 caracteres
            </li>
            <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
              • Al menos una mayúscula
            </li>
            <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>
              • Al menos una minúscula
            </li>
            <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>
              • Al menos un número
            </li>
          </ul>
        </div>

        {error && sessionReady && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            "Actualizar contraseña"
          )}
        </Button>

        <div className="text-center">
          <Link to="/auth/login" className="text-primary hover:underline text-sm">
            Volver a iniciar sesión
          </Link>
        </div>
      </form>
    </>
  );
};

export default ResetPassword;
