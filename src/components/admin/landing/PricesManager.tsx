
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

export const PricesManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Precios y Planes</CardTitle>
        <CardDescription>
          Configura los planes y precios que se mostrarán en la landing page.
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
