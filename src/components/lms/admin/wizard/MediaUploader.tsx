import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link, X, FileVideo, FileText, Image, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MediaType = 'video' | 'document' | 'image';

interface MediaUploaderProps {
  type: MediaType;
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

const TYPE_CONFIG = {
  video: {
    icon: FileVideo,
    accept: ".mp4,.webm,.mov",
    maxSize: 150 * 1024 * 1024, // 150MB
    label: "Video",
    placeholder: "https://youtube.com/watch?v=... o https://vimeo.com/...",
    hint: "Soporta YouTube, Vimeo y enlaces directos a MP4",
    folder: "videos",
  },
  document: {
    icon: FileText,
    accept: ".pdf,.docx,.pptx,.xlsx,.doc,.ppt,.xls",
    maxSize: 20 * 1024 * 1024, // 20MB
    label: "Documento",
    placeholder: "https://docs.google.com/... o enlace directo",
    hint: "PDF, Word, PowerPoint, Excel",
    folder: "documents",
  },
  image: {
    icon: Image,
    accept: ".png,.jpg,.jpeg,.webp,.gif",
    maxSize: 5 * 1024 * 1024, // 5MB
    label: "Imagen",
    placeholder: "https://...",
    hint: "PNG, JPG, WebP, GIF",
    folder: "images",
  },
};

export function MediaUploader({ 
  type, 
  value, 
  onChange, 
  placeholder,
  className 
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  const handleFileSelect = async (file: File) => {
    if (file.size > config.maxSize) {
      toast.error(`El archivo es muy grande. Máximo: ${config.maxSize / (1024 * 1024)}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${config.folder}/${fileName}`;

      // Simulated progress (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { error } = await supabase.storage
        .from('lms-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('lms-media')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      onChange(publicUrl);
      toast.success("Archivo subido correctamente");
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Error al subir archivo");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      toast.success("URL aplicada");
    }
  };

  const handleClear = () => {
    onChange("");
  };

  // If there's a value, show preview
  if (value) {
    return (
      <div className={cn("flex items-center gap-2 p-2 bg-muted/50 rounded-lg border", className)}>
        <div className="p-1.5 bg-primary/10 rounded">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{config.label} cargado</p>
          <p className="text-[10px] text-muted-foreground truncate">{value}</p>
        </div>
        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={handleClear}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="url" className="text-xs gap-1">
            <Link className="w-3 h-3" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs gap-1">
            <Upload className="w-3 h-3" />
            Subir
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="mt-2 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={placeholder || config.placeholder}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              className="h-8 text-xs flex-1"
            />
            <Button 
              type="button"
              size="sm" 
              className="h-8 px-3"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
            >
              Aplicar
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">{config.hint}</p>
        </TabsContent>

        <TabsContent value="upload" className="mt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={config.accept}
            onChange={handleInputChange}
            className="hidden"
          />
          
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30",
              isUploading && "pointer-events-none opacity-60"
            )}
          >
            {isUploading ? (
              <div className="space-y-2">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
                <Progress value={uploadProgress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">Subiendo... {uploadProgress}%</p>
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs font-medium">Arrastra aquí o haz clic</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {config.accept.replace(/\./g, '').toUpperCase()} • Máx {config.maxSize / (1024 * 1024)}MB
                </p>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
