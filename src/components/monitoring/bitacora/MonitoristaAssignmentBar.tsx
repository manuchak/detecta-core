import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Radio } from 'lucide-react';
import { useMonitoristaAssignment } from '@/hooks/useMonitoristaAssignment';

export const MonitoristaAssignmentBar: React.FC = () => {
  const { myAssignments, isLoading } = useMonitoristaAssignment();

  if (isLoading) return null;

  const turno = myAssignments.length > 0 ? myAssignments[0].turno : 'matutino';
  const turnoLabel: Record<string, string> = {
    matutino: 'Matutino',
    vespertino: 'Vespertino',
    nocturno: 'Nocturno',
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card">
      <div className="flex items-center gap-1.5">
        <Radio className="h-3.5 w-3.5 text-chart-2 animate-pulse" />
        <span className="text-xs font-medium">Hoja de Seguimiento</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
          <User className="h-2.5 w-2.5" />
          Turno: {turnoLabel[turno] || turno}
        </Badge>
        {myAssignments.length > 0 && (
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            {myAssignments.length} asignados
          </Badge>
        )}
      </div>
    </div>
  );
};
