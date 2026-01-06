import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLMSAdminCursoDetalle, useLMSActualizarCurso } from "@/hooks/lms/useLMSAdminCursos";
import { LMSCursoForm } from "@/components/lms/admin/LMSCursoForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function LMSAdminCursoEditar() {
  const { cursoId } = useParams<{ cursoId: string }>();
  const navigate = useNavigate();
  
  const { data: curso, isLoading } = useLMSAdminCursoDetalle(cursoId!);
  const updateCurso = useLMSActualizarCurso();

  const handleSubmit = async (data: any) => {
    try {
      await updateCurso.mutateAsync({ id: cursoId!, data });
      toast.success("Curso actualizado exitosamente");
      navigate(`/lms/admin/cursos/${cursoId}`);
    } catch (error) {
      toast.error("Error al actualizar el curso");
    }
  };

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
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Editar Curso</h1>
      </div>

      <LMSCursoForm
        curso={curso}
        onSubmit={handleSubmit}
        isLoading={updateCurso.isPending}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
