
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Bienvenido
            </CardTitle>
            <CardDescription className="text-center">
              Accede a tu cuenta o crea una nueva
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link to="/auth/login">
                Iniciar Sesión
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth/register">
                Crear Cuenta
              </Link>
            </Button>
            
            <div className="text-center space-y-3">
              <Link 
                to="/custodian" 
                className="block text-sm text-primary hover:underline font-medium"
              >
                Portal del Custodio
              </Link>
              <Link 
                to="/landing" 
                className="block text-sm text-muted-foreground hover:underline"
              >
                Ir a landing page de reclutamiento
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
