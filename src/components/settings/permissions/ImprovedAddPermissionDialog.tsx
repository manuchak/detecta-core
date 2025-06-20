
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  HelpCircle,
  Layout,
  Play,
  Box,
  Shield,
  Star,
  FileBarChart,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Permission, Role } from "@/types/roleTypes";

interface ImprovedAddPermissionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRole: Role;
  onAddPermission: (permission: {
    role: Role;
    permissionType: string;
    permissionId: string;
    allowed: boolean;
  }) => void;
  availableRoles: Role[] | undefined;
  existingPermissions?: Permission[];
}

export const ImprovedAddPermissionDialog = ({
  isOpen,
  onOpenChange,
  selectedRole,
  onAddPermission,
  availableRoles,
  existingPermissions = []
}: ImprovedAddPermissionDialogProps) => {
  const [permissionType, setPermissionType] = useState('');
  const [permissionId, setPermissionId] = useState('');
  const [allowed, setAllowed] = useState(true);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const permissionCategories = [
    {
      value: 'page',
      label: 'Páginas',
      icon: Layout,
      description: 'Acceso a páginas específicas del sistema',
      options: [
        { value: 'dashboard', label: 'Panel Principal', description: 'Página principal del sistema' },
        { value: 'users', label: 'Gestión de Usuarios', description: 'Administrar usuarios del sistema' },
        { value: 'services', label: 'Servicios', description: 'Gestión de servicios' },
        { value: 'leads', label: 'Leads', description: 'Gestión de leads y prospectos' },
        { value: 'monitoring', label: 'Monitoreo', description: 'Sistema de monitoreo en tiempo real' },
        { value: 'supply', label: 'Suministros', description: 'Gestión de cadena de suministros' },
        { value: 'settings', label: 'Configuración', description: 'Configuración del sistema' },
        { value: 'reports', label: 'Reportes', description: 'Reportes y análisis' },
        { value: 'profile', label: 'Perfil', description: 'Gestión del perfil personal' },
        { value: 'custodio_portal', label: 'Portal de Custodio', description: 'Portal especializado para custodios' },
        { value: 'evaluations', label: 'Evaluaciones', description: 'Sistema de evaluaciones' },
      ]
    },
    {
      value: 'action',
      label: 'Acciones',
      icon: Play,
      description: 'Acciones específicas que puede realizar el usuario',
      options: [
        { value: 'create_service', label: 'Crear Servicios', description: 'Crear nuevos servicios' },
        { value: 'edit_service', label: 'Editar Servicios', description: 'Modificar servicios existentes' },
        { value: 'view_services', label: 'Ver Servicios', description: 'Visualizar servicios' },
        { value: 'manage_leads', label: 'Gestionar Leads', description: 'Gestionar leads y asignaciones' },
        { value: 'convert_lead_to_service', label: 'Convertir Lead', description: 'Convertir leads en servicios' },
        { value: 'schedule_services', label: 'Programar Servicios', description: 'Agendar servicios' },
        { value: 'complete_evaluations', label: 'Completar Evaluaciones', description: 'Completar evaluaciones asignadas' },
        { value: 'upload_documents', label: 'Subir Documentos', description: 'Subir archivos al sistema' },
        { value: 'update_personal_info', label: 'Actualizar Info Personal', description: 'Modificar información personal' },
        { value: 'view_assignments', label: 'Ver Asignaciones', description: 'Ver tareas asignadas' },
        { value: 'submit_reports', label: 'Enviar Reportes', description: 'Enviar reportes del sistema' },
      ]
    },
    {
      value: 'module',
      label: 'Módulos',
      icon: Box,
      description: 'Acceso a módulos completos del sistema',
      options: [
        { value: 'analytics', label: 'Análisis', description: 'Módulo de análisis y estadísticas' },
        { value: 'api', label: 'API', description: 'Configuración de API' },
        { value: 'installations', label: 'Instalaciones', description: 'Módulo de instalaciones' },
        { value: 'fleet_management', label: 'Gestión de Flota', description: 'Gestión de vehículos' },
      ]
    },
    {
      value: 'admin',
      label: 'Administración',
      icon: Shield,
      description: 'Funciones administrativas críticas',
      options: [
        { value: 'user_management', label: 'Gestión de Usuarios', description: 'CRÍTICO: Administrar usuarios' },
        { value: 'system_config', label: 'Configuración del Sistema', description: 'CRÍTICO: Configuraciones del sistema' },
        { value: 'role_management', label: 'Gestión de Roles', description: 'CRÍTICO: Administrar roles y permisos' },
      ]
    }
  ];

  const checkForDuplicate = (type: string, id: string) => {
    const existing = existingPermissions.find(
      p => p.role === selectedRole && 
           p.permission_type === type && 
           p.permission_id === id
    );
    setIsDuplicate(!!existing);
    return !!existing;
  };

  const handleTypeChange = (type: string) => {
    setPermissionType(type);
    setPermissionId('');
    setIsDuplicate(false);
  };

  const handleIdChange = (id: string) => {
    setPermissionId(id);
    if (permissionType) {
      checkForDuplicate(permissionType, id);
    }
  };

  const handleSave = () => {
    if (!isDuplicate && permissionType && permissionId) {
      onAddPermission({
        role: selectedRole,
        permissionType,
        permissionId,
        allowed
      });
      setPermissionType('');
      setPermissionId('');
      setAllowed(true);
      setIsDuplicate(false);
      onOpenChange(false);
    }
  };

  const selectedCategory = permissionCategories.find(cat => cat.value === permissionType);
  const selectedOption = selectedCategory?.options.find(opt => opt.value === permissionId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Añadir Permiso para {selectedRole}</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure un nuevo permiso para este rol. Use las opciones predefinidas para mayor seguridad.
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {isDuplicate && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este permiso ya existe para el rol {selectedRole}. No es necesario añadirlo nuevamente.
              </AlertDescription>
            </Alert>
          )}

          {/* Categoría de Permiso */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categoría del Permiso</Label>
            <Select value={permissionType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una categoría" />
              </SelectTrigger>
              <SelectContent>
                {permissionCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <p className="text-xs text-muted-foreground">
                {selectedCategory.description}
              </p>
            )}
          </div>

          {/* Permiso Específico */}
          {permissionType && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Permiso Específico</Label>
              <Select value={permissionId} onValueChange={handleIdChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un permiso" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCategory?.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOption && (
                <div className="bg-muted/30 rounded-md p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedCategory?.label}</Badge>
                    {selectedOption.description.includes('CRÍTICO') && (
                      <Badge variant="destructive" className="text-xs">Crítico</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedOption.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Estado del Permiso */}
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Estado del Permiso</Label>
              <p className="text-xs text-muted-foreground">
                {allowed ? 'El permiso estará habilitado' : 'El permiso estará deshabilitado'}
              </p>
            </div>
            <Switch
              checked={allowed}
              onCheckedChange={setAllowed}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!permissionType || !permissionId || isDuplicate}
          >
            Añadir Permiso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
