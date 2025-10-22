import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SystemChange } from "@/hooks/useVersionControl";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Filter } from "lucide-react";

interface ChangeLogTableProps {
  changes: SystemChange[];
}

const getChangeTypeColor = (type: string) => {
  switch (type) {
    case 'feature':
      return 'bg-success text-success-foreground';
    case 'bugfix':
      return 'bg-warning text-warning-foreground';
    case 'enhancement':
      return 'bg-info text-info-foreground';
    case 'breaking_change':
      return 'bg-destructive text-destructive-foreground';
    case 'security':
      return 'bg-secondary text-secondary-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'critical':
      return 'bg-destructive text-destructive-foreground';
    case 'high':
      return 'bg-warning text-warning-foreground';
    case 'medium':
      return 'bg-info text-info-foreground';
    case 'low':
      return 'bg-success text-success-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const ChangeLogTable = ({ changes }: ChangeLogTableProps) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterImpact, setFilterImpact] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChanges = changes.filter(change => {
    const matchesType = filterType === 'all' || change.change_type === filterType;
    const matchesImpact = filterImpact === 'all' || change.impact_level === filterImpact;
    const matchesSearch = searchTerm === '' || 
      change.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.module.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesImpact && matchesSearch;
  });

  if (changes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay cambios registrados para esta versión
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
        <Filter className="w-4 h-4 text-muted-foreground" />
        
        <Input
          placeholder="Buscar cambios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="bugfix">Bug Fix</SelectItem>
            <SelectItem value="enhancement">Enhancement</SelectItem>
            <SelectItem value="breaking_change">Breaking Change</SelectItem>
            <SelectItem value="security">Security</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterImpact} onValueChange={setFilterImpact}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Impacto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los impactos</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {(filterType !== 'all' || filterImpact !== 'all' || searchTerm) && (
          <Badge variant="secondary">
            {filteredChanges.length} de {changes.length}
          </Badge>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Módulo</TableHead>
            <TableHead>Impacto</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredChanges.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No se encontraron cambios con los filtros aplicados
              </TableCell>
            </TableRow>
          ) : (
            filteredChanges.map((change) => (
            <TableRow key={change.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{change.title}</div>
                  {change.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {change.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getChangeTypeColor(change.change_type)}>
                  {change.change_type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{change.module}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={getImpactColor(change.impact_level)}>
                  {change.impact_level}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(change.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
              </TableCell>
            </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};