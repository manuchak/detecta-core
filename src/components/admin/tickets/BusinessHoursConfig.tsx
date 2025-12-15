import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BusinessHour } from '@/hooks/useTicketConfig';

interface BusinessHoursConfigProps {
  businessHours: BusinessHour[];
  onUpdate: (id: string, updates: Partial<BusinessHour>) => Promise<boolean>;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const BusinessHoursConfig: React.FC<BusinessHoursConfigProps> = ({
  businessHours,
  onUpdate
}) => {
  // Ensure we have all 7 days
  const hoursMap = new Map(businessHours.map(h => [h.dia_semana, h]));

  const handleToggle = async (dia: number, hour: BusinessHour | undefined, checked: boolean) => {
    if (hour) {
      await onUpdate(hour.id, { es_dia_laboral: checked });
    }
  };

  const handleTimeChange = async (hour: BusinessHour, field: 'hora_inicio' | 'hora_fin', value: string) => {
    await onUpdate(hour.id, { [field]: value });
  };

  // Calculate total hours per week
  const totalHoursPerWeek = businessHours
    .filter(h => h.es_dia_laboral)
    .reduce((acc, h) => {
      const start = parseInt(h.hora_inicio.split(':')[0]);
      const end = parseInt(h.hora_fin.split(':')[0]);
      return acc + (end - start);
    }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <h3 className="font-medium">Resumen</h3>
          <p className="text-sm text-muted-foreground">
            Total de horas laborales por semana
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {totalHoursPerWeek} horas/semana
        </Badge>
      </div>

      <div className="space-y-4">
        {DIAS_SEMANA.map((nombre, index) => {
          const hour = hoursMap.get(index);
          const isWorkDay = hour?.es_dia_laboral ?? false;
          
          return (
            <div 
              key={index} 
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                isWorkDay ? 'bg-background' : 'bg-muted/50'
              }`}
            >
              <div className="w-32">
                <span className="font-medium">{nombre}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={isWorkDay}
                  onCheckedChange={(checked) => handleToggle(index, hour, checked)}
                />
                <Label className="text-sm text-muted-foreground">
                  {isWorkDay ? 'Laboral' : 'No laboral'}
                </Label>
              </div>

              {hour && isWorkDay && (
                <div className="flex items-center gap-4 ml-auto">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Inicio:</Label>
                    <Input
                      type="time"
                      value={hour.hora_inicio}
                      onChange={(e) => handleTimeChange(hour, 'hora_inicio', e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Fin:</Label>
                    <Input
                      type="time"
                      value={hour.hora_fin}
                      onChange={(e) => handleTimeChange(hour, 'hora_fin', e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <Badge variant="outline">
                    {parseInt(hour.hora_fin.split(':')[0]) - parseInt(hour.hora_inicio.split(':')[0])}h
                  </Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100">ℹ️ Información</h4>
        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
          Los SLAs de tickets se calculan únicamente durante horario laboral. 
          Por ejemplo, un SLA de 8 horas creado viernes a las 5pm se cumplirá lunes a la 1pm si el sábado y domingo no son laborales.
        </p>
      </div>
    </div>
  );
};
