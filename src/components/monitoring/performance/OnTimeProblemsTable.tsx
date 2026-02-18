import { ProblemEntry } from '@/hooks/usePerformanceDiario';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  data: ProblemEntry[];
  loading?: boolean;
}

function rateBadgeVariant(rate: number) {
  if (rate >= 90) return 'default';
  if (rate >= 70) return 'secondary';
  return 'destructive';
}

export default function OnTimeProblemsTable({ title, data, loading }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Sin datos suficientes (mín. 2 servicios)
          </p>
        ) : (
          <div className="relative w-full overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Tarde</TableHead>
                  <TableHead className="text-center">% On Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((entry) => (
                  <TableRow key={entry.nombre}>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">
                      {entry.nombre}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {entry.totalServicios}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <span className={cn(entry.late > 0 && 'text-destructive font-medium')}>
                        {entry.late}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={rateBadgeVariant(entry.onTimeRate)}>
                        {entry.onTimeRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
