 /**
  * Componente de captura de cámara que bloquea galería
  * Solo permite captura en vivo desde la cámara
  */
 import { useRef } from 'react';
 import { Camera } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import type { AnguloFoto } from '@/types/checklist';
 import { ANGULO_LABELS } from '@/types/checklist';
 
 interface SecureCameraCaptureProps {
   angle: AnguloFoto;
   onCapture: (angle: AnguloFoto, file: File) => void;
   disabled?: boolean;
 }
 
 export function SecureCameraCapture({
   angle,
   onCapture,
   disabled,
 }: SecureCameraCaptureProps) {
   const inputRef = useRef<HTMLInputElement>(null);
 
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       onCapture(angle, file);
     }
     // Reset input para permitir capturar la misma foto
     e.target.value = '';
   };
 
   const handleClick = () => {
     inputRef.current?.click();
   };
 
   return (
     <>
       {/* Input oculto - capture="environment" fuerza cámara trasera y bloquea galería */}
       <input
         ref={inputRef}
         type="file"
         accept="image/*"
         capture="environment"
         onChange={handleChange}
         className="hidden"
         disabled={disabled}
       />
 
       <Button
         type="button"
         onClick={handleClick}
         disabled={disabled}
         variant="default"
         size="lg"
         className="w-full h-14 text-base gap-3"
       >
         <Camera className="w-6 h-6" />
         Tomar foto: {ANGULO_LABELS[angle]}
       </Button>
     </>
   );
 }