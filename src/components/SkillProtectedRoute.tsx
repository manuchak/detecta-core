
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserSkills } from '@/hooks/useUserSkills';
import { Skill } from '@/types/skillTypes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface SkillProtectedRouteProps {
  children: ReactNode;
  requiredSkills: Skill[];
  requireAll?: boolean; // Si true, requiere TODOS los skills, si false, requiere AL MENOS UNO
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

const SkillProtectedRoute = ({ 
  children, 
  requiredSkills, 
  requireAll = false,
  fallbackPath = '/home',
  showAccessDenied = true
}: SkillProtectedRouteProps) => {
  const { hasSkill, hasAnySkill, isLoading } = useUserSkills();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasRequiredAccess = requireAll 
    ? requiredSkills.every(skill => hasSkill(skill))
    : hasAnySkill(requiredSkills);

  if (!hasRequiredAccess) {
    if (showAccessDenied) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <Alert className="border-red-200">
              <Shield className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-center">
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-800">Acceso Restringido</h3>
                  <p className="text-red-700">
                    No tienes los permisos necesarios para acceder a esta sección.
                  </p>
                  <p className="text-sm text-red-600">
                    Skills requeridos: {requiredSkills.join(', ')}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default SkillProtectedRoute;
