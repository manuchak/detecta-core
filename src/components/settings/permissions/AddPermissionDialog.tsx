
import React from 'react';
import { Role } from '@/types/roleTypes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  ShieldCheck, 
  InfoIcon, 
  MonitorIcon, 
  FileTextIcon, 
  Settings2Icon, 
  KeyIcon 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Predefined permission types with descriptive labels
const permissionTypes = [
  { value: 'page', label: 'Páginas', description: 'Acceso a páginas del sistema', icon: <MonitorIcon className="h-4 w-4 mr-2" /> },
  { value: 'action', label: 'Acciones', description: 'Operaciones como crear, editar o eliminar', icon: <FileTextIcon className="h-4 w-4 mr-2" /> },
  { value: 'feature', label: 'Funcionalidades', description: 'Módulos o capacidades específicas', icon: <Settings2Icon className="h-4 w-4 mr-2" /> }
];

// Common permission IDs grouped by type
const permissionIdsByType: Record<string, Array<{value: string, label: string, description: string}>> = {
  page: [
    { value: 'dashboard', label: 'Panel Principal', description: 'Acceso al dashboard principal' },
    { value: 'settings', label: 'Configuración', description: 'Acceso a la página de configuración' },
    { value: 'users', label: 'Usuarios', description: 'Acceso a la página de usuarios' },
    { value: 'monitoring', label: 'Monitoreo', description: 'Acceso a la página de monitoreo' },
    { value: 'leads', label: 'Leads', description: 'Acceso a la página de leads' },
    { value: 'tickets', label: 'Tickets', description: 'Acceso a la página de tickets' }
  ],
  action: [
    { value: 'create_user', label: 'Crear Usuario', description: 'Permite crear nuevos usuarios' },
    { value: 'edit_user', label: 'Editar Usuario', description: 'Permite modificar usuarios existentes' },
    { value: 'delete_user', label: 'Eliminar Usuario', description: 'Permite eliminar usuarios' },
    { value: 'approve_lead', label: 'Aprobar Lead', description: 'Permite aprobar leads nuevos' }
  ],
  feature: [
    { value: 'reporting', label: 'Reportes', description: 'Acceso al módulo de reportes' },
    { value: 'notifications', label: 'Notificaciones', description: 'Acceso a las notificaciones del sistema' },
    { value: 'installer_management', label: 'Gestión de Instaladores', description: 'Administrar instaladores' }
  ]
};

interface AddPermissionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newPermission: {
    role: Role;
    permissionType: string;
    permissionId: string;
    allowed: boolean;
  };
  onNewPermissionChange: (field: string, value: string | boolean | Role) => void;
  onAddPermission: () => void;
  availableRoles: Role[] | undefined;
}

export const AddPermissionDialog = ({
  isOpen,
  onOpenChange,
  newPermission,
  onNewPermissionChange,
  onAddPermission,
  availableRoles = [],
}: AddPermissionDialogProps) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'supply_admin':
      case 'monitoring_supervisor':
        return 'bg-amber-100 text-amber-800';
      case 'supply':
      case 'soporte':
      case 'bi':
      case 'monitoring':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'unverified':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get friendly role name
  const getRoleFriendlyName = (role: string) => {
    switch (role) {
      case 'owner': return 'Propietario';
      case 'admin': return 'Administrador';
      case 'supply_admin': return 'Admin. de Suministros';
      case 'supply': return 'Suministros';
      case 'soporte': return 'Soporte';
      case 'bi': return 'Inteligencia de Negocios';
      case 'monitoring': return 'Monitoreo';
      case 'monitoring_supervisor': return 'Supervisor de Monitoreo';
      case 'pending': return 'Pendiente';
      case 'unverified': return 'No Verificado';
      default: return role;
    }
  };

  // Selected permission type
  const selectedType = newPermission.permissionType || '';
  
  // Available permission IDs for the selected type
  const availablePermissionIds = permissionIdsByType[selectedType] || [];

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3 pb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Nuevo Permiso</DialogTitle>
            <DialogDescription>
              Configure un nuevo acceso o restricción para un rol específico
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2 font-medium">
                  <KeyIcon className="h-4 w-4 text-primary/70" />
                  Rol
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="p-3 max-w-xs">
                      <p>Seleccione el rol al que desea asignar este permiso</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select
                  value={newPermission.role}
                  onValueChange={(value) => 
                    onNewPermissionChange('role', value as Role)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${getRoleBadgeColor(role)} px-2 py-0.5`}>
                            {getRoleFriendlyName(role)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  El rol determina el nivel de acceso del usuario
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="permissionType" className="flex items-center gap-2 font-medium">
                  <FileTextIcon className="h-4 w-4 text-primary/70" />
                  Tipo de Permiso
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="p-3 max-w-xs">
                      <p>La categoría del permiso determina a qué tipo de recurso afecta</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select
                  value={newPermission.permissionType}
                  onValueChange={(value) => {
                    onNewPermissionChange('permissionType', value);
                    onNewPermissionChange('permissionId', ''); // Reset permissionId when type changes
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo de permiso" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          {type.icon}
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {permissionTypes.find(t => t.value === selectedType)?.description || 
                   "Seleccione el tipo de permiso para ver la descripción"}
                </p>
              </div>
              
              <div className={`space-y-2 ${!selectedType ? 'opacity-50 pointer-events-none' : ''}`}>
                <Label htmlFor="permissionId" className="flex items-center gap-2 font-medium">
                  <MonitorIcon className="h-4 w-4 text-primary/70" />
                  Recurso
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="p-3 max-w-xs">
                      <p>El recurso específico al que se aplica este permiso</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                {selectedType ? (
                  <Select
                    value={newPermission.permissionId}
                    onValueChange={(value) => 
                      onNewPermissionChange('permissionId', value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar recurso" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePermissionIds.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          <div className="flex flex-col">
                            <span>{item.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        <div className="flex items-center text-primary">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          <span>Personalizado</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="bg-muted/50 rounded-md px-3 py-2 text-sm text-muted-foreground border border-input">
                    Primero seleccione un tipo de permiso
                  </div>
                )}
                {newPermission.permissionId === 'custom' ? (
                  <div className="pt-2">
                    <Label htmlFor="customPermissionId" className="text-sm font-medium mb-1 block">
                      Nombre personalizado
                    </Label>
                    <input
                      id="customPermissionId"
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                      placeholder="Ingrese un nombre único"
                      onChange={(e) => onNewPermissionChange('permissionId', e.target.value)}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    {newPermission.permissionId && availablePermissionIds.find(p => p.value === newPermission.permissionId)?.description || 
                     "Seleccione un recurso específico"}
                  </p>
                )}
              </div>
              
              <div className="pt-2 mt-4 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowed" className="font-medium flex items-center gap-2">
                      Estado del Permiso
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="p-3 max-w-xs">
                          <p>Determine si el acceso está permitido o denegado</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Determina si el permiso está activo o inactivo
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={newPermission.allowed ? "text-green-600 font-medium text-sm" : "text-red-600 font-medium text-sm"}>
                      {newPermission.allowed ? "Permitido" : "Denegado"}
                    </span>
                    <Switch
                      id="allowed"
                      checked={newPermission.allowed}
                      onCheckedChange={(checked) => 
                        onNewPermissionChange('allowed', checked)
                      }
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/20 px-4 py-3 rounded-md mb-3">
            <div className="flex items-center gap-2 text-sm">
              <InfoIcon className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-medium text-foreground">Resumen del permiso</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {newPermission.role && newPermission.permissionType && newPermission.permissionId ? (
                    <>
                      El rol <span className="font-medium">{getRoleFriendlyName(newPermission.role)}</span>{' '}
                      {newPermission.allowed ? 'tendrá acceso a' : 'no tendrá acceso a'}{' '}
                      <span className="font-medium">
                        {availablePermissionIds.find(p => p.value === newPermission.permissionId)?.label || newPermission.permissionId}
                      </span>
                    </>
                  ) : (
                    'Complete todos los campos para ver el resumen'
                  )}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between border-t border-border/50 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={onAddPermission} 
              className="px-6 gap-2"
              disabled={!newPermission.role || !newPermission.permissionType || !newPermission.permissionId}
            >
              <PlusCircle className="h-4 w-4" />
              Guardar Permiso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
