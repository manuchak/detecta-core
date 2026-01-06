import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Link, X, Loader2, ImageIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLMSAI } from "@/hooks/lms/useLMSAI";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  courseTitle?: string;
}

export function ImageUploader({ value, onChange, courseTitle }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generateCourseImage, loading: aiLoading } = useLMSAI();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `curso-${Date.now()}.${fileExt}`;
      const filePath = `cursos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lms-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('lms-content')
        .getPublicUrl(filePath);

      onChange(urlData.publicUrl);
      toast.success('Imagen subida exitosamente');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setGeneratedPreview(null);
  };

  const handleGenerateImage = async () => {
    if (!courseTitle || courseTitle.length < 3) {
      toast.error("Escribe un título de al menos 3 caracteres");
      return;
    }

    const result = await generateCourseImage(courseTitle);
    if (result?.imageBase64) {
      setGeneratedPreview(result.imageBase64);
      toast.success("Imagen generada. Haz clic en 'Usar esta imagen' para aplicarla.");
    }
  };

  const handleAcceptGeneratedImage = async () => {
    if (!generatedPreview) return;

    setIsUploading(true);
    try {
      // Convert base64 to blob
      const base64Data = generatedPreview.replace(/^data:image\/\w+;base64,/, '');
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Upload to Supabase Storage
      const fileName = `curso-ai-${Date.now()}.png`;
      const filePath = `cursos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lms-content')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('lms-content')
        .getPublicUrl(filePath);

      onChange(urlData.publicUrl);
      setGeneratedPreview(null);
      toast.success('Imagen aplicada exitosamente');
    } catch (error: any) {
      console.error('Error uploading generated image:', error);
      toast.error(error.message || 'Error al guardar la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  if (value) {
    return (
      <div className="relative rounded-xl border-2 border-dashed border-border overflow-hidden">
        <img 
          src={value} 
          alt="Portada" 
          className="w-full aspect-video object-cover"
          onError={(e) => {
            e.currentTarget.src = '';
            toast.error('No se pudo cargar la imagen');
          }}
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
          onClick={handleClear}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="upload" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Subir
        </TabsTrigger>
        <TabsTrigger value="url" className="flex items-center gap-2">
          <Link className="w-4 h-4" />
          URL
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Generar con IA
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload">
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
            "hover:border-primary/50 hover:bg-accent/30",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Haz clic para subir una imagen</p>
              <p className="text-xs text-muted-foreground">PNG, JPG o WEBP (máx. 5MB)</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="url">
        <div className="flex gap-2">
          <Input
            placeholder="https://ejemplo.com/imagen.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          <Button type="button" onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
            Aplicar
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="ai">
        <div className="space-y-4">
          <div className="text-center p-4 border-2 border-dashed rounded-xl">
            <Sparkles className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium mb-1">Generar imagen con IA</p>
            <p className="text-xs text-muted-foreground mb-4">
              {courseTitle && courseTitle.length >= 3 
                ? `Se generará una imagen profesional para: "${courseTitle}"`
                : "Escribe un título de curso para generar una imagen"}
            </p>
            <Button 
              type="button" 
              onClick={handleGenerateImage}
              disabled={aiLoading || !courseTitle || courseTitle.length < 3}
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generar Imagen
                </>
              )}
            </Button>
          </div>

          {generatedPreview && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Vista previa:</p>
              <div className="relative rounded-xl border overflow-hidden">
                <img 
                  src={generatedPreview} 
                  alt="Imagen generada" 
                  className="w-full aspect-video object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGenerateImage}
                  disabled={aiLoading}
                  className="flex-1"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Regenerar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleAcceptGeneratedImage}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Usar esta imagen
                </Button>
              </div>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
