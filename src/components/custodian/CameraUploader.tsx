import { useState, useRef } from 'react';
import { Camera, Image, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CameraUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export const CameraUploader = ({
  files,
  onFilesChange,
  maxFiles = 5
}: CameraUploaderProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const remainingSlots = maxFiles - files.length;
    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length > 0) {
      const newFiles = [...files, ...filesToAdd];
      onFilesChange(newFiles);
      
      // Generate previews
      filesToAdd.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    
    // Reset input
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    setPreviews(newPreviews);
  };

  const canAddMore = files.length < maxFiles;

  return (
    <div className="space-y-4">
      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Photo previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={preview}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover rounded-xl border border-border"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg active:scale-95 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {canAddMore && (
        <div className="space-y-3">
          <Button
            type="button"
            variant="default"
            size="lg"
            className="w-full h-16 text-lg font-semibold rounded-2xl gap-3"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="w-7 h-7" />
            Tomar Foto
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full h-14 text-base rounded-2xl gap-3"
            onClick={() => galleryInputRef.current?.click()}
          >
            <Image className="w-6 h-6" />
            Elegir de Galería
          </Button>
        </div>
      )}

      {/* Counter */}
      <p className="text-center text-muted-foreground text-sm">
        {files.length} de {maxFiles} fotos
        {files.length === 0 && " (opcional)"}
      </p>
    </div>
  );
};
