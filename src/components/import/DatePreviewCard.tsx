import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { validateDateArray, formatDateParsingResult } from '@/utils/dateUtils';

interface DatePreviewCardProps {
  data: any[];
  dateField: string;
  displayName: string;
}

export const DatePreviewCard: React.FC<DatePreviewCardProps> = ({
  data,
  dateField,
  displayName
}) => {
  // Extract date values from the data
  const dateValues = data.map(row => row[dateField]).filter(val => val && val !== '');
  
  if (dateValues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            {displayName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay fechas para validar en este campo.</p>
        </CardContent>
      </Card>
    );
  }

  // Validate all date values
  const { summary, results } = validateDateArray(dateValues);
  
  // Get sample results for preview (first 5)
  const sampleResults = results.slice(0, 5);
  
  // Determine overall status
  const hasErrors = summary.failed > 0;
  const hasWarnings = summary.withWarnings > 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {hasErrors ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle className="h-4 w-4 text-success" />
          )}
          {displayName}
          <Badge variant={hasErrors ? "destructive" : hasWarnings ? "secondary" : "outline"}>
            {summary.successful}/{summary.total}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-medium text-success">Exitosas:</span> {summary.successful}
          </div>
          <div>
            <span className="font-medium text-destructive">Fallidas:</span> {summary.failed}
          </div>
          <div>
            <span className="font-medium text-warning">Advertencias:</span> {summary.withWarnings}
          </div>
          <div>
            <span className="font-medium">Total:</span> {summary.total}
          </div>
        </div>

        {/* Format Distribution */}
        {Object.keys(summary.formats).length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium">Formatos detectados:</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(summary.formats).map(([format, count]) => (
                <Badge key={format} variant="outline" className="text-xs">
                  {format}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sample Preview */}
        <div className="space-y-1">
          <p className="text-xs font-medium">Vista previa (primeras 5):</p>
          <div className="space-y-1 text-xs font-mono bg-muted/30 p-2 rounded max-h-32 overflow-y-auto">
            {sampleResults.map((result, index) => (
              <div 
                key={index}
                className={`flex items-start gap-2 ${
                  result.success ? 'text-success' : 'text-destructive'
                }`}
              >
                <span className="text-muted-foreground min-w-0 w-6">{index + 1}.</span>
                <span className="truncate flex-1">
                  {result.originalValue} → {result.success ? result.isoString?.split('T')[0] : 'ERROR'}
                </span>
              </div>
            ))}
            {results.length > 5 && (
              <div className="text-muted-foreground text-center py-1">
                ... y {results.length - 5} más
              </div>
            )}
          </div>
        </div>

        {/* Errors Alert */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {summary.failed} fechas no pudieron ser parseadas correctamente. 
              Revisa el formato de las fechas en tu archivo Excel.
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings Alert */}
        {hasWarnings && !hasErrors && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {summary.withWarnings} fechas tienen advertencias. Revisa que las fechas sean correctas.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};