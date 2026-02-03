/**
 * CatalogoSancionesDialog - Dialog for managing the sanctions catalog
 */

import { useState } from 'react';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCatalogoSanciones, type CatalogoSancion } from '@/hooks/useSanciones';

const categoriaBadgeColors: Record<string, string> = {
  leve: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  moderada: 'bg-warning/10 text-warning border-warning/30',
  grave: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  muy_grave: 'bg-destructive/10 text-destructive border-destructive/30',
};

interface CatalogoSancionesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CatalogoSancionesDialog({ open, onOpenChange }: CatalogoSancionesDialogProps) {
  const { data: catalogo, isLoading } = useCatalogoSanciones();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Catálogo de Sanciones
          </DialogTitle>
          <DialogDescription>
            Tipos de sanciones disponibles para aplicar a operativos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info banner */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            El catálogo de sanciones define los tipos de penalizaciones que pueden aplicarse.
            Cada sanción tiene una categoría, días de suspensión predeterminados y puntos a descontar.
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Días</TableHead>
                  <TableHead className="text-center">Puntos</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Cargando catálogo...
                    </TableCell>
                  </TableRow>
                ) : !catalogo || catalogo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay sanciones en el catálogo
                    </TableCell>
                  </TableRow>
                ) : (
                  catalogo.map((sancion) => (
                    <TableRow key={sancion.id}>
                      <TableCell className="font-mono text-xs">
                        {sancion.codigo}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sancion.nombre}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={categoriaBadgeColors[sancion.categoria]}
                        >
                          {sancion.categoria.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {sancion.dias_suspension_default}
                      </TableCell>
                      <TableCell className="text-center text-destructive">
                        -{sancion.puntos_score_perdidos}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {sancion.descripcion || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="font-medium">Categorías:</span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className={categoriaBadgeColors.leve}>LEVE</Badge>
              Menor impacto
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className={categoriaBadgeColors.moderada}>MODERADA</Badge>
              Impacto medio
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className={categoriaBadgeColors.grave}>GRAVE</Badge>
              Alto impacto
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className={categoriaBadgeColors.muy_grave}>MUY GRAVE</Badge>
              Crítico
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
