 /**
  * Canvas táctil para capturar firma digital del custodio
  */
 import { useRef, useEffect, useState } from 'react';
 import { Eraser, Check } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { cn } from '@/lib/utils';
 
 interface SignaturePadProps {
   value: string | null;
   onChange: (signature: string | null) => void;
   className?: string;
 }
 
 export function SignaturePad({
   value,
   onChange,
   className,
 }: SignaturePadProps) {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const [isDrawing, setIsDrawing] = useState(false);
   const [hasSignature, setHasSignature] = useState(false);
 
   // Configurar canvas al montar
   useEffect(() => {
     const canvas = canvasRef.current;
     if (!canvas) return;
 
     const ctx = canvas.getContext('2d');
     if (!ctx) return;
 
     // Ajustar resolución para dispositivos de alta densidad
     const rect = canvas.getBoundingClientRect();
     const dpr = window.devicePixelRatio || 1;
     canvas.width = rect.width * dpr;
     canvas.height = rect.height * dpr;
     ctx.scale(dpr, dpr);
 
     // Estilo del trazo
     ctx.strokeStyle = '#000';
     ctx.lineWidth = 2;
     ctx.lineCap = 'round';
     ctx.lineJoin = 'round';
 
     // Si hay valor previo, cargar imagen
     if (value) {
       const img = new Image();
       img.onload = () => {
         ctx.drawImage(img, 0, 0, rect.width, rect.height);
         setHasSignature(true);
       };
       img.src = value;
     }
   }, []);
 
   const getPosition = (
     e: React.TouchEvent | React.MouseEvent
   ): { x: number; y: number } => {
     const canvas = canvasRef.current;
     if (!canvas) return { x: 0, y: 0 };
 
     const rect = canvas.getBoundingClientRect();
 
     if ('touches' in e) {
       const touch = e.touches[0];
       return {
         x: touch.clientX - rect.left,
         y: touch.clientY - rect.top,
       };
     }
 
     return {
       x: e.clientX - rect.left,
       y: e.clientY - rect.top,
     };
   };
 
   const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
     e.preventDefault();
     const canvas = canvasRef.current;
     const ctx = canvas?.getContext('2d');
     if (!ctx) return;
 
     const pos = getPosition(e);
     ctx.beginPath();
     ctx.moveTo(pos.x, pos.y);
     setIsDrawing(true);
   };
 
   const draw = (e: React.TouchEvent | React.MouseEvent) => {
     e.preventDefault();
     if (!isDrawing) return;
 
     const canvas = canvasRef.current;
     const ctx = canvas?.getContext('2d');
     if (!ctx) return;
 
     const pos = getPosition(e);
     ctx.lineTo(pos.x, pos.y);
     ctx.stroke();
     setHasSignature(true);
   };
 
   const stopDrawing = () => {
     if (isDrawing && hasSignature) {
       const canvas = canvasRef.current;
       if (canvas) {
         const dataUrl = canvas.toDataURL('image/png');
         onChange(dataUrl);
       }
     }
     setIsDrawing(false);
   };
 
   const clearSignature = () => {
     const canvas = canvasRef.current;
     const ctx = canvas?.getContext('2d');
     if (!ctx || !canvas) return;
 
     const rect = canvas.getBoundingClientRect();
     ctx.clearRect(0, 0, rect.width, rect.height);
     setHasSignature(false);
     onChange(null);
   };
 
   return (
     <div className={cn('space-y-3', className)}>
       <div className="flex items-center justify-between">
         <label className="text-sm font-medium text-foreground flex items-center gap-2">
           ✍️ Firma Digital
           {hasSignature && (
             <span className="text-xs text-green-600 flex items-center gap-1">
               <Check className="w-3 h-3" />
               Firmado
             </span>
           )}
         </label>
         {hasSignature && (
           <Button
             type="button"
             variant="ghost"
             size="sm"
             onClick={clearSignature}
             className="h-8 px-2 text-muted-foreground"
           >
             <Eraser className="w-4 h-4 mr-1" />
             Limpiar
           </Button>
         )}
       </div>
 
       <div
         className={cn(
           'relative rounded-xl border-2 bg-background overflow-hidden',
           hasSignature ? 'border-primary' : 'border-muted'
         )}
       >
         <canvas
           ref={canvasRef}
           className="w-full h-32 touch-none cursor-crosshair"
           onMouseDown={startDrawing}
           onMouseMove={draw}
           onMouseUp={stopDrawing}
           onMouseLeave={stopDrawing}
           onTouchStart={startDrawing}
           onTouchMove={draw}
           onTouchEnd={stopDrawing}
         />
 
         {!hasSignature && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="text-muted-foreground text-sm">
               Dibuja tu firma aquí
             </span>
           </div>
         )}
       </div>
     </div>
   );
 }