import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, XCircle, Loader2, Shield, AlertTriangle,
  Lock, LogOut, User, Eye, EyeOff, Info
} from 'lucide-react';

const registrationSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100).regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, 'Solo letras'),
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(72),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

const ArmadoSignup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const submittingRef = useRef(false);
  const [activeSession, setActiveSession] = useState<{ email: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isArmado, setIsArmado] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Token validation state
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [prefillData, setPrefillData] = useState<{ email?: string; nombre?: string; telefono?: string } | null>(null);

  // Validate token
  useEffect(() => {
    if (!token) { setValidatingToken(false); return; }
    const validate = async () => {
      try {
        const { data, error } = await supabase
          .from('armado_invitations')
          .select('*')
          .eq('token', token)
          .eq('status', 'pending')
          .gte('expires_at', new Date().toISOString())
          .maybeSingle();

        if (error || !data) {
          setTokenError('Esta invitación no es válida o ha expirado.');
          setTokenValid(false);
        } else {
          setTokenValid(true);
          setPrefillData({ email: data.email || '', nombre: data.nombre || '', telefono: data.telefono || '' });
        }
      } catch {
        setTokenError('Error validando invitación');
      } finally {
        setValidatingToken(false);
      }
    };
    validate();
  }, [token]);

  // Check session
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setActiveSession({ email: session.user.email || '' });
        try {
          const { data } = await supabase.rpc('get_current_user_role_secure');
          if (data === 'armado') setIsArmado(true);
        } catch {}
      }
      setCheckingSession(false);
    };
    check();
  }, []);

  // Auto-redirect for armados
  useEffect(() => {
    if (!activeSession || !isArmado) return;
    if (redirectCountdown <= 0) { navigate('/armado'); return; }
    const t = setTimeout(() => setRedirectCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [activeSession, isArmado, redirectCountdown, navigate]);

  // Prefill
  useEffect(() => {
    if (prefillData?.nombre) setName(prefillData.nombre);
    if (prefillData?.email) setEmail(prefillData.email);
  }, [prefillData]);

  useEffect(() => { setValidationErrors({}); }, [name, email, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setValidationErrors({});

    const result = registrationSchema.safeParse({ name: name.trim(), email: email.trim(), password, confirmPassword });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => { if (err.path[0]) errors[err.path[0] as string] = err.message; });
      setValidationErrors(errors);
      toast({ title: 'Error de validación', description: result.error.errors[0].message, variant: 'destructive' });
      submittingRef.current = false;
      return;
    }

    if (prefillData?.email && email.trim().toLowerCase() !== prefillData.email.toLowerCase()) {
      toast({ title: 'Email no autorizado', description: 'Usa el email de tu invitación.', variant: 'destructive' });
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-armado-account', {
        body: { email: email.trim().toLowerCase(), password, nombre: name.trim(), invitationToken: token, telefono: prefillData?.telefono || '' }
      });

      if (error) {
        let rawError = 'No se pudo conectar con el servidor.';
        try {
          if ((error as any).context?.body) {
            const reader = (error as any).context.body.getReader();
            const { value } = await reader.read();
            const parsed = JSON.parse(new TextDecoder().decode(value));
            if (parsed?.error) rawError = parsed.error;
          }
        } catch {}
        toast({ title: 'Error', description: rawError, variant: 'destructive' });
        return;
      }

      if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }

      if (data?.success && data?.autoLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (!signInError) {
          toast({ title: '¡Bienvenido!', description: 'Tu cuenta ha sido creada.' });
          navigate('/armado');
          return;
        }
        toast({ title: 'Cuenta creada', description: 'Inicia sesión con tus credenciales.' });
        navigate('/auth/login');
        return;
      }

      setRegistrationSuccess(true);
    } catch {
      toast({ title: 'Error', description: 'Error inesperado durante el registro', variant: 'destructive' });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  if (checkingSession) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (activeSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <User className="mx-auto h-12 w-12 text-amber-500" />
            <CardTitle className="mt-4">Sesión Activa</CardTitle>
            <CardDescription>Sesión como <strong>{activeSession.email}</strong></CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isArmado && <Alert className="border-primary bg-primary/5"><Info className="h-4 w-4 text-primary" /><AlertDescription>Redirigiendo en {redirectCountdown}s...</AlertDescription></Alert>}
            <Button onClick={() => navigate('/armado')} className="w-full"><Shield className="mr-2 h-4 w-4" />Ir a mi portal</Button>
            <Button onClick={async () => { setLoggingOut(true); await supabase.auth.signOut(); setActiveSession(null); setLoggingOut(false); }} variant="outline" className="w-full" disabled={loggingOut}>
              {loggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center"><XCircle className="mx-auto h-12 w-12 text-destructive" /><CardTitle className="mt-4">Link Inválido</CardTitle><CardDescription>No se proporcionó un token de invitación.</CardDescription></CardHeader>
          <CardContent><Button asChild className="w-full"><Link to="/auth/login">Ir al inicio de sesión</Link></Button></CardContent>
        </Card>
      </div>
    );
  }

  if (validatingToken) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Validando invitación...</p></div>;

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center"><AlertTriangle className="mx-auto h-12 w-12 text-amber-500" /><CardTitle className="mt-4">Invitación No Válida</CardTitle><CardDescription>{tokenError}</CardDescription></CardHeader>
          <CardContent><Button asChild className="w-full"><Link to="/auth/login">Ir al inicio de sesión</Link></Button></CardContent>
        </Card>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center"><CheckCircle className="mx-auto h-12 w-12 text-green-600" /><CardTitle className="mt-4">¡Cuenta Creada!</CardTitle></CardHeader>
          <CardContent><Button asChild className="w-full"><Link to="/auth/login">Ir al inicio de sesión</Link></Button></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl">Registro de Armado</CardTitle>
          <CardDescription>Llena estos datos para crear tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required className="h-12" />
              {validationErrors.name && <p className="text-xs text-destructive mt-1">{validationErrors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required disabled={!!prefillData?.email} className="h-12" />
              {validationErrors.email && <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required className="h-12 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              {validationErrors.password && <p className="text-xs text-destructive mt-1">{validationErrors.password}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite tu contraseña" required className="h-12" />
              {validationErrors.confirmPassword && <p className="text-xs text-destructive mt-1">{validationErrors.confirmPassword}</p>}
            </div>
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArmadoSignup;
