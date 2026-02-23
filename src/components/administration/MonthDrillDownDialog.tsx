import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllPaginated } from '@/utils/supabasePagination';
import { CDMX_OFFSET } from '@/utils/cdmxTimezone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Loader2 } from 'lucide-react';

interface MonthDrillDownDialogProps {
  open: boolean;
  year: number;
  month: number;
  excelIds: string[] | null; // null = Excel was aggregated mode (no individual IDs)
  onClose: () => void;
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function MonthDrillDownDialog({ open, year, month, excelIds, onClose }: MonthDrillDownDialogProps) {
  const [loading, setLoading] = useState(true);
  const [systemIds, setSystemIds] = useState<string[]>([]);
  const [onlyExcel, setOnlyExcel] = useState<string[]>([]);
  const [onlySystem, setOnlySystem] = useState<string[]>([]);
  const [inBoth, setInBoth] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00${CDMX_OFFSET}`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00${CDMX_OFFSET}`;

    fetchAllPaginated<{ id_servicio: string | null }>(() =>
      supabase
        .from('servicios_custodia')
        .select('id_servicio')
        .gte('fecha_hora_cita', startDate)
        .lt('fecha_hora_cita', endDate)
    )
      .then((records) => {
        const sysIds = records
          .map(r => r.id_servicio)
          .filter((id): id is string => !!id);
        setSystemIds(sysIds);

        if (excelIds) {
          const sysSet = new Set(sysIds);
          const excelSet = new Set(excelIds);
          setOnlyExcel(excelIds.filter(id => !sysSet.has(id)));
          setOnlySystem(sysIds.filter(id => !excelSet.has(id)));
          setInBoth(excelIds.filter(id => sysSet.has(id)));
        } else {
          setOnlyExcel([]);
          setOnlySystem(sysIds);
          setInBoth([]);
        }
      })
      .catch(() => {
        setSystemIds([]);
        setOnlyExcel([]);
        setOnlySystem([]);
        setInBoth([]);
      })
      .finally(() => setLoading(false));
  }, [open, year, month, excelIds]);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const makeSheet = (ids: string[]) => XLSX.utils.json_to_sheet(ids.map(id => ({ id_servicio: id })));

    if (excelIds) {
      XLSX.utils.book_append_sheet(wb, makeSheet(onlyExcel), 'Solo Excel');
      XLSX.utils.book_append_sheet(wb, makeSheet(onlySystem), 'Solo Sistema');
      XLSX.utils.book_append_sheet(wb, makeSheet(inBoth), 'En Ambos');
    } else {
      XLSX.utils.book_append_sheet(wb, makeSheet(systemIds), 'IDs Sistema');
    }

    XLSX.writeFile(wb, `detalle_${MONTH_LABELS[month - 1]}_${year}.xlsx`);
  };

  const title = `Detalle: ${MONTH_LABELS[month - 1]} ${year}`;

  const IdList = ({ ids }: { ids: string[] }) => (
    <ScrollArea className="h-[350px] rounded-md border p-3">
      {ids.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin registros</p>
      ) : (
        <div className="space-y-1">
          {ids.map((id, i) => (
            <div key={i} className="text-sm font-mono px-2 py-1 rounded hover:bg-muted">
              {id}
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {loading
              ? 'Consultando registros del sistema…'
              : excelIds
                ? `Excel: ${excelIds.length} | Sistema: ${systemIds.length}`
                : `${systemIds.length} registros en sistema (Excel sin IDs individuales)`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : excelIds ? (
          <Tabs defaultValue="only-excel">
            <TabsList className="w-full">
              <TabsTrigger value="only-excel" className="flex-1">
                Solo Excel ({onlyExcel.length})
              </TabsTrigger>
              <TabsTrigger value="only-system" className="flex-1">
                Solo Sistema ({onlySystem.length})
              </TabsTrigger>
              <TabsTrigger value="both" className="flex-1">
                En Ambos ({inBoth.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="only-excel"><IdList ids={onlyExcel} /></TabsContent>
            <TabsContent value="only-system"><IdList ids={onlySystem} /></TabsContent>
            <TabsContent value="both"><IdList ids={inBoth} /></TabsContent>
          </Tabs>
        ) : (
          <IdList ids={systemIds} />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleExport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Detalle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
