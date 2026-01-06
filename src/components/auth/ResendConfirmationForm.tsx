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
    <div className="space-y-4 text-center">
      <div className="p-3 rounded-full bg-amber-500/10 w-fit mx-auto">
        <Mail className="h-6 w-6 text-amber-500" />
      </div>
      
      <div>
        <h3 className="font-semibold">Email no confirmado</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tu cuenta existe pero el email no ha sido verificado.
        </p>
      </div>

      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
        {email}
      </p>

      {sent ? (
        <div className="space-y-3">
          <p className="text-sm text-green-600">
            ✓ Correo de confirmación reenviado
          </p>
          <p className="text-xs text-muted-foreground">
            Revisa tu bandeja de entrada y carpeta de spam
          </p>
        </div>
      ) : (
        <Button 
          onClick={handleResend} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Reenviar correo de confirmación
            </>
          )}
        </Button>
      )}

      <Button variant="ghost" size="sm" onClick={onBack} className="w-full">
        Volver al login
      </Button>
    </div>
  );
};
