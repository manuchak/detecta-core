import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import type { CandidatoCustodio, ZonaOperacion } from '@/hooks/useNationalRecruitment';

interface CandidatesPipelineProps {
  candidatos: CandidatoCustodio[];
  zonas: ZonaOperacion[];
  loading: boolean;
}

export const CandidatesPipeline: React.FC<CandidatesPipelineProps> = ({ candidatos, loading }) => {
  if (loading) {
    return <Card className="p-6"><div>Cargando pipeline...</div></Card>;
  }

  const estadosCount = candidatos.reduce((acc, c) => {
    const estado = c.estado_proceso || 'lead';
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Pipeline de Candidatos</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(estadosCount).map(([estado, count]) => (
          <Card key={estado} className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <div>
                <p className="text-sm text-muted-foreground">{estado}</p>
                <p className="text-lg font-semibold">{count}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Candidatos Recientes</h3>
        <div className="space-y-2">
          {candidatos.slice(0, 10).map((candidato) => (
            <div key={candidato.id} className="flex justify-between items-center p-2 border rounded">
              <div>
                <p className="font-medium">{candidato.nombre}</p>
                <p className="text-sm text-muted-foreground">{candidato.telefono}</p>
              </div>
              <Badge variant="outline">{candidato.estado_proceso}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};