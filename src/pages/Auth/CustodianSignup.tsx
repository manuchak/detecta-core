import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useInvitationToken } from '@/hooks/useCustodianInvitations';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Shield, 
  AlertTriangle,
  UserPlus
} from 'lucide-react';

export const CustodianSignup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const { toast } = useToast();
  const { 
    validation, 
    isLoading: validatingToken, 
    isValid, 
    errorMessage, 
    prefillData,
    useInvitation 
  } = useInvitationToken(token);

  // Pre-fill form with invitation data
  useEffect(() => {
    if (prefillData) {
      if (prefillData.nombre) setName(prefillData.nombre);
      if (prefillData.email) setEmail(prefillData.email);
    }
  }, [prefillData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${currentOrigin}/auth/email-confirmation?invitation=${token}`;
      
      // Create the user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            invitation_token: token,
          },
          emailRedirectTo: redirectUrl
        },
      });

      if (error) {
        let errorMessage = 'Error al crear la cuenta';
        
        if (error.message.includes('User already registered')) {
          errorMessage = 'Este email ya está registrado. Intenta iniciar sesión.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      // If user was auto-confirmed (email confirmation disabled), assign role immediately
      if (data.user && data.session) {
        const success = await useInvitation(data.user.id);
        if (success) {
          toast({
            title: '¡Bienvenido!',
            description: 'Tu cuenta ha sido creada exitosamente.',
          });
          navigate('/custodian');
          return;
        }
      }

      // Otherwise, show confirmation pending message
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado durante el registro',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4">Link Inválido</CardTitle>
            <CardDescription>
              No se proporcionó un token de invitación válido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground mb-4">
              Para registrarte como custodio, necesitas un link de invitación 
              proporcionado por un administrador de Detecta.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth/login">Ir al inicio de sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Validating token
  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Validando invitación...</p>
        </div>
      </div>
    );
  }

  // Invalid or expired token
  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <CardTitle className="mt-4">Invitación No Válida</CardTitle>
            <CardDescription>
              {errorMessage || 'Esta invitación no es válida o ha expirado.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground mb-4">
              Por favor contacta a tu administrador para obtener un nuevo link de invitación.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth/login">Ir al inicio de sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration success
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="mt-4">¡Cuenta Creada!</CardTitle>
            <CardDescription>
              Se ha enviado un email de confirmación a tu dirección de correo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Por favor revisa tu bandeja de entrada y haz clic en el enlace 
                para activar tu cuenta. Una vez confirmado, podrás acceder al 
                portal de custodios.
              </AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth/login">Ir al inicio de sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="mt-4">Registro de Custodio</CardTitle>
          <CardDescription>
            Crea tu cuenta para acceder al portal de custodios de Detecta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear cuenta
                </>
              )}
            </Button>
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">¿Ya tienes una cuenta?</span>{' '}
              <Link to="/auth/login" className="text-primary hover:underline">
                Iniciar sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustodianSignup;
