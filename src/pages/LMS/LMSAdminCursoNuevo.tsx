import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLMSCrearCurso } from "@/hooks/lms/useLMSAdminCursos";
import { LMSCursoForm } from "@/components/lms/admin/LMSCursoForm";
import { toast } from "sonner";

export default function LMSAdminCursoNuevo() {
  const navigate = useNavigate();
  const createCurso = useLMSCrearCurso();

  const handleSubmit = async (data: any) => {
    try {
      const nuevoCurso = await createCurso.mutateAsync(data);
      toast.success("Curso creado exitosamente");
      navigate(`/lms/admin/cursos/${nuevoCurso.id}`);
    } catch (error) {
      toast.error("Error al crear el curso");
    }
  };

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/lms/admin')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Curso</h1>
      </div>

      <LMSCursoForm
        onSubmit={handleSubmit}
        isLoading={createCurso.isPending}
        onCancel={() => navigate('/lms/admin')}
      />
    </div>
  );
}
