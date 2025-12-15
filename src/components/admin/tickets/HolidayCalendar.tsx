import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { Holiday } from '@/hooks/useTicketConfig';
import { format, parseISO, isFuture, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HolidayCalendarProps {
  holidays: Holiday[];
  onUpdate: (id: string, updates: Partial<Holiday>) => Promise<boolean>;
  onCreate: (holiday: Omit<Holiday, 'id'>) => Promise<any>;
  onDelete: (id: string) => Promise<boolean>;
}

export const HolidayCalendar: React.FC<HolidayCalendarProps> = ({
  holidays,
  onUpdate,
  onCreate,
  onDelete
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<string | null>(null);
  const [newHoliday, setNewHoliday] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    nombre: '',
    tipo: 'oficial',
    activo: true,
    factor_ajuste: 0
  });

  const handleCreate = async () => {
    const result = await onCreate(newHoliday);
    if (result) {
      setIsCreating(false);
      setNewHoliday({
        fecha: format(new Date(), 'yyyy-MM-dd'),
        nombre: '',
        tipo: 'oficial',
        activo: true,
        factor_ajuste: 0
      });
    }
  };

  const handleDelete = async () => {
    if (holidayToDelete) {
      await onDelete(holidayToDelete);
      setHolidayToDelete(null);
    }
  };

  // Sort holidays by date
  const sortedHolidays = [...holidays].sort((a, b) => 
    a.fecha.localeCompare(b.fecha)
  );

  const upcomingHolidays = sortedHolidays.filter(h => isFuture(parseISO(h.fecha)));
  const pastHolidays = sortedHolidays.filter(h => isPast(parseISO(h.fecha)));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold">{holidays.length}</div>
          <div className="text-sm text-muted-foreground">Total feriados</div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{upcomingHolidays.length}</div>
          <div className="text-sm text-muted-foreground">Próximos</div>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold">{holidays.filter(h => h.activo).length}</div>
          <div className="text-sm text-muted-foreground">Activos</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar Feriado
        </Button>
      </div>

      {/* Upcoming Holidays */}
      {upcomingHolidays.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Próximos Feriados
          </h3>
          <div className="flex flex-wrap gap-2">
            {upcomingHolidays.slice(0, 5).map(holiday => (
              <Badge key={holiday.id} variant="secondary" className="py-2 px-3">
                <span className="font-medium">{holiday.nombre}</span>
                <span className="text-muted-foreground ml-2">
                  {format(parseISO(holiday.fecha), 'd MMM', { locale: es })}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-center">Activo</TableHead>
              <TableHead className="w-16">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedHolidays.map((holiday) => {
              const date = parseISO(holiday.fecha);
              const isUpcoming = isFuture(date);
              
              return (
                <TableRow key={holiday.id} className={!isUpcoming ? 'opacity-60' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isUpcoming && <div className="w-2 h-2 rounded-full bg-green-500" />}
                      <span className="font-medium">
                        {format(date, "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{holiday.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{holiday.tipo}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={holiday.activo}
                      onCheckedChange={(checked) => onUpdate(holiday.id, { activo: checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setHolidayToDelete(holiday.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Feriado</DialogTitle>
            <DialogDescription>
              Agrega un nuevo día feriado al calendario
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Fecha</Label>
              <Input
                type="date"
                value={newHoliday.fecha}
                onChange={(e) => setNewHoliday({ ...newHoliday, fecha: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Nombre</Label>
              <Input
                value={newHoliday.nombre}
                onChange={(e) => setNewHoliday({ ...newHoliday, nombre: e.target.value })}
                placeholder="Ej: Día de la Independencia"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tipo</Label>
              <Input
                value={newHoliday.tipo}
                onChange={(e) => setNewHoliday({ ...newHoliday, tipo: e.target.value })}
                placeholder="oficial, puente, etc."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newHoliday.nombre}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!holidayToDelete} onOpenChange={() => setHolidayToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar feriado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
