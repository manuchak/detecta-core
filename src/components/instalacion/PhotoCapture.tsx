
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, X, CheckCircle, RotateCcw } from 'lucide-react';

interface PhotoCaptureProps {
  title: string;
  description: string;
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  requiredPhotos?: string[];
  maxPhotos?: number;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  title,
  description,
  photos,
  onPhotosChange,
  requiredPhotos = ['Frontal', 'Trasero', 'Lateral izquierdo', 'Lateral derecho'],
  maxPhotos = 4
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoLabels, setPhotoLabels] = useState<string[]>([]);

  const handleAddPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const newPhotos = [...photos, ...files].slice(0, maxPhotos);
      const newLabels = [...photoLabels];
      
      files.forEach((_, index) => {
        const currentIndex = photos.length + index;
        if (currentIndex < requiredPhotos.length) {
          newLabels[currentIndex] = requiredPhotos[currentIndex];
        }
      });
      
      setPhotoLabels(newLabels);
      onPhotosChange(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newLabels = photoLabels.filter((_, i) => i !== index);
    setPhotoLabels(newLabels);
    onPhotosChange(newPhotos);
  };

  const getNextPhotoType = () => {
    if (photos.length < requiredPhotos.length) {
      return requiredPhotos[photos.length];
    }
    return 'Adicional';
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-4">{description}</p>
          
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={photos.length >= requiredPhotos.length ? "default" : "secondary"}>
              {photos.length}/{requiredPhotos.length} fotos requeridas
            </Badge>
            {photos.length >= requiredPhotos.length && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completo
              </Badge>
            )}
          </div>
        </div>

        {/* Preview de fotos */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                  {photoLabels[index] || `Foto ${index + 1}`}
                </Badge>
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Botón para agregar fotos */}
        {photos.length < maxPhotos && (
          <div className="text-center">
            <Button
              onClick={handleAddPhoto}
              variant="outline"
              className="w-full h-16 border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors"
            >
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-6 w-6 text-gray-500" />
                <span className="text-sm font-medium">
                  Tomar foto: {getNextPhotoType()}
                </span>
              </div>
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Lista de fotos pendientes */}
        {photos.length < requiredPhotos.length && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800 mb-2">Fotos pendientes:</p>
            <div className="flex flex-wrap gap-2">
              {requiredPhotos.slice(photos.length).map((type, index) => (
                <Badge key={index} variant="outline" className="text-amber-700 border-amber-300">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
