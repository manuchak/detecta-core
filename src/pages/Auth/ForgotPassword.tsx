
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    // Here we'll add password reset functionality with Supabase later
    
    toast({
      title: "Functionality not implemented yet",
      description: "You need to connect Supabase to implement password reset",
    });
    
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Correo enviado</h2>
        <p className="text-muted-foreground mb-4">
          Hemos enviado un enlace de restablecimiento a {email}
        </p>
        <Link to="/login" className="text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold">¿Olvidaste tu contraseña?</h2>
        <p className="text-muted-foreground">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enviando..." : "Enviar enlace de restablecimiento"}
        </Button>
        
        <div className="text-center">
          <Link to="/login" className="text-primary hover:underline text-sm">
            Volver a iniciar sesión
          </Link>
        </div>
      </form>
    </>
  );
};

export default ForgotPassword;
