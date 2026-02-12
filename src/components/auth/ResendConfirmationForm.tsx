import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Mail, RefreshCw } from "lucide-react";

interface ResendConfirmationFormProps {
  email: string;
  onBack: () => void;
}

export const ResendConfirmationForm = ({ email, onBack }: ResendConfirmationFormProps) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleResend = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: "Correo enviado",
        description: "Revisa tu bandeja de entrada y spam",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el correo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-center">
      <div className="p-4 rounded-full bg-amber-500/10 w-fit mx-auto">
        <Mail className="h-8 w-8 text-amber-500" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold">Necesitas confirmar tu email</h3>
        <p className="text-base text-muted-foreground mt-2">
          Tu cuenta ya existe, pero necesitas verificar tu correo electrónico antes de poder entrar.
        </p>
      </div>

      <p className="text-base text-muted-foreground bg-muted/50 p-3 rounded font-medium">
        {email}
      </p>

      {sent ? (
        <div className="space-y-3 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
          <p className="text-base text-green-600 font-medium">
            ✓ ¡Correo enviado!
          </p>
          <p className="text-sm text-muted-foreground">
            Revisa tu bandeja de entrada. Si no lo ves, búscalo en la carpeta de spam o correo no deseado.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Te enviaremos un correo con un enlace para confirmar tu cuenta.
          </p>
          <Button 
            onClick={handleResend} 
            disabled={loading}
            className="w-full h-12 text-base font-semibold"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-5 w-5 mr-2" />
                Enviar correo de confirmación
              </>
            )}
          </Button>
        </div>
      )}

      <Button variant="ghost" size="lg" onClick={onBack} className="w-full text-base">
        ← Volver al login
      </Button>
    </div>
  );
};
