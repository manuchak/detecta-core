import React, { useMemo, useState } from 'react';
import { HIGHWAY_CORRIDORS } from '@/lib/security/highwayCorridors';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

const riskBadge: Record<string, string> = {
  extremo: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  alto: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medio: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  bajo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export function CorridorRiskTable() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return HIGHWAY_CORRIDORS;
    const q = search.toLowerCase();
    return HIGHWAY_CORRIDORS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar corredor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      <div className="max-h-[400px] overflow-y-auto rounded-md border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur">
            <tr>
              <th className="text-left p-2 font-medium text-muted-foreground">Corredor</th>
              <th className="text-center p-2 font-medium text-muted-foreground">Riesgo</th>
              <th className="text-center p-2 font-medium text-muted-foreground">Eventos/Hex</th>
              <th className="text-center p-2 font-medium text-muted-foreground">Waypoints</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((corridor) => (
              <tr key={corridor.id} className="border-t border-border/50 hover:bg-muted/40 transition-colors">
                <td className="p-2">
                  <span className="font-medium text-foreground">{corridor.name}</span>
                </td>
                <td className="p-2 text-center">
                  <Badge variant="outline" className={cn('text-[10px] px-1.5', riskBadge[corridor.riskLevel] || '')}>
                    {corridor.riskLevel}
                  </Badge>
                </td>
                <td className="p-2 text-center text-muted-foreground">
                  {corridor.avgEventsPerHex.toFixed(1)}
                </td>
                <td className="p-2 text-center text-muted-foreground">
                  {corridor.waypoints.length}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted-foreground text-right">
        {filtered.length} de {HIGHWAY_CORRIDORS.length} corredores
      </p>
    </div>
  );
}
