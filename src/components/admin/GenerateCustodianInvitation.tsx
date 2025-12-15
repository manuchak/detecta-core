import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustodianInvitations } from '@/hooks/useCustodianInvitations';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Check, UserPlus, Link as LinkIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const GenerateCustodianInvitation = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { createInvitation, getInvitationLink } = useCustodianInvitations();
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      const invitation = await createInvitation.mutateAsync({
        nombre: nombre || undefined,
        email: email || undefined,
        telefono: telefono || undefined,
      });
      
      const link = getInvitationLink(invitation.token);
      setGeneratedLink(link);
    } catch (error) {
      console.error('Error generating invitation:', error);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast({
        title: 'Link copiado',
        description: 'El link de invitación ha sido copiado al portapapeles.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo copiar el link.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    setNombre('');
    setEmail('');
    setTelefono('');
    setGeneratedLink(null);
    setCopied(false);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invitar Custodio
        </CardTitle>
        <CardDescription>
          Genera un link de registro único para un nuevo custodio. El link expira en 7 días.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedLink ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre (opcional)</Label>
              <Input
                id="nombre"
                placeholder="Nombre del custodio"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se pre-llenará en el formulario de registro
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono (opcional)</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="+52 55 1234 5678"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleGenerate} 
              className="w-full"
              disabled={createInvitation.isPending}
            >
              {createInvitation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Generar Link de Invitación
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <Label className="text-sm font-medium">Link de invitación:</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input 
                  value={generatedLink} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⏰ Este link expira el{' '}
                <strong>
                  {format(
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    "d 'de' MMMM 'a las' HH:mm",
                    { locale: es }
                  )}
                </strong>
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCopy} className="flex-1">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Link
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Nueva Invitación
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GenerateCustodianInvitation;
