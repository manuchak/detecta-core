import { Badge } from "@/components/ui/badge";
import { Clock, Users, AlertTriangle, BookOpen } from "lucide-react";
import { LMS_CATEGORIAS, LMS_NIVELES } from "@/types/lms";

interface CursoPreviewCardProps {
  data: {
    titulo?: string;
    descripcion?: string;
    imagen_portada_url?: string;
    categoria?: string;
    nivel?: string;
    duracion_estimada_min?: number;
    es_obligatorio?: boolean;
    roles_objetivo?: string[];
  };
}

export function CursoPreviewCard({ data }: CursoPreviewCardProps) {
  const categoriaLabel = LMS_CATEGORIAS.find(c => c.value === data.categoria)?.label;
  const nivelLabel = LMS_NIVELES.find(n => n.value === data.nivel)?.label || 'Básico';

  const nivelColors: Record<string, string> = {
    basico: 'bg-green-100 text-green-700 border-green-200',
    intermedio: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    avanzado: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden max-w-md mx-auto shadow-sm">
      {/* Image */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        {data.imagen_portada_url ? (
          <img 
            src={data.imagen_portada_url} 
            alt="Portada" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <BookOpen className="w-12 h-12 text-primary/30" />
          </div>
        )}
        
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          {data.es_obligatorio && (
            <Badge className="bg-orange-500 text-white border-0 shadow-sm">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Obligatorio
            </Badge>
          )}
          {categoriaLabel && (
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-sm">
              {categoriaLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h4 className="font-semibold text-foreground line-clamp-2">
            {data.titulo || 'Título del curso'}
          </h4>
          {data.descripcion && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {data.descripcion}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Badge variant="outline" className={nivelColors[data.nivel || 'basico']}>
            {nivelLabel}
          </Badge>
          
          {data.duracion_estimada_min && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {data.duracion_estimada_min} min
            </span>
          )}

          {data.roles_objetivo && data.roles_objetivo.length > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {data.roles_objetivo.length} roles
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
