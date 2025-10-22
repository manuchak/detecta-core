import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, GitBranch, Settings, FileText } from "lucide-react";
import { SystemVersion } from "@/hooks/useVersionControl";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface VersionCardProps {
  version: SystemVersion;
  onViewDetails: (version: SystemVersion) => void;
  onEdit?: (version: SystemVersion) => void;
  changeCount?: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'planning':
      return 'bg-secondary text-secondary-foreground';
    case 'development':
      return 'bg-warning text-warning-foreground';
    case 'testing':
      return 'bg-info text-info-foreground';
    case 'released':
      return 'bg-success text-success-foreground';
    case 'deprecated':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getVersionTypeColor = (type: string) => {
  switch (type) {
    case 'major':
      return 'bg-destructive text-destructive-foreground';
    case 'minor':
      return 'bg-primary text-primary-foreground';
    case 'patch':
      return 'bg-success text-success-foreground';
    case 'hotfix':
      return 'bg-warning text-warning-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const VersionCard = ({ version, onViewDetails, onEdit, changeCount }: VersionCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              {version.version_number}
              {version.version_name && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({version.version_name})
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Badge className={getVersionTypeColor(version.version_type)}>
                {version.version_type}
              </Badge>
              <Badge className={getStatusColor(version.status)}>
                {version.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {version.description && (
          <p className="text-sm text-muted-foreground">
            {version.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(version.release_date), 'dd/MM/yyyy', { locale: es })}
          </div>
          {changeCount !== undefined && (
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{changeCount} cambios</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(version)}
            className="flex-1"
          >
            Ver Detalles
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(version)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};