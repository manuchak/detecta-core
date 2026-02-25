import { useEffect, useState } from "react";
import type { TextoEnriquecidoContent } from "@/types/lms";

interface TextoEnriquecidoViewerProps {
  content: TextoEnriquecidoContent;
  onComplete?: () => void;
}

export function TextoEnriquecidoViewer({ content, onComplete }: TextoEnriquecidoViewerProps) {
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);

  useEffect(() => {
    // Marcar como completado después de leer (3 segundos)
    if (!hasMarkedComplete) {
      const timer = setTimeout(() => {
        setHasMarkedComplete(true);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [onComplete, hasMarkedComplete]);

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div 
        className="
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6
          [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4
          [&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-muted-foreground
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2
          [&_li]:text-muted-foreground
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4
          [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto
          [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
          [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4
          [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
          [&_u]:underline [&_u]:underline-offset-2
          [&_s]:line-through
          [&_mark]:px-1 [&_mark]:rounded-sm
          [&_hr]:border-border [&_hr]:my-6
          [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
          [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-left
          [&_td]:border [&_td]:border-border [&_td]:p-2
          [&_[style*='text-align:_center']]:text-center
          [&_[style*='text-align:_right']]:text-right
        "
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
    </div>
  );
}
