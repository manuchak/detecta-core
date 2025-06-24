
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SKILL_DEFINITIONS, Skill } from '@/types/skillTypes';
import { useUserSkills } from '@/hooks/useUserSkills';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Zap, Users, Shield } from 'lucide-react';

export const QuickSkillsPanel = () => {
  const { users } = useUserRoles();
  const { grantSkill } = useUserSkills();
  const [isGranting, setIsGranting] = useState(false);

  // Grupos de skills comunes para asignación rápida
  const skillGroups = [
    {
      name: 'Administrador Completo',
      description: 'Acceso total al sistema',
      skills: ['admin_full_access'],
      color: 'bg-red-100 text-red-800 border-red-200'
    },
    {
      name: 'Gestor de Leads',
      description: 'Manejo completo de candidatos',
      skills: ['dashboard_view', 'leads_management', 'leads_approval'],
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      name: 'Coordinador',
      description: 'Operaciones y monitoreo',
      skills: ['dashboard_view', 'services_manage', 'monitoring_view'],
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    {
      name: 'Solo Lectura',
      description: 'Vista de dashboard únicamente',
      skills: ['dashboard_view'],
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  ];

  const handleQuickGrant = async (userId: string, skills: string[]) => {
    setIsGranting(true);
    try {
      for (const skill of skills) {
        await grantSkill.mutateAsync({
          userId,
          skill: skill as Skill
        });
      }
    } catch (error) {
      console.error('Error granting skills:', error);
    } finally {
      setIsGranting(false);
    }
  };

  const uniqueUsers = users?.reduce((acc, user) => {
    const existingUser = acc.find(u => u.email === user.email);
    if (!existingUser) {
      acc.push(user);
    }
    return acc;
  }, [] as typeof users) || [];

  return (
    <Card className="border-dashed border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Asignación Rápida de Skills
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Asigna grupos de permisos comunes de forma rápida
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {skillGroups.map((group, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">{group.name}</h4>
                <p className="text-sm text-muted-foreground">{group.description}</p>
                <div className="flex flex-wrap gap-1">
                  {group.skills.map(skill => {
                    const definition = SKILL_DEFINITIONS.find(def => def.skill === skill);
                    return (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {definition?.name || skill}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {uniqueUsers?.slice(0, 6).map(user => (
                <Button
                  key={user.id}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-2 text-left"
                  disabled={isGranting}
                  onClick={() => handleQuickGrant(user.id, group.skills)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Users className="h-3 w-3 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">
                        {user.display_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
