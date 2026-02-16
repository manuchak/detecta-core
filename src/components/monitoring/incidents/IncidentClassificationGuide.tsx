import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const COMPARISON_DATA = [
  {
    criterio: 'Violencia',
    robo: 'No',
    asalto: 'Sí — amenaza o fuerza física',
    perdida: 'No aplica',
  },
  {
    criterio: 'Contacto con personal',
    robo: 'No directo',
    asalto: 'Directo / intimidación',
    perdida: 'No aplica',
  },
  {
    criterio: 'Causa',
    robo: 'Acto delictivo sin confrontación',
    asalto: 'Acto delictivo con intimidación',
    perdida: 'Error logístico o daño',
  },
  {
    criterio: 'Evidencia típica',
    robo: 'Sellos rotos, faltante sin testigos',
    asalto: 'Testigos, lesiones, denuncia',
    perdida: 'Discrepancia en conteo, daño visible',
  },
  {
    criterio: 'Severidad usual',
    robo: 'Alta',
    asalto: 'Crítica',
    perdida: 'Baja — Media',
  },
];

export const IncidentClassificationGuide: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-muted/30 mb-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="w-full justify-between h-9 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5" />
          Guía rápida: ¿Robo, Asalto o Pérdida?
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </Button>

      {open && (
        <div className="px-3 pb-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] font-semibold h-8">Criterio</TableHead>
                <TableHead className="text-[10px] font-semibold h-8">🔓 Robo</TableHead>
                <TableHead className="text-[10px] font-semibold h-8">⚠️ Asalto</TableHead>
                <TableHead className="text-[10px] font-semibold h-8">📦 Pérdida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPARISON_DATA.map(row => (
                <TableRow key={row.criterio}>
                  <TableCell className="text-[10px] font-medium py-1.5">{row.criterio}</TableCell>
                  <TableCell className="text-[10px] py-1.5">{row.robo}</TableCell>
                  <TableCell className="text-[10px] py-1.5">{row.asalto}</TableCell>
                  <TableCell className="text-[10px] py-1.5">{row.perdida}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
