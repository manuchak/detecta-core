 /**
  * Paso 2: Inspección del vehículo
  * Grid de checkboxes para items del vehículo + selector de combustible
  */
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { InspectionCheckbox } from './InspectionCheckbox';
 import { FuelGauge } from './FuelGauge';
 import { 
   ItemsInspeccion, 
   INSPECCION_ITEMS, 
   EQUIPAMIENTO_ITEMS,
   NivelCombustible 
 } from '@/types/checklist';
 
 interface StepVehicleInspectionProps {
   items: ItemsInspeccion;
   onUpdateItem: (
     categoria: 'vehiculo' | 'equipamiento',
     key: string,
     value: boolean | string | null
   ) => void;
   onBack: () => void;
   onComplete: () => void;
 }
 
 export function StepVehicleInspection({
   items,
   onUpdateItem,
   onBack,
   onComplete
 }: StepVehicleInspectionProps) {
   // Check if all vehicle items are completed
   const vehiculoItems = INSPECCION_ITEMS.map(item => items.vehiculo[item.key as keyof typeof items.vehiculo]);
   const equipamientoItems = EQUIPAMIENTO_ITEMS.map(item => items.equipamiento[item.key as keyof typeof items.equipamiento]);
   
   const allVehiculoChecked = vehiculoItems.every(v => v !== null);
   const allEquipamientoChecked = equipamientoItems.every(v => v !== null);
   const hasFuel = items.vehiculo.nivel_combustible !== null;
   
   const canProceed = allVehiculoChecked && allEquipamientoChecked && hasFuel;
 
   return (
     <div className="space-y-6">
       <div className="text-center">
         <h2 className="text-xl font-semibold">Inspección del Vehículo</h2>
         <p className="text-muted-foreground mt-1">
           Confirma el estado de tu vehículo
         </p>
       </div>
 
       {/* Vehicle inspection items */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-base">Estado del Vehículo</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-2 gap-3">
             {INSPECCION_ITEMS.map((item) => (
               <InspectionCheckbox
                 key={item.key}
                 icon={item.icon}
                 label={item.label}
                 checked={items.vehiculo[item.key as keyof typeof items.vehiculo] as boolean | null}
                 onChange={(value) => onUpdateItem('vehiculo', item.key, value)}
               />
             ))}
           </div>
         </CardContent>
       </Card>
 
       {/* Equipment items */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-base">Equipamiento de Emergencia</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-2 gap-3">
             {EQUIPAMIENTO_ITEMS.map((item) => (
               <InspectionCheckbox
                 key={item.key}
                 icon={item.icon}
                 label={item.label}
                 checked={items.equipamiento[item.key as keyof typeof items.equipamiento] as boolean | null}
                 onChange={(value) => onUpdateItem('equipamiento', item.key, value)}
               />
             ))}
           </div>
         </CardContent>
       </Card>
 
       {/* Fuel gauge */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-base flex items-center gap-2">
             <span>⛽</span>
             Nivel de Combustible
           </CardTitle>
         </CardHeader>
         <CardContent>
           <FuelGauge
             value={items.vehiculo.nivel_combustible}
             onChange={(value) => onUpdateItem('vehiculo', 'nivel_combustible', value)}
           />
         </CardContent>
       </Card>
 
       {/* Navigation buttons */}
       <div className="flex gap-3">
         <Button
           variant="outline"
           className="flex-1"
           onClick={onBack}
         >
           Anterior
         </Button>
         <Button
           className="flex-1"
           disabled={!canProceed}
           onClick={onComplete}
         >
           Continuar
         </Button>
       </div>
     </div>
   );
 }