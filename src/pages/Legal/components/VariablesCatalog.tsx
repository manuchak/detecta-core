import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePlantillasLegal } from '@/hooks/useLegalTemplates';

// Variable source mapping
const VARIABLE_SOURCES: Record<string, { source: string; description: string }> = {
  nombre_completo: { source: 'candidatos_custodios', description: 'Nombre completo del custodio' },
  curp: { source: 'candidatos_custodios', description: 'CURP del custodio' },
  direccion: { source: 'candidatos_custodios', description: 'Dirección completa' },
  fecha_actual: { source: 'sistema', description: 'Fecha actual formateada' },
  fecha_contratacion: { source: 'sistema', description: 'Fecha de contratación' },
  email_custodio: { source: 'candidatos_custodios', description: 'Email del custodio' },
  telefono: { source: 'candidatos_custodios', description: 'Teléfono de contacto' },
  numero_licencia: { source: 'candidatos_custodios (OCR)', description: 'Número de licencia de conducir' },
  licencia_expedida_por: { source: 'candidatos_custodios (OCR)', description: 'Estado que expidió la licencia' },
  marca_vehiculo: { source: 'candidatos_custodios (OCR)', description: 'Marca del vehículo' },
  modelo_vehiculo: { source: 'candidatos_custodios (OCR)', description: 'Modelo y año del vehículo' },
  numero_serie: { source: 'candidatos_custodios (OCR)', description: 'Número de serie vehicular' },
  placas: { source: 'candidatos_custodios (OCR)', description: 'Placas del vehículo' },
  color_vehiculo: { source: 'candidatos_custodios (OCR)', description: 'Color del vehículo' },
  numero_motor: { source: 'candidatos_custodios (OCR)', description: 'Número de motor' },
  clave_vehicular: { source: 'candidatos_custodios (OCR)', description: 'Clave vehicular' },
  verificacion_vehicular: { source: 'candidatos_custodios (OCR)', description: 'Verificación vehicular' },
  tarjeta_circulacion: { source: 'candidatos_custodios (OCR)', description: 'Tarjeta de circulación' },
  numero_factura: { source: 'candidatos_custodios (OCR)', description: 'Número de factura del vehículo' },
  fecha_factura: { source: 'candidatos_custodios (OCR)', description: 'Fecha de la factura' },
  factura_emitida_a: { source: 'candidatos_custodios (OCR)', description: 'A quién fue emitida la factura' },
  numero_poliza: { source: 'candidatos_custodios (OCR)', description: 'Número de póliza de seguro' },
  aseguradora: { source: 'candidatos_custodios (OCR)', description: 'Compañía aseguradora' },
  fecha_poliza: { source: 'candidatos_custodios (OCR)', description: 'Fecha de la póliza' },
  poliza_emitida_a: { source: 'candidatos_custodios (OCR)', description: 'A quién fue emitida la póliza' },
  tipo_poliza: { source: 'candidatos_custodios (OCR)', description: 'Tipo de póliza de seguro' },
  banco: { source: 'candidatos_custodios', description: 'Banco del custodio' },
  numero_cuenta: { source: 'candidatos_custodios', description: 'Número de cuenta bancaria' },
  clabe: { source: 'candidatos_custodios', description: 'CLABE interbancaria' },
  beneficiario: { source: 'candidatos_custodios', description: 'Beneficiario de la cuenta' },
  nombre_propietario_vehiculo: { source: 'candidatos_custodios', description: 'Propietario del vehículo (no propietario)' },
  nombre_analista: { source: 'profiles', description: 'Nombre del analista que gestiona' },
  email_analista: { source: 'profiles', description: 'Email del analista' },
};

const SOURCE_COLORS: Record<string, string> = {
  'candidatos_custodios': 'bg-blue-50 text-blue-700',
  'candidatos_custodios (OCR)': 'bg-violet-50 text-violet-700',
  'sistema': 'bg-emerald-50 text-emerald-700',
  'profiles': 'bg-amber-50 text-amber-700',
};

const VariablesCatalog = () => {
  const { data: plantillas } = usePlantillasLegal();

  // Map variables to the templates that use them
  const variableUsage = useMemo(() => {
    const usage: Record<string, string[]> = {};
    (plantillas || []).forEach((p) => {
      (p.variables_requeridas || []).forEach((v) => {
        if (!usage[v]) usage[v] = [];
        usage[v].push(p.nombre);
      });
    });
    return usage;
  }, [plantillas]);

  const allVars = Object.keys(VARIABLE_SOURCES);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Catálogo de todas las variables de interpolación disponibles para plantillas legales
      </p>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead>Usado en</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allVars.map((varName) => {
                const info = VARIABLE_SOURCES[varName];
                const usedIn = variableUsage[varName] || [];
                return (
                  <TableRow key={varName}>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {`{{${varName}}}`}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">{info.description}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs border-0 ${SOURCE_COLORS[info.source] || 'bg-muted text-muted-foreground'}`}
                      >
                        {info.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {usedIn.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {usedIn.map((name) => (
                            <Badge key={name} variant="secondary" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default VariablesCatalog;
