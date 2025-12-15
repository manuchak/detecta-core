import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/hooks/useTicketMetrics';
import { Star } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AgentPerformanceTableProps {
  data: {
    agent_id: string;
    nombre: string;
    assigned: number;
    resolved: number;
    avgResponse: number;
    avgResolution: number;
    slaCompliance: number;
    avgCsat: number;
  }[];
}

export const AgentPerformanceTable: React.FC<AgentPerformanceTableProps> = ({ data }) => {
  const getSLABadgeVariant = (rate: number) => {
    if (rate >= 90) return 'default';
    if (rate >= 70) return 'secondary';
    return 'destructive';
  };

  const getCSATColor = (csat: number) => {
    if (csat >= 4) return 'text-green-600';
    if (csat >= 3) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agente</TableHead>
            <TableHead className="text-center">Asignados</TableHead>
            <TableHead className="text-center">Resueltos</TableHead>
            <TableHead className="text-center">Tiempo Respuesta</TableHead>
            <TableHead className="text-center">Tiempo Resolución</TableHead>
            <TableHead className="text-center">Cumplimiento SLA</TableHead>
            <TableHead className="text-center">CSAT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((agent, index) => (
            <TableRow key={agent.agent_id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium">{agent.nombre}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">{agent.assigned}</TableCell>
              <TableCell className="text-center">
                <span className="text-green-600">{agent.resolved}</span>
                <span className="text-muted-foreground text-xs ml-1">
                  ({agent.assigned > 0 ? Math.round((agent.resolved / agent.assigned) * 100) : 0}%)
                </span>
              </TableCell>
              <TableCell className="text-center">
                {formatDuration(agent.avgResponse)}
              </TableCell>
              <TableCell className="text-center">
                {formatDuration(agent.avgResolution)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={getSLABadgeVariant(agent.slaCompliance)}>
                  {Math.round(agent.slaCompliance)}%
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {agent.avgCsat > 0 ? (
                  <div className={`flex items-center justify-center gap-1 ${getCSATColor(agent.avgCsat)}`}>
                    <Star className="h-4 w-4 fill-current" />
                    {agent.avgCsat.toFixed(1)}
                  </div>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No hay datos de agentes para el período seleccionado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
