import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCSMOptions, useBulkAssignCSM } from '@/hooks/useAssignCSM';
import { type CarteraCliente } from '@/hooks/useCSCartera';
import { Search, Users } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: CarteraCliente[];
}

export function CSBulkAssignByCSMModal({ open, onOpenChange, clientes }: Props) {
  const { data: csmOptions } = useCSMOptions();
  const bulkAssign = useBulkAssignCSM();

  const [selectedCsmId, setSelectedCsmId] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const availableClients = useMemo(() => {
    if (!selectedCsmId) return [];
    let list = clientes.filter(c => c.activo && c.csm_asignado !== selectedCsmId);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(c => c.nombre?.toLowerCase().includes(q) || c.razon_social?.toLowerCase().includes(q));
    }
    return list;
  }, [clientes, selectedCsmId, search]);

  const handleToggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === availableClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableClients.map(c => c.id)));
    }
  };

  const handleAssign = () => {
    if (!selectedCsmId || selectedIds.size === 0) return;
    bulkAssign.mutate({ clienteIds: Array.from(selectedIds), csmId: selectedCsmId }, {
      onSuccess: () => {
        setSelectedCsmId('');
        setSelectedIds(new Set());
        setSearch('');
        onOpenChange(false);
      },
    });
  };

  const handleClose = () => {
    setSelectedCsmId('');
    setSelectedIds(new Set());
    setSearch('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asignar clientes a CSM
          </DialogTitle>
          <DialogDescription>
            Selecciona un CSM y luego elige los clientes que deseas asignarle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Select CSM */}
          <div>
            <label className="text-sm font-medium">1. Seleccionar CSM</label>
            <Select value={selectedCsmId} onValueChange={v => { setSelectedCsmId(v); setSelectedIds(new Set()); }}>
              <SelectTrigger>
                <SelectValue placeholder="Elige un CSM..." />
              </SelectTrigger>
              <SelectContent>
                {csmOptions?.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Select clients */}
          {selectedCsmId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">2. Seleccionar clientes ({availableClients.length} disponibles)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {availableClients.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    checked={selectedIds.size === availableClients.length && availableClients.length > 0}
                    onCheckedChange={handleToggleAll}
                    id="select-all"
                  />
                  <label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer">
                    Seleccionar todos ({availableClients.length})
                  </label>
                </div>
              )}

              <ScrollArea className="h-[240px] border rounded-md">
                <div className="p-2 space-y-1">
                  {availableClients.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {selectedCsmId ? 'No hay clientes disponibles para este CSM' : 'Selecciona un CSM primero'}
                    </p>
                  ) : (
                    availableClients.map(c => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer"
                        onClick={() => handleToggle(c.id)}
                      >
                        <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => handleToggle(c.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.nombre}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.csm_nombre ? `CSM actual: ${c.csm_nombre}` : 'Sin CSM asignado'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedCsmId || selectedIds.size === 0 || bulkAssign.isPending}
          >
            {bulkAssign.isPending ? 'Asignando...' : `Asignar ${selectedIds.size} cliente${selectedIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
