import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useInvitationToken } from '@/hooks/useCustodianInvitations';
import { supabase } from '@/integrations/supabase/client';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { InstallAppPrompt } from '@/components/pwa/InstallAppPrompt';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Shield, 
  AlertTriangle,
  UserPlus,
  Lock,
  LogOut,
  User,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';

// Zod schema for input validation
const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, 'El nombre solo puede contener letras'),
  email: z
    .string()
    .trim()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(72, 'La contraseña no puede exceder 72 caracteres'), // bcrypt limit
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const CustodianSignup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [name, setName] = useState('');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { showInstallOption } = usePWAInstall();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const submittingRef = useRef(false);
  const [activeSession, setActiveSession] = useState<{ email: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isCustodian, setIsCustodian] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  
  const { toast } = useToast();
  const { 
    validation, 
    isLoading: validatingToken, 
    isValid, 
    errorMessage, 
    prefillData,
    useInvitation 
  } = useInvitationToken(token);

  // Check for active session and role
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setActiveSession({ email: session.user.email || '' });
        // Check if custodian role
        try {
          const { data } = await supabase.rpc('get_current_user_role_secure');
          if (data === 'custodio') setIsCustodian(true);
        } catch { /* ignore */ }
      }
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  // Auto-redirect countdown for custodians with active session
  useEffect(() => {
    if (!activeSession || !isCustodian) return;
    if (redirectCountdown <= 0) {
      navigate('/custodian');
      return;
    }
    const timer = setTimeout(() => setRedirectCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [activeSession, isCustodian, redirectCountdown, navigate]);

  // Pre-fill form with invitation data (email is locked from invitation)
  useEffect(() => {
    if (prefillData) {
      if (prefillData.nombre) setName(prefillData.nombre);
      if (prefillData.email) setEmail(prefillData.email);
    }
  }, [prefillData]);

  // Clear validation errors when inputs change
  useEffect(() => {
    setValidationErrors({});
  }, [name, email, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setValidationErrors({});
    
    // Validate with Zod
    const result = registrationSchema.safeParse({
      name: name.trim(),
      email: email.trim(),
      password,
      confirmPassword,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      
      const firstError = result.error.errors[0];
      toast({
        title: 'Error de validación',
        description: firstError.message,
        variant: 'destructive',
      });
      submittingRef.current = false;
      return;
    }

    // Security check: Email must match invitation email
    if (prefillData?.email && email.trim().toLowerCase() !== prefillData.email.toLowerCase()) {
      toast({
        title: 'Email no autorizado',
        description: 'Debes usar el email asociado a tu invitación.',
        variant: 'destructive',
      });
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    
    try {
      // Call edge function - DO NOT log password
      const { data, error } = await supabase.functions.invoke('create-custodian-account', {
        body: {
          email: email.trim().toLowerCase(),
          password, // Not logged
          nombre: name.trim(),
          invitationToken: token,
          telefono: prefillData?.telefono || '',
        }
      });

      // Error catalog for user-friendly messages
      const errorCatalog: Record<string, { title: string; message: string }> = {
        'Invitación inválida o expirada': {
          title: 'Invitación No Válida',
          message: 'Tu enlace de invitación ha expirado o ya fue utilizado. Solicita una nueva invitación a tu coordinador.'
        },
        'Ya tienes una cuenta activa como custodio': {
          title: 'Cuenta Existente',
          message: 'Ya tienes una cuenta de custodio activa. Usa "Iniciar sesión" con tu email y contraseña.'
        },
        'Campos requeridos faltantes': {
          title: 'Datos Incompletos',
          message: 'Por favor completa todos los campos del formulario.'
        },
        'Contraseña debe tener mínimo 6 caracteres': {
          title: 'Contraseña Muy Corta',
          message: 'La contraseña debe tener al menos 6 caracteres.'
        },
      };

      const matchError = (msg: string): { title: string; message: string } => {
        for (const [key, val] of Object.entries(errorCatalog)) {
          if (msg.includes(key)) return val;
        }
        if (msg.includes('Error interno')) {
          return {
            title: 'Error del Servidor',
            message: 'Hubo un problema en el servidor. Por favor intenta de nuevo en unos minutos. Si el problema persiste, contacta a soporte.'
          };
        }
        return { title: 'Error en Registro', message: msg };
      };

      if (error) {
        let rawError = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';

        try {
          if ((error as any).context?.body) {
            const reader = (error as any).context.body.getReader();
            const { value } = await reader.read();
            const text = new TextDecoder().decode(value);
            const parsed = JSON.parse(text);
            if (parsed?.error) rawError = parsed.error;
          }
        } catch {
          // Keep default connection error
        }

        const matched = matchError(rawError);
        console.error('[CustodianSignup] Edge function error:', matched.title);
        toast({ title: matched.title, description: matched.message, variant: 'destructive' });
        return;
      }

      // Handle response from edge function
      if (data?.error) {
        const matched = matchError(data.error);
        console.error('[CustodianSignup] Registration failed:', data.error);
        toast({ title: matched.title, description: matched.message, variant: 'destructive' });
        return;
      }

      console.log('[CustodianSignup] Success, version:', data?._version);

      // Auto-login: user is already confirmed, sign them in directly
      if (data?.success && data?.autoLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        });
        
        if (!signInError) {
          toast({
            title: '¡Bienvenido!',
            description: 'Tu cuenta ha sido creada. Ahora registra tus documentos.',
          });
          navigate('/custodian/onboarding');
          return;
        } else {
          console.error('[CustodianSignup] Auto-login failed');
          // Account created but auto-login failed - redirect to login
          toast({
            title: 'Cuenta creada',
            description: 'Por favor inicia sesión con tus credenciales.',
          });
          navigate('/auth/login');
          return;
        }
      }

      // Fallback: show success message
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('[CustodianSignup] Unexpected error');
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado durante el registro',
        variant: 'destructive',
      });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleLogoutAndContinue = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setActiveSession(null);
    setLoggingOut(false);
  };

  // Checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Active session detected — auto-redirect for custodians
  if (activeSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <User className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="mt-4">Sesión Activa Detectada</CardTitle>
            <CardDescription>
              Ya tienes una sesión iniciada como <strong>{activeSession.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isCustodian && (
              <Alert className="border-primary bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription>
                  Redirigiendo a tu portal en {redirectCountdown}s...
                </AlertDescription>
              </Alert>
            )}
            <Button 
              onClick={() => navigate('/custodian')} 
              className="w-full" 
              variant="default"
              size="lg"
            >
              <Shield className="mr-2 h-4 w-4" />
              Ir a mi portal de custodio
            </Button>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ¿Necesitas registrar otra cuenta? Cierra sesión primero.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleLogoutAndContinue} 
              className="w-full" 
              variant="outline"
              disabled={loggingOut}
            >
              {loggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Cerrar sesión y registrar nueva cuenta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  // Registration success - show PWA install prompt
  if (registrationSuccess) {
    // Show install prompt after successful registration
    if (showInstallOption && showInstallPrompt) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <InstallAppPrompt 
            onClose={() => setShowInstallPrompt(false)}
            onInstalled={() => setShowInstallPrompt(false)}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
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
            
            {/* PWA Install Prompt Button */}
            {showInstallOption && !showInstallPrompt && (
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => setShowInstallPrompt(true)}
              >
                📱 Agregar app a pantalla de inicio
              </Button>
            )}
            
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
          <CardTitle className="mt-4 text-2xl">Registro de Custodio</CardTitle>
          <CardDescription className="text-base">
            Llena estos datos para crear tu cuenta. Si necesitas ayuda, contacta a tu coordinador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className={`h-12 text-base ${validationErrors.name ? 'border-destructive' : ''}`}
                aria-invalid={!!validationErrors.name}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive font-medium">{validationErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                  readOnly={!!prefillData?.email}
                  className={`h-12 text-base ${validationErrors.email ? 'border-destructive' : ''} ${prefillData?.email ? 'bg-muted pr-10' : ''}`}
                  aria-invalid={!!validationErrors.email}
                />
                {prefillData?.email && (
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {prefillData?.email && (
                <p className="text-sm text-muted-foreground">
                  Este email está asociado a tu invitación y no puede modificarse.
                </p>
              )}
              {validationErrors.email && (
                <p className="text-sm text-destructive font-medium">{validationErrors.email}</p>
              )}
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
                  minLength={6}
                  maxLength={72}
                  className={`h-12 text-base pr-14 ${validationErrors.password ? 'border-destructive' : ''}`}
                  aria-invalid={!!validationErrors.password}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              <div className={`flex items-center gap-1.5 text-sm ${password.length >= 6 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {password.length >= 6 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
                <span>Mínimo 6 caracteres</span>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-destructive font-medium">{validationErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  maxLength={72}
                  className={`h-12 text-base pr-14 ${validationErrors.confirmPassword ? 'border-destructive' : ''}`}
                  aria-invalid={!!validationErrors.confirmPassword}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {confirmPassword && confirmPassword === password && (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Las contraseñas coinciden</span>
                </div>
              )}
              {validationErrors.confirmPassword && (
                <p className="text-sm text-destructive font-medium">{validationErrors.confirmPassword}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Crear cuenta
                </>
              )}
            </Button>
            
            <div className="text-center text-base pt-2">
              <span className="text-muted-foreground">¿Ya tienes una cuenta?</span>{' '}
              <Link to="/auth/login" className="text-primary hover:underline font-medium">
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
