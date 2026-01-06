import { useNavigate } from "react-router-dom";
import { LMSCursoWizard } from "@/components/lms/admin/LMSCursoWizard";

export default function LMSAdminCursoNuevo() {
  const navigate = useNavigate();

  return (
    <div className="container py-8">
      <LMSCursoWizard onBack={() => navigate('/lms/admin')} />
    </div>
  );
}
