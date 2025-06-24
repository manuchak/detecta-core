
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useUserSkills } from '@/hooks/useUserSkills';
import { SKILL_DEFINITIONS, Skill } from '@/types/skillTypes';
import { Search, Shield, Plus, X } from 'lucide-react';

export const SkillsManager = () => {
  const { users } = useUserRoles();
  const { grantSkill, revokeSkill } = useUserSkills();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

  const getSkillCategory = (skill: Skill) => {
    const definition = getSkillDefinition(skill);
    return definition?.category || 'General';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Administración': 'bg-red-100 text-red-800',
      'Leads': 'bg-blue-100 text-blue-800',
      'Instalación': 'bg-green-100 text-green-800',
      'Monitoreo': 'bg-yellow-100 text-yellow-800',
      'Servicios': 'bg-purple-100 text-purple-800',
      'Dashboard': 'bg-gray-100 text-gray-800',
      'General': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors['General'];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Gestión de Skills</h2>
          <p className="text-sm text-gray-600">
            Control granular de permisos por usuario
          </p>
        </div>
      </div>

      {/* Otorgar Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Otorgar Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Usuario</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.display_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Skill</label>
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar skill" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_DEFINITIONS.map(def => (
                    <SelectItem key={def.skill} value={def.skill}>
                      {def.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleGrantSkill}
                disabled={!selectedUser || !selectedSkill || grantSkill.isPending}
                className="w-full"
              >
                Otorgar Skill
              </Button>
            </div>
          </div>

          {selectedSkill && (
            <div className="p-3 bg-blue-50 rounded-lg border">
              <p className="text-sm">
                <strong>{getSkillDefinition(selectedSkill as Skill)?.name}</strong>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {getSkillDefinition(selectedSkill as Skill)?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Usuarios y Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills por Usuario</CardTitle>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredUsers.map(user => (
              <UserSkillsCard 
                key={user.id} 
                user={user} 
                onRevokeSkill={handleRevokeSkill}
                getSkillDefinition={getSkillDefinition}
                getCategoryColor={getCategoryColor}
                getSkillCategory={getSkillCategory}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente separado para mostrar skills de cada usuario
const UserSkillsCard = ({ 
  user, 
  onRevokeSkill, 
  getSkillDefinition, 
  getCategoryColor, 
  getSkillCategory 
}: any) => {
  const { userSkills } = useUserSkills(user.id);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium">{user.display_name}</h4>
          <p className="text-sm text-gray-600">{user.email}</p>
          <Badge variant="outline" className="text-xs mt-1">
            {user.role}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700">Skills activos:</h5>
        {userSkills && userSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {userSkills.map(userSkill => (
              <div key={userSkill.id} className="flex items-center gap-1">
                <Badge 
                  className={`text-xs ${getCategoryColor(getSkillCategory(userSkill.skill))}`}
                >
                  {getSkillDefinition(userSkill.skill)?.name || userSkill.skill}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onRevokeSkill(user.id, userSkill.skill)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Sin skills asignados</p>
        )}
      </div>
    </div>
  );
};

export default SkillsManager;
