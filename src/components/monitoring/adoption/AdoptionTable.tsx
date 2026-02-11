import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, MessageCircle, CheckCircle2, XCircle, Minus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustodioAdopcion, FiltroAdopcion } from "@/hooks/useAdopcionDigital";
import { filtrarCustodios } from "@/hooks/useAdopcionDigital";

interface Props {
  custodios: CustodioAdopcion[];
  isLoading: boolean;
  filtro: FiltroAdopcion;
}

const getNivelBadge = (c: CustodioAdopcion) => {
  if (c.tiene_rol_custodio) return <Badge variant="success">Activo</Badge>;
  if (c.tiene_cuenta) return <Badge className="bg-warning/10 text-warning border-transparent">Sin rol</Badge>;
  return <Badge variant="destructive">Sin cuenta</Badge>;
};

const BoolIcon = ({ value }: { value: boolean }) =>
  value ? (
    <CheckCircle2 className="h-4 w-4 text-success" />
  ) : (
    <XCircle className="h-4 w-4 text-destructive" />
  );

const formatFecha = (fecha: string | null) => {
  if (!fecha) return <span className="text-muted-foreground text-xs">Nunca</span>;
  return (
    <span className="text-xs">
      {format(new Date(fecha), "dd MMM yyyy", { locale: es })}
    </span>
  );
};

const AdoptionTable = ({ custodios, isLoading, filtro }: Props) => {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    let result = filtrarCustodios(custodios, filtro);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      result = result.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.telefono.includes(q)
      );
    }
    return result;
  }, [custodios, filtro, busqueda]);

  const handleWhatsApp = (telefono: string, nombre: string) => {
    const msg = encodeURIComponent(
      `Hola ${nombre}, te invitamos a registrarte en el portal de custodios para poder realizar tu checklist diario y crear tickets de soporte.`
    );
    window.open(`https://wa.me/52${telefono}?text=${msg}`, "_blank");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Custodios</CardTitle></CardHeader>
        <CardContent>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Custodios ({filtrados.length})
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-center">Cuenta</TableHead>
                <TableHead className="text-center">Rol</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Último Checklist</TableHead>
                <TableHead>Último Ticket</TableHead>
                <TableHead className="text-center">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron custodios
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">
                      {c.nombre}
                      {c.display_name && (
                        <span className="block text-xs text-muted-foreground">
                          {c.display_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono">{c.telefono}</TableCell>
                    <TableCell className="text-center"><BoolIcon value={c.tiene_cuenta} /></TableCell>
                    <TableCell className="text-center"><BoolIcon value={c.tiene_rol_custodio} /></TableCell>
                    <TableCell>{getNivelBadge(c)}</TableCell>
                    <TableCell>{formatFecha(c.ultimo_checklist)}</TableCell>
                    <TableCell>{formatFecha(c.ultimo_ticket)}</TableCell>
                    <TableCell className="text-center">
                      {!c.tiene_cuenta && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => handleWhatsApp(c.telefono, c.nombre)}
                        >
                          <MessageCircle className="h-3 w-3" />
                          WA
                        </Button>
                      )}
                      {c.tiene_cuenta && !c.tiene_rol_custodio && (
                        <Badge variant="outline" className="text-xs">Asignar rol</Badge>
                      )}
                      {c.tiene_rol_custodio && (
                        <Minus className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdoptionTable;
