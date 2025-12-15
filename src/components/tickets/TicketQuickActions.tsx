import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreHorizontal, Play, CheckCircle, XCircle,
  UserPlus, ArrowUpCircle, Copy, MessageSquare
} from 'lucide-react';
import { TicketEnhanced } from '@/hooks/useTicketsEnhanced';
import { cn } from '@/lib/utils';

interface TicketQuickActionsProps {
  ticket: TicketEnhanced;
  agents?: Array<{ id: string; display_name: string }>;
  onStatusChange: (status: TicketEnhanced['status']) => void;
  onAssign: (userId: string | null) => void;
  onEscalate?: () => void;
  onAddInternalNote?: (note: string) => void;
}

export const TicketQuickActions = ({
  ticket,
  agents = [],
  onStatusChange,
  onAssign,
  onEscalate,
  onAddInternalNote
}: TicketQuickActionsProps) => {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [internalNote, setInternalNote] = useState('');

  const handleAssign = () => {
    if (selectedAgent) {
      onAssign(selectedAgent === 'unassign' ? null : selectedAgent);
      setShowAssignDialog(false);
      setSelectedAgent('');
    }
  };

  const handleAddNote = () => {
    if (internalNote.trim() && onAddInternalNote) {
      onAddInternalNote(internalNote);
      setShowNoteDialog(false);
      setInternalNote('');
    }
  };

  const copyTicketNumber = () => {
    navigator.clipboard.writeText(ticket.ticket_number);
  };

  const isActive = !['resuelto', 'cerrado'].includes(ticket.status);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={copyTicketNumber}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar número
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {ticket.status === 'abierto' && (
            <DropdownMenuItem onClick={() => onStatusChange('en_progreso')}>
              <Play className="h-4 w-4 mr-2 text-blue-600" />
              Marcar en progreso
            </DropdownMenuItem>
          )}
          
          {isActive && (
            <DropdownMenuItem onClick={() => onStatusChange('resuelto')}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Marcar resuelto
            </DropdownMenuItem>
          )}
          
          {ticket.status !== 'cerrado' && (
            <DropdownMenuItem 
              onClick={() => onStatusChange('cerrado')}
              className="text-destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cerrar ticket
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowAssignDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Asignar/Reasignar
          </DropdownMenuItem>
          
          {onEscalate && isActive && (
            <DropdownMenuItem onClick={onEscalate}>
              <ArrowUpCircle className="h-4 w-4 mr-2 text-orange-600" />
              Escalar ticket
            </DropdownMenuItem>
          )}
          
          {onAddInternalNote && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowNoteDialog(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Agregar nota interna
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Ticket</DialogTitle>
            <DialogDescription>
              Selecciona un agente para asignar el ticket {ticket.ticket_number}
            </DialogDescription>
          </DialogHeader>
          
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar agente..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassign">Sin asignar</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssign} disabled={!selectedAgent}>
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Internal Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nota Interna</DialogTitle>
            <DialogDescription>
              Esta nota solo será visible para los agentes, no para el custodio.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="Escribe tu nota interna..."
            value={internalNote}
            onChange={e => setInternalNote(e.target.value)}
            rows={4}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddNote} disabled={!internalNote.trim()}>
              Agregar Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TicketQuickActions;
