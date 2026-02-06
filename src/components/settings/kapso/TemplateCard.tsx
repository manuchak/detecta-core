import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  CircleDot,
  Download,
  FileJson,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { WhatsAppTemplateRecord, MetaApprovalStatus, TEMPLATE_CONFIGS, DetectaTemplateName } from '@/types/kapso';
import { downloadSingleTemplateJSON } from '@/utils/exportWhatsAppTemplates';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: WhatsAppTemplateRecord;
  onTest: (template: WhatsAppTemplateRecord) => void;
  onUpdateStatus: (templateName: string, status: MetaApprovalStatus) => void;
  onViewMeta?: (template: WhatsAppTemplateRecord) => void;
}

const statusConfig: Record<MetaApprovalStatus, { 
  label: string; 
  icon: React.ReactNode; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}> = {
  not_submitted: { 
    label: 'Sin enviar', 
    icon: <CircleDot className="h-3 w-3" />, 
    variant: 'secondary',
    className: 'bg-muted text-muted-foreground'
  },
  pending: { 
    label: 'Pendiente', 
    icon: <Clock className="h-3 w-3" />, 
    variant: 'outline',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/30'
  },
  approved: { 
    label: 'Aprobado', 
    icon: <CheckCircle2 className="h-3 w-3" />, 
    variant: 'default',
    className: 'bg-success/10 text-success border-success/30'
  },
  rejected: { 
    label: 'Rechazado', 
    icon: <XCircle className="h-3 w-3" />, 
    variant: 'destructive',
    className: 'bg-destructive/10 text-destructive border-destructive/30'
  }
};

export const TemplateCard = ({ template, onTest, onUpdateStatus, onViewMeta }: TemplateCardProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const config = TEMPLATE_CONFIGS[template.name as DetectaTemplateName];
  const status = statusConfig[template.meta_status as MetaApprovalStatus] || statusConfig.not_submitted;
  const canTest = template.meta_status === 'approved';

  const handleDownloadJSON = () => {
    downloadSingleTemplateJSON(template.name as DetectaTemplateName);
  };

  return (
    <Card className="border-border/50 hover:border-border transition-colors">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium truncate">
                {template.name}
              </span>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {config?.category || template.meta_category}
              </Badge>
            </div>
            
            {/* Meta info */}
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>Variables: {template.variable_count}</span>
              {template.has_buttons && (
                <span>Botones: {template.button_count}</span>
              )}
              {template.last_test_at && (
                <span className="truncate">
                  Última prueba: {new Date(template.last_test_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn("gap-1", status.className)}>
              {status.icon}
              {status.label}
            </Badge>
            
            {/* View Meta button */}
            {onViewMeta && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewMeta(template)}
                className="gap-1 hidden sm:flex"
              >
                <ExternalLink className="h-3 w-3" />
                Vista
              </Button>
            )}
            
            {/* More actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewMeta && (
                  <DropdownMenuItem onClick={() => onViewMeta(template)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver formato Meta
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setExpanded(!expanded)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {expanded ? 'Ocultar contenido' : 'Ver contenido'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadJSON}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Descargar JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant={canTest ? "default" : "outline"}
              size="sm"
              disabled={!canTest}
              onClick={() => onTest(template)}
              className="gap-1"
            >
              <Play className="h-3 w-3" />
              Test
            </Button>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
            {/* Template preview */}
            <div className="bg-muted/50 rounded-lg p-3">
              <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                {template.content || 'Sin contenido definido'}
              </pre>
            </div>

            {/* Status update buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Cambiar estado:</span>
              {(['not_submitted', 'pending', 'approved', 'rejected'] as MetaApprovalStatus[]).map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 text-xs",
                    template.meta_status === s && "ring-2 ring-primary"
                  )}
                  onClick={() => onUpdateStatus(template.name, s)}
                >
                  {statusConfig[s].icon}
                  <span className="ml-1">{statusConfig[s].label}</span>
                </Button>
              ))}
            </div>

            {/* Rejection reason */}
            {template.meta_status === 'rejected' && template.rejection_reason && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                <p className="text-xs text-destructive">
                  <strong>Motivo de rechazo:</strong> {template.rejection_reason}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
