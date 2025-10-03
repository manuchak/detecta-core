import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Tag, Radio } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExpensePreviewCardProps {
  concepto: string;
  monto: number;
  categoria: string;
  subcategoria: string;
  canal: string;
  fecha?: Date;
  descripcion?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const ExpensePreviewCard = ({
  concepto,
  monto,
  categoria,
  subcategoria,
  canal,
  fecha,
  descripcion,
}: ExpensePreviewCardProps) => {
  if (!concepto && !monto && !categoria) {
    return null;
  }

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-primary/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-3 w-3 text-primary" />
          </div>
          Vista Previa del Gasto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {concepto && (
          <div>
            <h3 className="font-semibold text-lg">{concepto}</h3>
          </div>
        )}
        
        {monto > 0 && (
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(monto)}
          </div>
        )}

        <div className="space-y-2 text-sm">
          {categoria && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Categoría:</span>
              <Badge variant="secondary">{categoria}</Badge>
            </div>
          )}
          
          {subcategoria && (
            <div className="flex items-center gap-2 ml-6">
              <span className="text-muted-foreground">→</span>
              <Badge variant="outline">{subcategoria}</Badge>
            </div>
          )}
          
          {canal && (
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Canal:</span>
              <Badge variant="secondary">{canal}</Badge>
            </div>
          )}
          
          {fecha && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Fecha:</span>
              <span className="font-medium">{format(fecha, 'PPP', { locale: es })}</span>
            </div>
          )}
        </div>

        {descripcion && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground italic">
              "{descripcion}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
