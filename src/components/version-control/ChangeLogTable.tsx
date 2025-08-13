import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SystemChange } from "@/hooks/useVersionControl";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  if (changes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay cambios registrados para esta versión
      </div>
    );
  }

  return (
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
          {changes.map((change) => (
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};