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
          [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4
          [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mb-3 [&>h2]:mt-6
          [&>h3]:text-lg [&>h3]:font-medium [&>h3]:mb-2 [&>h3]:mt-4
          [&>p]:text-base [&>p]:leading-relaxed [&>p]:mb-4 [&>p]:text-muted-foreground
          [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-2
          [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol]:space-y-2
          [&>li]:text-muted-foreground
          [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground
          [&>pre]:bg-muted [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto
          [&>code]:bg-muted [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm
          [&>img]:rounded-lg [&>img]:max-w-full [&>img]:h-auto
          [&>a]:text-primary [&>a]:underline [&>a]:underline-offset-2
          [&>hr]:border-border [&>hr]:my-6
          [&>table]:w-full [&>table]:border-collapse
          [&>table_th]:border [&>table_th]:border-border [&>table_th]:p-2 [&>table_th]:bg-muted
          [&>table_td]:border [&>table_td]:border-border [&>table_td]:p-2
        "
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
    </div>
  );
}
