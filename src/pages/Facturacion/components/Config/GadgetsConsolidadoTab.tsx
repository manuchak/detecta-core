import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package } from 'lucide-react';
import { GADGET_TIPOS } from '../../hooks/useClientesGadgets';

interface GadgetWithCliente {
  id: string;
  cliente_id: string;
  tipo: string;
  precio: number;
  incluido_en_tarifa: boolean;
  facturacion: string;
  notas: string | null;
  cliente_nombre: string;
  cobra_gadgets: boolean;
}

export function GadgetsConsolidadoTab() {
  const { data: gadgets = [], isLoading } = useQuery({
    queryKey: ['gadgets-consolidado'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pc_clientes_gadgets')
        .select('id, cliente_id, tipo, precio, incluido_en_tarifa, facturacion, notas, pc_clientes(nombre, cobra_gadgets)')
        .eq('activo', true)
        .order('tipo');

      if (error) throw error;
      return (data || []).map((g: any) => ({
        id: g.id,
        cliente_id: g.cliente_id,
        tipo: g.tipo,
        precio: g.precio,
        incluido_en_tarifa: g.incluido_en_tarifa,
        facturacion: g.facturacion,
        notas: g.notas,
        cliente_nombre: g.pc_clientes?.nombre || '—',
        cobra_gadgets: g.pc_clientes?.cobra_gadgets ?? true,
      })) as GadgetWithCliente[];
    },
    staleTime: 60_000,
  });

  const tipoLabel = (tipo: string) => GADGET_TIPOS.find(t => t.value === tipo)?.label || tipo;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Vista consolidada de gadgets configurados por cliente. Total: <span className="font-medium text-foreground">{gadgets.length}</span>
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Cliente</TableHead>
            <TableHead className="text-xs">Tipo</TableHead>
            <TableHead className="text-xs text-right">Precio</TableHead>
            <TableHead className="text-xs">Facturación</TableHead>
            <TableHead className="text-xs">Cobra</TableHead>
            <TableHead className="text-xs">Notas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gadgets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                No hay gadgets configurados
              </TableCell>
            </TableRow>
          ) : (
            gadgets.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="text-xs font-medium">{g.cliente_nombre}</TableCell>
                <TableCell className="text-xs">{tipoLabel(g.tipo)}</TableCell>
                <TableCell className="text-xs text-right font-mono">
                  {g.incluido_en_tarifa ? (
                    <span className="text-muted-foreground">Incluido</span>
                  ) : (
                    `$${g.precio.toLocaleString()}`
                  )}
                </TableCell>
                <TableCell className="text-xs">{g.facturacion}</TableCell>
                <TableCell>
                  {g.cobra_gadgets ? (
                    <Badge variant="default" className="text-[10px]">Sí</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">No</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{g.notas || '—'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
