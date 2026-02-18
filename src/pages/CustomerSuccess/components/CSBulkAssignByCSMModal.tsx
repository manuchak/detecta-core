import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCSMOptions, useBulkAssignCSM } from '@/hooks/useAssignCSM';
import { type CarteraCliente } from '@/hooks/useCSCartera';
import { Search, Users, UserCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: CarteraCliente[];
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function CSBulkAssignByCSMModal({ open, onOpenChange, clientes }: Props) {
  const { data: csmOptions } = useCSMOptions();
  const bulkAssign = useBulkAssignCSM();

  const [selectedCsmId, setSelectedCsmId] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  // Count how many active clients each CSM currently has
  const csmClientCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    clientes.forEach(c => {
      if (c.activo && c.csm_asignado) {
        counts[c.csm_asignado] = (counts[c.csm_asignado] || 0) + 1;
      }
    });
    return counts;
  }, [clientes]);

  const availableClients = useMemo(() => {
    if (!selectedCsmId) return [];
    let list = clientes.filter(c => c.activo && c.csm_asignado !== selectedCsmId);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(c => c.nombre?.toLowerCase().includes(q) || c.razon_social?.toLowerCase().includes(q));
    }
    return list;
  }, [clientes, selectedCsmId, search]);

  const selectedCsmName = csmOptions?.find(o => o.id === selectedCsmId)?.display_name;

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
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Asignar clientes a CSM
          </DialogTitle>
          <DialogDescription>
            Selecciona un CSM y luego elige los clientes que deseas asignarle.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[380px] max-h-[60vh]">
          {/* Left panel – CSM list */}
          <div className="w-[220px] border-r flex flex-col bg-muted/30">
            <div className="px-3 py-2 border-b">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CSMs</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-0.5">
                {csmOptions?.map(o => {
                  const count = csmClientCounts[o.id] || 0;
                  const isSelected = selectedCsmId === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => { setSelectedCsmId(o.id); setSelectedIds(new Set()); }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                          : 'hover:bg-accent text-foreground'
                      )}
                    >
                      <Avatar className="h-7 w-7 text-[10px]">
                        <AvatarFallback className={cn(
                          'text-[10px] font-semibold',
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}>
                          {getInitials(o.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate leading-tight">{o.display_name}</p>
                        <p className="text-[11px] text-muted-foreground">{count} cliente{count !== 1 ? 's' : ''}</p>
                      </div>
                      {isSelected && <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
                {(!csmOptions || csmOptions.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-6 px-2">
                    No hay CSMs con rol activo
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right panel – Client list */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedCsmId ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <ArrowRight className="h-8 w-8 mx-auto opacity-30" />
                  <p className="text-sm">Selecciona un CSM para ver los clientes disponibles</p>
                </div>
              </div>
            ) : (
              <>
                <div className="px-4 py-2.5 border-b space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Clientes disponibles
                    </p>
                    <Badge variant="outline" className="text-[11px]">
                      {availableClients.length}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>

                {availableClients.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-1.5 border-b bg-muted/20">
                    <Checkbox
                      checked={selectedIds.size === availableClients.length && availableClients.length > 0}
                      onCheckedChange={handleToggleAll}
                      id="select-all"
                    />
                    <label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer select-none">
                      Seleccionar todos
                    </label>
                  </div>
                )}

                <ScrollArea className="flex-1">
                  <div className="p-1.5 space-y-0.5">
                    {availableClients.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No hay clientes disponibles
                      </p>
                    ) : (
                      availableClients.map(c => (
                        <div
                          key={c.id}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-colors',
                            selectedIds.has(c.id) ? 'bg-primary/5' : 'hover:bg-accent/50'
                          )}
                          onClick={() => handleToggle(c.id)}
                        >
                          <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => handleToggle(c.id)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{c.nombre}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {c.csm_nombre ? `CSM actual: ${c.csm_nombre}` : 'Sin CSM asignado'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <DialogFooter className="px-6 py-3 border-t bg-muted/20 flex-row items-center justify-between sm:justify-between">
          <div className="text-sm text-muted-foreground truncate">
            {selectedCsmId && selectedCsmName ? (
              <span>
                <span className="font-medium text-foreground">{selectedCsmName}</span>
                {selectedIds.size > 0 && (
                  <span> · {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}</span>
                )}
              </span>
            ) : (
              <span>Ningún CSM seleccionado</span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>
            <Button
              size="sm"
              onClick={handleAssign}
              disabled={!selectedCsmId || selectedIds.size === 0 || bulkAssign.isPending}
            >
              {bulkAssign.isPending
                ? 'Asignando...'
                : `Asignar ${selectedIds.size || ''} cliente${selectedIds.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
