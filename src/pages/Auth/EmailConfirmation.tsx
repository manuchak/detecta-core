
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmEmail } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || !type) {
      setStatus('error');
      setMessage('Enlace de confirmación inválido. Faltan parámetros requeridos.');
      return;
    }

    const handleConfirmation = async () => {
      try {
        await confirmEmail(token, type);
        setStatus('success');
        setMessage('¡Email confirmado exitosamente! Ahora puedes iniciar sesión.');
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      } catch (error) {
        console.error('Error confirming email:', error);
        setStatus('error');
        setMessage('Error al confirmar el email. El enlace puede haber expirado.');
      }
    };

    handleConfirmation();
  }, [searchParams, confirmEmail, navigate]);

  const handleReturnToLogin = () => {
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Detecta</h1>
          <p className="text-muted-foreground">Confirmación de Email</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-sm border text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h2 className="text-lg font-semibold">Confirmando tu email...</h2>
              <p className="text-muted-foreground">Por favor espera mientras procesamos tu confirmación.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <h2 className="text-lg font-semibold text-green-700">¡Email Confirmado!</h2>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">Serás redirigido al login automáticamente...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <h2 className="text-lg font-semibold text-red-700">Error de Confirmación</h2>
              <p className="text-muted-foreground">{message}</p>
              <Button onClick={handleReturnToLogin} className="w-full">
                Volver al Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;
