import { Settings, BookOpen, Users, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LMSAdmin() {
  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Administración LMS</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona cursos, usuarios y configuración del sistema de aprendizaje
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Gestión de Cursos</CardTitle>
            <CardDescription>
              Crear, editar y organizar cursos y módulos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Próximamente en Fase 6</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Usuarios y Roles</CardTitle>
            <CardDescription>
              Gestionar inscripciones y permisos de acceso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Próximamente en Fase 6</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Reportes y Métricas</CardTitle>
            <CardDescription>
              Analizar progreso y rendimiento de usuarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Próximamente en Fase 6</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Settings className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Panel de Administración en Desarrollo
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Las funcionalidades de administración del LMS estarán disponibles en la Fase 6. 
            Por ahora, los cursos se gestionan directamente en la base de datos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
