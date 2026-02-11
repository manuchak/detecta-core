import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import type { CursoDisponible, LMSCategoria } from "@/types/lms";
import { LMS_CATEGORIAS } from "@/types/lms";

interface CategoryProgressSummaryProps {
  cursos: CursoDisponible[];
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
}

interface CategoryStats {
  key: string;
  label: string;
  total: number;
  completados: number;
  porcentaje: number;
}

export function CategoryProgressSummary({ cursos, selectedCategory, onSelectCategory }: CategoryProgressSummaryProps) {
  const stats = useMemo(() => {
    const grouped = new Map<string, { total: number; completados: number }>();

    // Initialize all categories
    LMS_CATEGORIAS.forEach(cat => {
      grouped.set(cat.value, { total: 0, completados: 0 });
    });

    // Only count enrolled courses
    cursos.filter(c => c.inscripcion_id).forEach(curso => {
      const cat = curso.categoria || 'sin_categoria';
      if (!grouped.has(cat)) {
        grouped.set(cat, { total: 0, completados: 0 });
      }
      const g = grouped.get(cat)!;
      g.total++;
      if (curso.inscripcion_estado === 'completado') g.completados++;
    });

    const result: CategoryStats[] = [];
    grouped.forEach((val, key) => {
      if (val.total === 0) return; // skip empty categories
      const catInfo = LMS_CATEGORIAS.find(c => c.value === key);
      result.push({
        key,
        label: catInfo?.label || key,
        total: val.total,
        completados: val.completados,
        porcentaje: val.total > 0 ? Math.round((val.completados / val.total) * 100) : 0,
      });
    });

    return result;
  }, [cursos]);

  if (stats.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Progreso por Categoría
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Chips de filtro */}
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onSelectCategory(null)}
          >
            Todas
          </Badge>
          {stats.map(s => (
            <Badge
              key={s.key}
              variant={selectedCategory === s.key ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onSelectCategory(selectedCategory === s.key ? null : s.key)}
            >
              {s.label}
            </Badge>
          ))}
        </div>

        {/* Barras de progreso */}
        {stats.map(s => (
          <div
            key={s.key}
            className={cn(
              "flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer",
              selectedCategory === s.key ? "bg-primary/10" : "hover:bg-muted/50"
            )}
            onClick={() => onSelectCategory(selectedCategory === s.key ? null : s.key)}
          >
            <span className="text-sm font-medium w-28 truncate">{s.label}</span>
            <Progress value={s.porcentaje} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground w-24 text-right">
              {s.completados}/{s.total} cursos · {s.porcentaje}%
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
