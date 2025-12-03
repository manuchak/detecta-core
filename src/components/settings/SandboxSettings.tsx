import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TestTube2, 
  Shield, 
  AlertTriangle, 
  ExternalLink,
  Server,
  Database,
  Clock
} from 'lucide-react';
import { useSandbox } from '@/contexts/SandboxContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export function SandboxSettings() {
  const navigate = useNavigate();
  const { isSandboxMode, toggleSandboxMode } = useSandbox();
  const { userRole } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [understoodRisks, setUnderstoodRisks] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const canToggle = userRole === 'admin' || userRole === 'owner';

  const handleToggleRequest = () => {
    if (!canToggle) {
      toast.error('No tienes permisos para cambiar el entorno');
      return;
    }

    if (isSandboxMode) {
      // Switching TO production - show warning
      setShowConfirmDialog(true);
    } else {
      // Switching TO sandbox - safe, do it directly
      setIsChanging(true);
      toggleSandboxMode();
      toast.success('Modo Sandbox activado', {
        description: 'Ahora estás trabajando con datos de prueba'
      });
      setIsChanging(false);
    }
  };

  const handleConfirmChange = () => {
    if (!understoodRisks) return;
    
    setIsChanging(true);
    toggleSandboxMode();
    setShowConfirmDialog(false);
    setUnderstoodRisks(false);
    toast.warning('Modo Producción activado', {
      description: 'Ahora estás trabajando con datos reales'
    });
    setIsChanging(false);
  };

  return (
    <div className="space-y-6">
      {/* Environment Status Card */}
      <Card className={isSandboxMode ? 'border-warning/50' : 'border-success/50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isSandboxMode ? (
              <>
                <TestTube2 className="h-5 w-5 text-warning" />
                Entorno de Pruebas (Sandbox)
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 text-success" />
                Entorno de Producción
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isSandboxMode 
              ? 'Los cambios que realices no afectarán datos reales'
              : 'Los cambios que realices afectan datos reales del sistema'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle Control */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="space-y-1">
              <Label htmlFor="sandbox-toggle" className="text-base font-medium">
                Modo Sandbox
              </Label>
              <p className="text-sm text-muted-foreground">
                {canToggle 
                  ? 'Activa para trabajar con datos de prueba aislados'
                  : 'Solo administradores pueden cambiar el entorno'
                }
              </p>
            </div>
            <Switch
              id="sandbox-toggle"
              checked={isSandboxMode}
              onCheckedChange={handleToggleRequest}
              disabled={!canToggle || isChanging}
              className="data-[state=checked]:bg-warning"
            />
          </div>

          {/* Environment Info */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Server className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Servidor</p>
                <p className="text-xs text-muted-foreground">
                  {isSandboxMode ? 'Test Environment' : 'Production'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Base de Datos</p>
                <p className="text-xs text-muted-foreground">
                  {isSandboxMode ? 'is_test = true' : 'is_test = false'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Último cambio</p>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('es-MX')}
                </p>
              </div>
            </div>
          </div>

          {/* Warning for Production */}
          {!isSandboxMode && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Modo Producción Activo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos los cambios afectan datos reales. Se recomienda usar Sandbox para pruebas.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Herramientas de Sandbox</CardTitle>
          <CardDescription>
            Accede a herramientas de prueba y monitoreo del entorno
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Button 
            variant="outline" 
            className="justify-start gap-2"
            onClick={() => navigate('/sandbox/test-panel')}
            disabled={!isSandboxMode}
          >
            <TestTube2 className="h-4 w-4" />
            Panel de Pruebas
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
          <Button 
            variant="outline" 
            className="justify-start gap-2"
            onClick={() => navigate('/sandbox/promotions')}
          >
            <Shield className="h-4 w-4" />
            Ver Promociones
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
        </CardContent>
      </Card>

      {/* Feature Flags Card (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature Flags Activos</CardTitle>
          <CardDescription>
            Flags de funcionalidad habilitados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {[
              { name: 'REQUIRE_STRUCTURED_INTERVIEW', enabled: false },
              { name: 'REQUIRE_RISK_CHECKLIST', enabled: false },
              { name: 'REQUIRE_PSYCHOMETRIC_EVALUATION', enabled: false },
              { name: 'REQUIRE_TOXICOLOGY_NEGATIVE', enabled: false },
              { name: 'REQUIRE_REFERENCES_VALIDATION', enabled: false },
              { name: 'REQUIRE_DOCUMENTS_VALIDATED', enabled: false },
            ].map(flag => (
              <div 
                key={flag.name} 
                className="flex items-center justify-between p-2 rounded border text-xs"
              >
                <span className="font-mono truncate">{flag.name}</span>
                <Badge variant={flag.enabled ? 'default' : 'secondary'} className="text-[10px]">
                  {flag.enabled ? 'ON' : 'OFF'}
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Los feature flags se administran desde la base de datos (supply_feature_flags)
          </p>
        </CardContent>
      </Card>

      {/* Production Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cambiar a Producción
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Estás a punto de cambiar al <strong>entorno de PRODUCCIÓN</strong>.
              </p>
              <p>
                Todos los cambios que realices afectarán <strong>datos reales</strong> del sistema
                y serán visibles para todos los usuarios.
              </p>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="understand-risks" 
                  checked={understoodRisks}
                  onCheckedChange={(checked) => setUnderstoodRisks(checked as boolean)}
                />
                <Label htmlFor="understand-risks" className="text-sm">
                  Entiendo los riesgos y quiero continuar
                </Label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUnderstoodRisks(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmChange}
              disabled={!understoodRisks}
              className="bg-destructive hover:bg-destructive/90"
            >
              Cambiar a Producción
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
