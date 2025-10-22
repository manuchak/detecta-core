import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { ValidationResult } from "@/services/custodianServicesValidationService";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ValidationStepProps {
  validation: ValidationResult;
}

export const ValidationStep: React.FC<ValidationStepProps> = ({ validation }) => {
  return (
    <div className="space-y-6">
      {/* Estado General */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <CardTitle>
              {validation.isValid ? 'Validación Exitosa' : 'Errores Encontrados'}
            </CardTitle>
          </div>
          <CardDescription>
            Validación rápida preliminar (muestra de 20 registros). Puede diferir de la validación completa.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Errores Críticos */}
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Errores que impiden la importación:</strong>
            <ul className="list-disc list-inside mt-2">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Advertencias */}
      {validation.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Advertencias:</strong>
            <ul className="list-disc list-inside mt-2">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* IDs Duplicados */}
      {validation.duplicateIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">IDs Duplicados</CardTitle>
            <CardDescription>
              Se encontraron {validation.duplicateIds.length} IDs duplicados en el archivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="flex flex-wrap gap-2">
                {validation.duplicateIds.slice(0, 20).map((id, index) => (
                  <Badge key={index} variant="outline" className="text-yellow-600">
                    {id}
                  </Badge>
                ))}
                {validation.duplicateIds.length > 20 && (
                  <Badge variant="outline">
                    +{validation.duplicateIds.length - 20} más
                  </Badge>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Datos Inválidos */}
      {validation.invalidData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Datos Inválidos</CardTitle>
            <CardDescription>
              Se encontraron {validation.invalidData.length} campos con datos inválidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {validation.invalidData.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <div>
                      <span className="font-medium">Fila {item.row}</span> - 
                      <span className="text-sm text-gray-600 ml-1">{item.field}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {String(item.value)}
                      </div>
                      <div className="text-xs text-red-600">{item.reason}</div>
                    </div>
                  </div>
                ))}
                {validation.invalidData.length > 10 && (
                  <div className="text-center text-gray-500">
                    ... y {validation.invalidData.length - 10} más
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Mensaje de éxito */}
      {validation.isValid && validation.warnings.length === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ¡Perfecto! No se encontraron problemas en la muestra validada. 
            Los datos están listos para importar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};