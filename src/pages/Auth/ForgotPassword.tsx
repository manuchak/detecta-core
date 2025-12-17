import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Por favor ingresa un correo válido");

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    // Validate email
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }
    
    setLoading(true);
    
    try {
      // Call Edge Function instead of Supabase directly
      const { data, error: fnError } = await supabase.functions.invoke("send-password-reset", {
        body: { 
          email: email.trim().toLowerCase(),
          redirectTo: window.location.origin 
        },
      });
      
      if (fnError) {
        console.error("Edge function error:", fnError);
        toast({
          title: "Error",
          description: "Ocurrió un error al procesar tu solicitud",
          variant: "destructive",
        });
      } else {
        setSubmitted(true);
        toast({
          title: "Correo enviado",
          description: "Si el correo existe, recibirás instrucciones de restablecimiento",
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar el correo de restablecimiento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-foreground">¡Correo enviado!</h2>
        <p className="text-muted-foreground">
          Si existe una cuenta con <span className="font-medium text-foreground">{email}</span>, 
          recibirás un enlace para restablecer tu contraseña.
        </p>
        <p className="text-sm text-muted-foreground">
          No olvides revisar tu carpeta de spam.
        </p>
        <Link 
          to="/auth/login" 
          className="inline-block text-primary hover:underline font-medium"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Mail className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-foreground">¿Olvidaste tu contraseña?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Ingresa tu correo y te enviaremos un enlace para restablecerla
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            required
            autoComplete="email"
            className={error ? "border-destructive" : ""}
          />
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
        </div>
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar enlace de restablecimiento"
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
