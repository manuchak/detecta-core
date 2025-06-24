
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useUserSkills } from '@/hooks/useUserSkills';
import { SKILL_DEFINITIONS, Skill } from '@/types/skillTypes';
import { Search, Shield, Plus, X, User, Settings } from 'lucide-react';

export const SkillsManager = () => {
  const { users } = useUserRoles();
  const { grantSkill, revokeSkill } = useUserSkills();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | ''>('');

  // Agrupar usuarios por email para evitar duplicados
  const uniqueUsers = users?.reduce((acc, user) => {
    const existingUser = acc.find(u => u.email === user.email);
    if (!existingUser) {
      acc.push(user);
    }
    return acc;
  }, [] as typeof users) || [];

  const filteredUsers = uniqueUsers.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGrantSkill = async () => {
    if (!selectedUser || !selectedSkill) return;
    
    try {
      await grantSkill.mutateAsync({
        userId: selectedUser,
        skill: selectedSkill as Skill
      });
      setSelectedSkill('');
    } catch (error) {
      console.error('Error granting skill:', error);
    }
  };

  const handleRevokeSkill = async (userId: string, skill: Skill) => {
    try {
      await revokeSkill.mutateAsync({ userId, skill });
    } catch (error) {
      console.error('Error revoking skill:', error);
    }
  };

  const getSkillDefinition = (skill: Skill) => {
    return SKILL_DEFINITIONS.find(def => def.skill === skill);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Gestión de Skills</h2>
          <p className="text-sm text-muted-foreground">
            Administra permisos específicos por usuario de forma simple
          </p>
        </div>
      </div>

      {/* Quick Grant Section */}
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            Otorgar Nuevo Skill
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuario</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueUsers?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{user.display_name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Skill</label>
              <Select value={selectedSkill} onValueChange={(value) => setSelectedSkill(value as Skill | '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar skill" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_DEFINITIONS.map(def => (
                    <SelectItem key={def.skill} value={def.skill}>
                      <div>
                        <div className="font-medium">{def.name}</div>
                        <div className="text-xs text-muted-foreground">{def.category}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSkill && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-900">
                {getSkillDefinition(selectedSkill as Skill)?.name}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {getSkillDefinition(selectedSkill as Skill)?.description}
              </p>
            </div>
          )}

          <Button 
            onClick={handleGrantSkill}
            disabled={!selectedUser || !selectedSkill || grantSkill.isPending}
            className="w-full"
            size="lg"
          >
            {grantSkill.isPending ? 'Otorgando...' : 'Otorgar Skill'}
          </Button>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usuarios y Sus Skills</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <UserSkillCard 
                key={user.id} 
                user={user} 
                onRevokeSkill={handleRevokeSkill}
                getSkillDefinition={getSkillDefinition}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente simplificado para mostrar skills de cada usuario
const UserSkillCard = ({ 
  user, 
  onRevokeSkill, 
  getSkillDefinition 
}: any) => {
  const { userSkills, isLoading } = useUserSkills(user.id);

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="space-y-1">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Administración': 'bg-red-100 text-red-800 border-red-200',
      'Leads': 'bg-blue-100 text-blue-800 border-blue-200',
      'Instalación': 'bg-green-100 text-green-800 border-green-200',
      'Monitoreo': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Servicios': 'bg-purple-100 text-purple-800 border-purple-200',
      'Dashboard': 'bg-gray-100 text-gray-800 border-gray-200',
      'General': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors['General'];
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{user.display_name}</h4>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <Badge variant="outline" className="text-xs mt-1">
            {user.role}
          </Badge>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Skills activos</div>
          <div className="text-lg font-semibold text-primary">
            {userSkills?.length || 0}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {userSkills && userSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {userSkills.map(userSkill => {
              const definition = getSkillDefinition(userSkill.skill);
              const category = definition?.category || 'General';
              
              return (
                <div key={userSkill.id} className="group flex items-center">
                  <Badge 
                    className={`text-xs border ${getCategoryColor(category)} pr-1`}
                  >
                    <span>{definition?.name || userSkill.skill}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 ml-1 text-current hover:bg-red-100 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRevokeSkill(user.id, userSkill.skill)}
                      title="Revocar skill"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sin skills asignados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsManager;
