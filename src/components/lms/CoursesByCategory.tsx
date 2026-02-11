import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CourseCard } from "./CourseCard";
import { LMS_CATEGORIAS } from "@/types/lms";
import type { CursoDisponible } from "@/types/lms";
import { differenceInDays, parseISO } from "date-fns";

interface CoursesByCategoryProps {
  cursos: CursoDisponible[];
  onStartCourse: (cursoId: string) => void;
  onEnroll?: (cursoId: string) => void;
  isEnrolling?: boolean;
  filterCategory?: string | null;
}

function getPriority(curso: CursoDisponible): number {
  const estado = curso.inscripcion_estado;
  const diasRestantes = curso.inscripcion_fecha_limite
    ? differenceInDays(parseISO(curso.inscripcion_fecha_limite), new Date())
    : null;

  if (estado === 'vencido' || (diasRestantes !== null && diasRestantes < 0 && estado !== 'completado')) return 0;
  if (diasRestantes !== null && diasRestantes <= 3 && diasRestantes >= 0 && estado !== 'completado') return 1;
  if (estado === 'en_progreso') return 2;
  if (estado === 'inscrito') return 3;
  if (estado === 'completado') return 5;
  return 4;
}

function hasUrgentCourses(cursos: CursoDisponible[]): boolean {
  return cursos.some(c => {
    if (c.inscripcion_estado === 'completado') return false;
    if (c.inscripcion_estado === 'vencido') return true;
    if (c.inscripcion_fecha_limite) {
      const dias = differenceInDays(parseISO(c.inscripcion_fecha_limite), new Date());
      return dias < 0;
    }
    return false;
  });
}

interface CategoryGroup {
  key: string;
  label: string;
  cursos: CursoDisponible[];
  completados: number;
  total: number;
  allDone: boolean;
  hasUrgent: boolean;
}

export function CoursesByCategory({ cursos, onStartCourse, onEnroll, isEnrolling, filterCategory }: CoursesByCategoryProps) {
  const groups = useMemo(() => {
    const filtered = filterCategory ? cursos.filter(c => c.categoria === filterCategory) : cursos;
    const map = new Map<string, CursoDisponible[]>();

    filtered.forEach(curso => {
      const cat = curso.categoria || 'sin_categoria';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(curso);
    });

    const result: CategoryGroup[] = [];
    const orderedKeys = [...LMS_CATEGORIAS.map(c => c.value as string)];
    map.forEach((_, key) => { if (!orderedKeys.includes(key)) orderedKeys.push(key); });

    orderedKeys.forEach(key => {
      const items = map.get(key);
      if (!items || items.length === 0) return;
      items.sort((a, b) => getPriority(a) - getPriority(b));
      const completados = items.filter(c => c.inscripcion_estado === 'completado').length;
      const catInfo = LMS_CATEGORIAS.find(c => c.value === key);
      result.push({
        key,
        label: catInfo?.label || key,
        cursos: items,
        completados,
        total: items.length,
        allDone: completados === items.length,
        hasUrgent: hasUrgentCourses(items),
      });
    });

    result.sort((a, b) => (a.allDone ? 1 : 0) - (b.allDone ? 1 : 0));
    return result;
  }, [cursos, filterCategory]);

  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  const isOpen = (key: string, allDone: boolean) => {
    if (key in openStates) return openStates[key];
    return !allDone;
  };

  const toggle = (key: string) => {
    setOpenStates(prev => ({ ...prev, [key]: !isOpen(key, false) }));
  };

  if (groups.length === 0) return null;

  if (groups.length === 1) {
    const g = groups[0];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{g.label}</h3>
          {g.hasUrgent && <AlertTriangle className="h-4 w-4 text-destructive" />}
          <Badge variant="outline" className="text-xs">{g.completados}/{g.total}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {g.cursos.map(curso => (
            <CourseCard key={curso.id} curso={curso} onStartCourse={onStartCourse} onEnroll={onEnroll} isEnrolling={isEnrolling} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(g => {
        const pct = g.total > 0 ? Math.round((g.completados / g.total) * 100) : 0;
        const open = isOpen(g.key, g.allDone);

        return (
          <Collapsible key={g.key} open={open} onOpenChange={() => toggle(g.key)}>
            <CollapsibleTrigger className="w-full">
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                "hover:bg-muted/50 border border-border/50",
                g.allDone && "opacity-70",
                g.hasUrgent && "border-destructive/50 bg-destructive/5"
              )}>
                {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                {g.hasUrgent && <AlertTriangle className="h-4 w-4 text-destructive" />}
                <span className="font-semibold text-sm">{g.label}</span>
                <Badge variant="outline" className="text-xs">{g.completados}/{g.total}</Badge>
                <Progress value={pct} className="h-1.5 flex-1 max-w-[120px]" />
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4 pb-2">
                {g.cursos.map(curso => (
                  <CourseCard key={curso.id} curso={curso} onStartCourse={onStartCourse} onEnroll={onEnroll} isEnrolling={isEnrolling} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
