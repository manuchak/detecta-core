import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  FileText, 
  Receipt, 
  CreditCard, 
  Stamp,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export function FacturasComingSoon() {
  const plannedFeatures = [
    { icon: FileText, label: 'Generación de Facturas CFDI 4.0' },
    { icon: Receipt, label: 'Notas de Crédito' },
    { icon: CreditCard, label: 'Complementos de Pago' },
    { icon: Stamp, label: 'Timbrado Automático con PAC' },
  ];

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <Card className="max-w-lg w-full border-2 border-dashed border-violet-500/30 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20">
        <CardContent className="p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/25">
            <Receipt className="h-8 w-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2">Facturación CFDI</h2>
          
          {/* Badge */}
          <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 mb-6 text-sm px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Próximamente
          </Badge>

          {/* Description */}
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Estamos trabajando en la integración con PAC autorizado 
            para la generación de comprobantes fiscales digitales (CFDI 4.0).
          </p>

          {/* Planned Features */}
          <div className="space-y-3 text-left mb-8">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Funcionalidades planeadas:
            </p>
            <div className="grid gap-2">
              {plannedFeatures.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/80 border"
                >
                  <div className="p-1.5 rounded-md bg-violet-500/10">
                    <feature.icon className="h-4 w-4 text-violet-600" />
                  </div>
                  <span className="text-sm">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t my-6" />

          {/* Alternative */}
          <div className="text-sm text-muted-foreground">
            <p className="mb-3">
              Mientras tanto, puede usar la sección <strong>"Servicios"</strong> para:
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span>Exportar datos a Excel para facturación externa</span>
            </div>
          </div>

          {/* CTA */}
          <Button 
            variant="outline" 
            className="mt-6 gap-2"
            onClick={() => {
              // Navigate to Servicios tab
              const serviciosTab = document.querySelector('[data-value="servicios"]') as HTMLElement;
              serviciosTab?.click();
            }}
          >
            Ir a Servicios
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
