
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

export const BenefitsManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Beneficios</CardTitle>
        <CardDescription>
          Configura los beneficios que se mostrarán en la landing page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Funcionalidad en desarrollo. Pronto podrás editar esta sección.
        </p>
      </CardContent>
    </Card>
  );
};
