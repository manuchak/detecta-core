import { useParams, useNavigate } from "react-router-dom";
import { useLMSAdminCursoDetalle } from "@/hooks/lms/useLMSAdminCursos";
import { LMSCursoEditor } from "@/components/lms/admin/LMSCursoEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function LMSAdminCursoEditar() {
  const { cursoId } = useParams<{ cursoId: string }>();
  const navigate = useNavigate();
  
  const { data: curso, isLoading } = useLMSAdminCursoDetalle(cursoId!);

  if (isLoading) {
    return (
      <div className="container max-w-5xl py-8 space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="container max-w-5xl py-8">
        <p className="text-muted-foreground">Curso no encontrado</p>
        <Button variant="link" onClick={() => navigate('/lms/admin')}>
          Volver al panel
        </Button>
      </div>
    );
  }

  return (
    <LMSCursoEditor
      curso={curso}
      onBack={() => navigate(-1)}
      onSuccess={() => navigate(`/lms/admin/cursos/${cursoId}`)}
    />
  );
}
