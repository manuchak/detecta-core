
import React, { useState } from 'react';
import { assignOwnerRoleToUser } from '@/utils/assignOwnerRole';
import { useToast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

const AssignOwnerRole = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAssignOwnerRole = async () => {
    setLoading(true);
    try {
      await assignOwnerRoleToUser('manuel.chacon@detectasecurity.io');
      
      toast({
        title: "Éxito",
        description: "Rol de owner asignado correctamente a manuel.chacon@detectasecurity.io",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al asignar rol de owner",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Asignar Rol de Owner</CardTitle>
          <CardDescription>
            Asignar rol de propietario al usuario creador del proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Usuario:</strong> manuel.chacon@detectasecurity.io
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Este usuario será asignado como propietario del proyecto
            </p>
          </div>
          
          <Button
            className="w-full"
            onClick={handleAssignOwnerRole}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Asignando rol...
              </>
            ) : (
              'Asignar Rol de Owner'
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Nota: El usuario deberá cerrar sesión y volver a iniciarla para que los cambios surtan efecto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignOwnerRole;
