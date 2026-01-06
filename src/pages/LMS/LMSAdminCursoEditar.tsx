import { useParams, useNavigate } from "react-router-dom";
import { useLMSAdminCursoDetalle } from "@/hooks/lms/useLMSAdminCursos";
import { LMSCursoForm } from "@/components/lms/admin/LMSCursoForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function LMSAdminCursoEditar() {
  const { cursoId } = useParams<{ cursoId: string }>();
  const navigate = useNavigate();
  
  const { data: curso, isLoading } = useLMSAdminCursoDetalle(cursoId!);

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="container max-w-3xl py-8">
        <p className="text-muted-foreground">Curso no encontrado</p>
        <Button variant="link" onClick={() => navigate('/lms/admin')}>
          Volver al panel
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <LMSCursoForm
        curso={curso}
        onBack={() => navigate(-1)}
        onSuccess={() => navigate(`/lms/admin/cursos/${cursoId}`)}
      />
    </div>
  );
}
