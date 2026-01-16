import { useState, useEffect } from 'react';
import { 
  useBusinessTargets, 
  useUpdateBusinessTarget,
  getMonthName,
  type BusinessTarget 
} from '@/hooks/useBusinessTargets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Save, RefreshCw, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface EditableTarget extends BusinessTarget {
  isDirty: boolean;
}

const BusinessTargetsManager = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [editableTargets, setEditableTargets] = useState<EditableTarget[]>([]);
  
  const { data: targets, isLoading, refetch } = useBusinessTargets(selectedYear);
  const updateTarget = useUpdateBusinessTarget();

  useEffect(() => {
    if (targets) {
      setEditableTargets(targets.map(t => ({ ...t, isDirty: false })));
    }
  }, [targets]);

  const handleInputChange = (
    targetId: string, 
    field: keyof BusinessTarget, 
    value: string
  ) => {
    setEditableTargets(prev => 
      prev.map(t => {
        if (t.id !== targetId) return t;
        
        const numValue = parseFloat(value) || 0;
        return {
          ...t,
          [field]: numValue,
          isDirty: true,
        };
      })
    );
  };

  const handleSave = async (target: EditableTarget) => {
    await updateTarget.mutateAsync({
      id: target.id,
      target_services: target.target_services,
      target_gmv: target.target_gmv,
      target_aov: target.target_aov,
      target_active_custodians: target.target_active_custodians,
    });
    
    setEditableTargets(prev =>
      prev.map(t => t.id === target.id ? { ...t, isDirty: false } : t)
    );
  };

  const handleSaveAll = async () => {
    const dirtyTargets = editableTargets.filter(t => t.isDirty);
    if (dirtyTargets.length === 0) {
      toast.info('No hay cambios pendientes');
      return;
    }

    for (const target of dirtyTargets) {
      await handleSave(target);
    }
    
    toast.success(`${dirtyTargets.length} metas actualizadas`);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${Math.round(value / 1000)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const dirtyCount = editableTargets.filter(t => t.isDirty).length;
  const currentMonth = new Date().getMonth() + 1;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {dirtyCount > 0 && (
            <Badge variant="secondary">
              {dirtyCount} cambio{dirtyCount !== 1 ? 's' : ''} pendiente{dirtyCount !== 1 ? 's' : ''}
            </Badge>
          )}
          <Button 
            onClick={handleSaveAll} 
            disabled={dirtyCount === 0 || updateTarget.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Todo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Servicios Anuales</span>
          </div>
          <p className="text-2xl font-bold">
            {editableTargets.reduce((sum, t) => sum + t.target_services, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">GMV Anual</span>
          </div>
          <p className="text-2xl font-bold">
            {formatCurrency(editableTargets.reduce((sum, t) => sum + t.target_gmv, 0))}
          </p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Custodios Máx</span>
          </div>
          <p className="text-2xl font-bold">
            {Math.max(...editableTargets.map(t => t.target_active_custodians || 0))}
          </p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">AOV Promedio</span>
          </div>
          <p className="text-2xl font-bold">
            ${Math.round(editableTargets.reduce((sum, t) => sum + t.target_aov, 0) / 12).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Mes</TableHead>
              <TableHead className="text-right">Servicios</TableHead>
              <TableHead className="text-right">GMV ($)</TableHead>
              <TableHead className="text-right">AOV ($)</TableHead>
              <TableHead className="text-right">Custodios Activos</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editableTargets.map((target) => {
              const isCurrentMonth = selectedYear === currentYear && target.month === currentMonth;
              
              return (
                <TableRow 
                  key={target.id}
                  className={isCurrentMonth ? 'bg-primary/5' : undefined}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getMonthName(target.month)}</span>
                      {isCurrentMonth && (
                        <Badge variant="outline" className="text-xs">Actual</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={target.target_services}
                      onChange={(e) => handleInputChange(target.id, 'target_services', e.target.value)}
                      className="w-24 ml-auto text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={target.target_gmv}
                      onChange={(e) => handleInputChange(target.id, 'target_gmv', e.target.value)}
                      className="w-32 ml-auto text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={target.target_aov}
                      onChange={(e) => handleInputChange(target.id, 'target_aov', e.target.value)}
                      className="w-24 ml-auto text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={target.target_active_custodians || ''}
                      onChange={(e) => handleInputChange(target.id, 'target_active_custodians', e.target.value)}
                      className="w-20 ml-auto text-right"
                    />
                  </TableCell>
                  <TableCell>
                    {target.isDirty && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSave(target)}
                        disabled={updateTarget.isPending}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {editableTargets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay metas configuradas para {selectedYear}
        </div>
      )}
    </div>
  );
};

export default BusinessTargetsManager;
