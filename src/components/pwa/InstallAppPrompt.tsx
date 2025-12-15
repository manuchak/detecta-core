import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Smartphone, 
  Download, 
  X, 
  Share, 
  PlusSquare,
  CheckCircle,
  Zap
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface InstallAppPromptProps {
  onClose?: () => void;
  onInstalled?: () => void;
  showAsModal?: boolean;
}

export const InstallAppPrompt = ({ 
  onClose, 
  onInstalled,
  showAsModal = true 
}: InstallAppPromptProps) => {
  const { canInstall, isIOS, promptInstall, isInstalled } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    setInstalling(true);
    const success = await promptInstall();
    setInstalling(false);
    
    if (success) {
      onInstalled?.();
    }
  };

  const benefits = [
    { icon: Zap, text: 'Acceso instantáneo con un toque' },
    { icon: Smartphone, text: 'Se ve como app nativa' },
    { icon: CheckCircle, text: 'Funciona sin internet' },
  ];

  // iOS needs manual instructions
  if (isIOS) {
    return (
      <div className={showAsModal ? "fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4" : ""}>
        <Card className={`w-full max-w-md ${showAsModal ? 'animate-in slide-in-from-bottom-10' : ''}`}>
          <CardHeader className="relative pb-2">
            {onClose && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-2"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center text-xl mt-3">
              Agrega Detecta a tu pantalla
            </CardTitle>
            <CardDescription className="text-center">
              Accede más rápido sin abrir el navegador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Benefits */}
            <div className="space-y-2">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <benefit.icon className="h-4 w-4 text-primary" />
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* iOS Instructions */}
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <p className="font-medium text-sm">Cómo agregar en iPhone/iPad:</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  <span className="flex items-center gap-1">
                    Toca el botón <Share className="h-4 w-4 inline" /> Compartir
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  <span className="flex items-center gap-1">
                    Selecciona <PlusSquare className="h-4 w-4 inline" /> "Agregar a Inicio"
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                  <span>Toca "Agregar" para confirmar</span>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-12"
              onClick={onClose}
            >
              Entendido
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Android/Chrome with native prompt
  if (!canInstall) {
    return null;
  }

  return (
    <div className={showAsModal ? "fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4" : ""}>
      <Card className={`w-full max-w-md ${showAsModal ? 'animate-in slide-in-from-bottom-10' : ''}`}>
        <CardHeader className="relative pb-2">
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-center text-xl mt-3">
            Agrega Detecta a tu pantalla
          </CardTitle>
          <CardDescription className="text-center">
            Accede más rápido sin abrir el navegador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Benefits */}
          <div className="space-y-2">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <benefit.icon className="h-4 w-4 text-primary" />
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Install Button */}
          <Button 
            className="w-full h-14 text-base font-semibold"
            onClick={handleInstall}
            disabled={installing}
          >
            <Download className="mr-2 h-5 w-5" />
            {installing ? 'Instalando...' : 'Agregar a pantalla de inicio'}
          </Button>

          <Button 
            variant="ghost" 
            className="w-full"
            onClick={onClose}
          >
            Más tarde
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallAppPrompt;
