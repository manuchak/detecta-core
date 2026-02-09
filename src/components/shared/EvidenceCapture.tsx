import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { EvidenceThumbnail } from './EvidenceThumbnail';
import { toast } from 'sonner';

interface EvidenceCaptureProps {
  bucket: string;
  storagePath: string;
  maxPhotos?: number;
  existingUrls?: string[];
  onPhotosChange: (urls: string[]) => void;
  label?: string;
  captureOnly?: boolean;
  accept?: string;
}

async function compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      resolve(file); // fallback to original
    }, 8000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(blob || file),
          'image/jpeg',
          quality
        );
      } catch {
        resolve(file);
      }
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(file);
    };

    const reader = new FileReader();
    reader.onloadend = () => {
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });
}

export function EvidenceCapture({
  bucket,
  storagePath,
  maxPhotos = 3,
  existingUrls = [],
  onPhotosChange,
  label = 'Evidencia',
  captureOnly = false,
  accept = 'image/*',
}: EvidenceCaptureProps) {
  const isMobile = useIsMobile();
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<{ url: string; isLocal: boolean }[]> (
    existingUrls.map(url => ({ url, isLocal: false }))
  );

  const canAddMore = previews.length < maxPhotos;

  const handleFileSelected = useCallback(async (file: File) => {
    if (!file) return;
    setUploading(true);

    try {
      // Compress if image
      let processedFile: Blob = file;
      if (file.type.startsWith('image/')) {
        processedFile = await compressImage(file);
      }

      // Preview via Base64
      const previewUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(processedFile);
      });

      // Upload to storage
      const sanitizedPath = storagePath.replace(/[^a-zA-Z0-9_\\-\\/]/g, '_');
      const fileName = `${sanitizedPath}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // Verify-Before-Commit
      const pathParts = fileName.split('/');
      const dir = pathParts.slice(0, -1).join('/');
      const { data: fileCheck } = await supabase.storage
        .from(bucket)
        .list(dir);

      if (!fileCheck || fileCheck.length === 0) {
        throw new Error('Archivo no verificado en storage');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const newPreviews = [...previews, { url: urlData.publicUrl, isLocal: false }];
      setPreviews(newPreviews);
      onPhotosChange(newPreviews.map(p => p.url));
      toast.success('Foto subida correctamente');
    } catch (error) {
      console.error('Error uploading evidence:', error);
      toast.error('Error al subir la foto');
    } finally {
      setUploading(false);
    }
  }, [bucket, storagePath, previews, onPhotosChange]);

  const triggerCapture = useCallback(() => {
    // Dynamic createElement pattern for Android WebView compatibility
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    if (isMobile && !captureOnly) {
      input.capture = 'environment';
    }
    if (captureOnly) {
      input.capture = 'environment';
    }
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileSelected(file);
    };
    input.click();
  }, [isMobile, captureOnly, accept, handleFileSelected]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  }, [handleFileSelected]);

  const handleRemove = useCallback((index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    onPhotosChange(newPreviews.map(p => p.url));
  }, [previews, onPhotosChange]);

  const handleReplace = useCallback((index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    if (isMobile) input.capture = 'environment';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        let processedFile: Blob = file;
        if (file.type.startsWith('image/')) {
          processedFile = await compressImage(file);
        }
        const sanitizedPath = storagePath.replace(/[^a-zA-Z0-9_\\-\\/]/g, '_');
        const fileName = `${sanitizedPath}/${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from(bucket)
          .upload(fileName, processedFile, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        const newPreviews = [...previews];
        newPreviews[index] = { url: urlData.publicUrl, isLocal: false };
        setPreviews(newPreviews);
        onPhotosChange(newPreviews.map(p => p.url));
        toast.success('Foto reemplazada');
      } catch (err) {
        console.error(err);
        toast.error('Error al reemplazar foto');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }, [isMobile, accept, bucket, storagePath, previews, onPhotosChange]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>

      {/* Existing thumbnails */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((preview, idx) => (
            <EvidenceThumbnail
              key={`${preview.url}-${idx}`}
              url={preview.url}
              onRemove={() => handleRemove(idx)}
              onReplace={() => handleReplace(idx)}
            />
          ))}
        </div>
      )}

      {/* Capture / Upload area */}
      {canAddMore && !uploading && (
        isMobile ? (
          <Button
            type="button"
            variant="outline"
            onClick={triggerCapture}
            className="w-full h-14 text-base gap-2"
          >
            <Camera className="h-5 w-5" />
            Tomar Foto
          </Button>
        ) : (
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={triggerCapture}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Arrastra una foto aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {previews.length}/{maxPhotos} fotos · JPG, PNG, WebP
            </p>
          </div>
        )
      )}

      {/* Uploading state */}
      {uploading && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Subiendo y comprimiendo...
        </div>
      )}

      {/* Counter on mobile */}
      {isMobile && previews.length > 0 && canAddMore && !uploading && (
        <p className="text-xs text-muted-foreground text-center">
          {previews.length}/{maxPhotos} fotos
        </p>
      )}
    </div>
  );
}

