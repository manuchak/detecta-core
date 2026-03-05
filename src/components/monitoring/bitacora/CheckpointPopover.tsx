import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Upload, Send, X, Loader2, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CheckpointPopoverProps {
  servicioId: string;
  clienteLabel: string;
  isPending: boolean;
  onSubmit: (data: { descripcion?: string; lat?: number; lng?: number; ubicacion_texto?: string; foto_urls?: string[] }) => void;
  children: React.ReactNode;
}

function parseCoords(input: string): { lat: number; lng: number } | null {
  const gmapsMatch = input.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (gmapsMatch) return { lat: parseFloat(gmapsMatch[1]), lng: parseFloat(gmapsMatch[2]) };
  const plainMatch = input.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (plainMatch) return { lat: parseFloat(plainMatch[1]), lng: parseFloat(plainMatch[2]) };
  return null;
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_W = 1920, MAX_H = 1080;
      let w = img.width, h = img.height;
      if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
      if (h > MAX_H) { w = Math.round(w * MAX_H / h); h = MAX_H; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', 0.7);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export const CheckpointPopover: React.FC<CheckpointPopoverProps> = ({ servicioId, clienteLabel, isPending, onSubmit, children }) => {
  const [open, setOpen] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [coords, setCoords] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'));
    setPhotos(prev => [...prev, ...images].slice(0, 5));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const f = items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) { e.preventDefault(); addFiles(files); }
  }, [addFiles]);

  const requestGeo = () => {
    if (!navigator.geolocation) return toast.error('Geolocalización no disponible');
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords(`${pos.coords.latitude},${pos.coords.longitude}`); setGeoLoading(false); },
      () => { toast.error('No se pudo obtener ubicación'); setGeoLoading(false); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async () => {
    if (!descripcion.trim() && photos.length === 0) { toast.error('Agrega descripción o foto'); return; }
    setUploading(true);
    try {
      const parsed = parseCoords(coords);
      const uploadedUrls: string[] = [];
      for (const photo of photos) {
        const compressed = await compressImage(photo);
        const fileName = `bitacora/${servicioId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const { error } = await supabase.storage.from('ticket-evidencias').upload(fileName, compressed, { contentType: 'image/jpeg' });
        if (error) { console.error('Upload error:', error); continue; }
        const { data: urlData } = supabase.storage.from('ticket-evidencias').getPublicUrl(fileName);
        if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
      }
      onSubmit({
        descripcion: descripcion.trim() || undefined,
        lat: parsed?.lat, lng: parsed?.lng,
        ubicacion_texto: coords.trim() || undefined,
        foto_urls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      });
      setDescripcion(''); setCoords(''); setPhotos([]);
      setOpen(false);
    } catch { toast.error('Error al subir evidencia'); }
    finally { setUploading(false); }
  };

  const busy = uploading || isPending;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-3 space-y-2.5"
        side="bottom"
        align="start"
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
        onPaste={handlePaste}
      >
        <div className="text-xs font-medium text-muted-foreground truncate">
          Checkpoint — {clienteLabel}
        </div>

        <Textarea
          placeholder="Descripción / novedad..."
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          className="min-h-[56px] text-xs resize-none"
          disabled={busy}
        />

        <div className="flex gap-1.5">
          <Input
            placeholder="Coords / Google Maps link"
            value={coords}
            onChange={e => setCoords(e.target.value)}
            className="h-7 text-xs"
            disabled={busy}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={requestGeo} disabled={busy || geoLoading}>
            {geoLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
          </Button>
        </div>

        {/* Photo strip */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {photos.map((p, i) => (
            <div key={i} className="relative h-9 w-9 rounded border overflow-hidden group">
              <img src={URL.createObjectURL(p)} className="h-full w-full object-cover" alt="" />
              <button
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
          {photos.length < 5 && (
            <button
              className={cn(
                "h-9 w-9 rounded border border-dashed flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors",
                busy && "opacity-50 pointer-events-none"
              )}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
        </div>

        <Button size="sm" className="w-full h-7 text-xs gap-1" onClick={handleSubmit} disabled={busy || (!descripcion.trim() && photos.length === 0)}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          Enviar Checkpoint
        </Button>
      </PopoverContent>
    </Popover>
  );
};
