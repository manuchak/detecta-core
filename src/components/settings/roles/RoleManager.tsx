import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useUserSkills } from '@/hooks/useUserSkills';
import { Search, Users, Shield, UserPlus, UserMinus, UserCheck, Archive, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArchiveUserDialog } from './ArchiveUserDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserWithRole } from '@/types/roleTypes';

export const RoleManager = () => {
  const { users, updateUserRole, archiveUser, reactivateUser } = useUserRoles();
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  // Obtener usuarios únicos por email y mostrar el rol de mayor prioridad
  const uniqueUsers = users?.reduce((acc, user) => {
    const existingUser = acc.find(u => u.email === user.email);
    if (!existingUser) {
      acc.push(user);
    } else {
      const priority = (role: string) => {
        const priorities: Record<string, number> = {
          'owner': 1, 'admin': 2, 'supply_admin': 3, 'coordinador_operaciones': 4,
          'jefe_seguridad': 5, 'analista_seguridad': 6, 'supply_lead': 7,
          'ejecutivo_ventas': 8, 'bi': 9, 'monitoring_supervisor': 10,
          'monitoring': 11, 'supply': 12, 'instalador': 13, 'planificador': 14,
          'soporte': 15, 'custodio': 16, 'pending': 17
        };
        return priorities[role] || 18;
      };
      
      if (priority(user.role) < priority(existingUser.role)) {
        Object.assign(existingUser, user);
      }
    }
    return acc;
  }, [] as typeof users) || [];

  // Filtrar por búsqueda y estado activo/archivado
  const filteredUsers = uniqueUsers.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isActive = user.is_active !== false;
    const matchesActiveFilter = showArchived ? !isActive : isActive;
    
    return matchesSearch && matchesActiveFilter;
  });

  const activeCount = uniqueUsers.filter(u => u.is_active !== false).length;
  const archivedCount = uniqueUsers.filter(u => u.is_active === false).length;

  const availableRoles = [
    'admin', 'supply_admin', 'coordinador_operaciones', 'jefe_seguridad',
    'analista_seguridad', 'supply_lead', 'ejecutivo_ventas', 'bi',
    'monitoring_supervisor', 'monitoring', 'supply', 'instalador', 'planificador', 'soporte'
  ];

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'admin': 'Administrador',
      'supply_admin': 'Admin Suministros',
      'coordinador_operaciones': 'Coordinador Operaciones',
      'jefe_seguridad': 'Jefe de Seguridad',
      'analista_seguridad': 'Analista Seguridad',
      'supply_lead': 'Lead Supply',
      'ejecutivo_ventas': 'Ejecutivo Ventas',
      'bi': 'Business Intelligence',
      'monitoring_supervisor': 'Supervisor Monitoreo',
      'monitoring': 'Monitoreo',
      'supply': 'Suministros',
      'instalador': 'Instalador',
      'planificador': 'Planificador',
      'soporte': 'Soporte'
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'supply_admin':
      case 'coordinador_operaciones':
      case 'jefe_seguridad':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'analista_seguridad':
      case 'supply_lead':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'planificador':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'supply':
      case 'soporte':
      case 'bi':
      case 'monitoring':
      case 'instalador':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSkillSummary = (role: string) => {
    const skillsByRole: Record<string, string[]> = {
      'admin': ['Acceso completo al sistema'],
      'supply_admin': ['Gestión de leads', 'Dashboard ejecutivo'],
      'coordinador_operaciones': ['Leads', 'Instaladores', 'Monitoreo'],
      'analista_seguridad': ['Análisis de riesgo', 'Reportes'],
      'instalador': ['Portal de instalación', 'Documentación'],
      'planificador': ['Planeación de servicios', 'Asignación de recursos']
    };
    return skillsByRole[role] || ['Permisos básicos'];
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRole.mutate({ userId, role: newRole as any });
  };

  const handleArchiveClick = (user: UserWithRole) => {
    setSelectedUser(user);
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = (reason: string) => {
    if (selectedUser) {
      archiveUser.mutate({ userId: selectedUser.id, reason });
      setArchiveDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleReactivate = (userId: string) => {
    reactivateUser.mutate({ userId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Gestión de Roles y Usuarios</h2>
          <p className="text-sm text-muted-foreground">
            Administra roles de usuarios para dar acceso a diferentes funcionalidades
          </p>
        </div>
      </div>

      {/* Search and Toggle */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios por email o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-archived"
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                />
                <Label htmlFor="show-archived" className="text-sm cursor-pointer">
                  Mostrar egresados
                </Label>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <UserCheck className="h-4 w-4 text-green-600" />
                {activeCount} activos
              </span>
              <span className="flex items-center gap-1">
                <Archive className="h-4 w-4 text-gray-500" />
                {archivedCount} egresados
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access for Key Users */}
      {!showArchived && (
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-blue-900">Roles recomendados para acceso completo:</p>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge className="bg-amber-100 text-amber-800">supply_admin</Badge>
                <span className="text-blue-700">→ Acceso completo a leads e instaladores</span>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge className="bg-orange-100 text-orange-800">coordinador_operaciones</Badge>
                <span className="text-blue-700">→ Gestión operativa y monitoreo</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Users Grid */}
      <div className="grid gap-4">
        {filteredUsers.map(user => (
          <UserRoleCard 
            key={user.id}
            user={user}
            availableRoles={availableRoles}
            onRoleChange={handleRoleChange}
            onArchive={() => handleArchiveClick(user)}
            onReactivate={() => handleReactivate(user.id)}
            getRoleDisplayName={getRoleDisplayName}
            getRoleBadgeColor={getRoleBadgeColor}
            getSkillSummary={getSkillSummary}
            isReactivating={reactivateUser.isPending}
          />
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            {showArchived ? (
              <>
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay colaboradores egresados</p>
              </>
            ) : (
              <>
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron usuarios</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Archive Dialog */}
      {selectedUser && (
        <ArchiveUserDialog
          open={archiveDialogOpen}
          onOpenChange={setArchiveDialogOpen}
          userName={selectedUser.display_name}
          userEmail={selectedUser.email}
          onConfirm={handleArchiveConfirm}
          isLoading={archiveUser.isPending}
        />
      )}
    </div>
  );
};

// Componente para mostrar cada usuario con sus roles y skills
const UserRoleCard = ({ 
  user, 
  availableRoles, 
  onRoleChange,
  onArchive,
  onReactivate,
  getRoleDisplayName, 
  getRoleBadgeColor,
  getSkillSummary,
  isReactivating
}: {
  user: UserWithRole;
  availableRoles: string[];
  onRoleChange: (userId: string, role: string) => void;
  onArchive: () => void;
  onReactivate: () => void;
  getRoleDisplayName: (role: string) => string;
  getRoleBadgeColor: (role: string) => string;
  getSkillSummary: (role: string) => string[];
  isReactivating: boolean;
}) => {
  const { userSkills } = useUserSkills(user.id);
  const isArchived = user.is_active === false;

  return (
    <Card className={`hover:shadow-md transition-shadow ${isArchived ? 'opacity-75 bg-muted/30' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              isArchived ? 'bg-gray-100' : 'bg-primary/10'
            }`}>
              {isArchived ? (
                <Archive className="h-6 w-6 text-gray-500" />
              ) : (
                <Users className="h-6 w-6 text-primary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="font-semibold text-lg">{user.display_name}</h3>
                <Badge className={`text-xs border ${getRoleBadgeColor(user.role)}`}>
                  {getRoleDisplayName(user.role)}
                </Badge>
                {isArchived && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                    Egresado
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{user.email}</p>
              
              {isArchived && user.archived_at && (
                <div className="mb-3 p-2 bg-gray-50 rounded-md border border-gray-200 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Egresado el {format(new Date(user.archived_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                  {user.archived_by_name && (
                    <p className="text-xs text-gray-500 mt-1">Por: {user.archived_by_name}</p>
                  )}
                  {user.archive_reason && (
                    <p className="text-xs text-gray-500 mt-1">Motivo: {user.archive_reason}</p>
                  )}
                </div>
              )}
              
              {!isArchived && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">CAPACIDADES:</div>
                  <div className="flex flex-wrap gap-1">
                    {getSkillSummary(user.role).map((skill: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  
                  {userSkills && userSkills.length > 0 && (
                    <div className="text-xs text-blue-600">
                      + {userSkills.length} skills específicos asignados
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 min-w-[200px]">
            {isArchived ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReactivate}
                disabled={isReactivating}
                className="w-full"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {isReactivating ? 'Reactivando...' : 'Reactivar'}
              </Button>
            ) : (
              <>
                <div className="text-xs font-medium text-muted-foreground">CAMBIAR ROL:</div>
                <Select
                  defaultValue={user.role}
                  onValueChange={(value) => onRoleChange(user.id, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onArchive}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Archivar
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleManager;
