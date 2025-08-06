
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Phone, Target, Clock, TrendingUp } from "lucide-react";

interface AnalystPerformance {
  analyst_name: string;
  leads_assigned: number;
  calls_made: number;
  contacts_made: number;
  conversion_rate: number;
  avg_response_time_hours: number;
}

interface AnalystPerformanceTableProps {
  data: AnalystPerformance[];
  loading: boolean;
}

export const AnalystPerformanceTable = ({ data, loading }: AnalystPerformanceTableProps) => {
  if (loading) {
    return (
      <Card className="col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Performance por Analista</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getConversionRateColor = (rate: number) => {
    if (rate >= 30) return "bg-green-50 text-green-600";
    if (rate >= 20) return "bg-yellow-50 text-yellow-600";
    return "bg-red-50 text-red-600";
  };

  const getResponseTimeColor = (hours: number) => {
    if (hours <= 2) return "text-green-600";
    if (hours <= 8) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Performance por Analista</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay datos de performance disponibles
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Analista</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Target className="h-4 w-4" />
                      Asignados
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Phone className="h-4 w-4" />
                      Llamadas
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Contactados
                    </div>
                  </TableHead>
                  <TableHead className="text-center">Conversión</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4" />
                      T. Respuesta
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((analyst, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {analyst.analyst_name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-600">
                        {analyst.leads_assigned}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-purple-50 text-purple-600">
                        {analyst.calls_made}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-600">
                        {analyst.contacts_made}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={getConversionRateColor(analyst.conversion_rate)}
                      >
                        {analyst.conversion_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-medium ${getResponseTimeColor(analyst.avg_response_time_hours)}`}>
                        {analyst.avg_response_time_hours}h
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Analistas Activos</p>
                <p className="text-xl font-bold text-blue-600">{data.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Promedio Leads</p>
                <p className="text-xl font-bold text-green-600">
                  {data.length > 0 ? Math.round(data.reduce((sum, a) => sum + a.leads_assigned, 0) / data.length) : 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Promedio Llamadas</p>
                <p className="text-xl font-bold text-purple-600">
                  {data.length > 0 ? Math.round(data.reduce((sum, a) => sum + a.calls_made, 0) / data.length) : 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Conversión Promedio</p>
                <p className="text-xl font-bold text-orange-600">
                  {data.length > 0 ? Math.round(data.reduce((sum, a) => sum + a.conversion_rate, 0) / data.length) : 0}%
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
