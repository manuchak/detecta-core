import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  UserPlus, 
  RefreshCw, 
  Download, 
  Upload,
  Calendar,
  FileText,
  Search,
  LucideIcon
} from 'lucide-react';

interface ContextualAction {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

interface SectionActions {
  [key: string]: ContextualAction[];
}

export function useContextualActions(): ContextualAction[] {
  const location = useLocation();
  const navigate = useNavigate();

  return useMemo(() => {
    const path = location.pathname;

    const SECTION_ACTIONS: SectionActions = {
      '/leads': [
        { 
          id: 'new-lead', 
          label: 'Nuevo Candidato', 
          icon: UserPlus, 
          action: () => navigate('/leads?action=new'),
          variant: 'default'
        },
        { 
          id: 'export-leads', 
          label: 'Exportar', 
          icon: Download, 
          action: () => {},
          variant: 'outline'
        }
      ],
      '/services': [
        { 
          id: 'new-service', 
          label: 'Nuevo Servicio', 
          icon: Plus, 
          action: () => navigate('/services?action=new'),
          variant: 'default'
        }
      ],
      '/planeacion': [
        { 
          id: 'refresh-planning', 
          label: 'Actualizar', 
          icon: RefreshCw, 
          action: () => window.location.reload(),
          variant: 'outline'
        },
        { 
          id: 'calendar-view', 
          label: 'Calendario', 
          icon: Calendar, 
          action: () => navigate('/planeacion?view=calendar'),
          variant: 'ghost'
        }
      ],
      '/monitoring': [
        { 
          id: 'refresh-monitoring', 
          label: 'Actualizar', 
          icon: RefreshCw, 
          action: () => window.location.reload(),
          variant: 'outline'
        }
      ],
      '/wms': [
        { 
          id: 'new-product', 
          label: 'Nuevo Producto', 
          icon: Plus, 
          action: () => navigate('/wms?action=new'),
          variant: 'default'
        },
        { 
          id: 'import-products', 
          label: 'Importar', 
          icon: Upload, 
          action: () => {},
          variant: 'outline'
        }
      ],
      '/tickets': [
        { 
          id: 'new-ticket', 
          label: 'Nuevo Ticket', 
          icon: Plus, 
          action: () => navigate('/tickets?action=new'),
          variant: 'default'
        }
      ],
      '/installers': [
        { 
          id: 'new-installer', 
          label: 'Nuevo Instalador', 
          icon: UserPlus, 
          action: () => navigate('/installers/gestion?action=new'),
          variant: 'default'
        },
        { 
          id: 'schedule', 
          label: 'Programar', 
          icon: Calendar, 
          action: () => navigate('/installers/schedule'),
          variant: 'outline'
        }
      ],
      '/dashboard': [
        { 
          id: 'export-report', 
          label: 'Exportar Reporte', 
          icon: FileText, 
          action: () => {},
          variant: 'outline'
        }
      ]
    };

    // Find matching section
    for (const [sectionPath, actions] of Object.entries(SECTION_ACTIONS)) {
      if (path.startsWith(sectionPath)) {
        return actions.slice(0, 2); // Max 2 actions
      }
    }

    return [];
  }, [location.pathname, navigate]);
}
