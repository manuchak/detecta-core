import { useNavigate } from "react-router-dom";
import { LMSCursoForm } from "@/components/lms/admin/LMSCursoForm";

export default function LMSAdminCursoNuevo() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-3xl py-8">
      <LMSCursoForm
        onBack={() => navigate('/lms/admin')}
        onSuccess={() => navigate('/lms/admin')}
      />
    </div>
  );
}
