import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ToastAction } from '@/components/ui/toast';

interface FeatureAnnouncement {
  id: string;
  title: string;
  description: string;
  targetRoles: string[];
  actionLabel?: string;
  actionPath?: string;
  expiresAt?: Date;
}

// Centralized list of feature announcements
const FEATURE_ANNOUNCEMENTS: FeatureAnnouncement[] = [
  {
    id: 'reportes-planeacion-2025-01',
    title: '🎉 Nueva sección de Reportes',
    description: 'Ahora puedes acceder a dashboards de rendimiento, rechazos y equidad desde Planeación > Reportes.',
    targetRoles: ['planificador', 'coordinador_operaciones'],
    actionLabel: 'Ver Reportes',
    actionPath: '/planeacion/reportes',
    expiresAt: new Date('2025-02-28'),
  },
];

const STORAGE_KEY = 'seen_feature_announcements';

/**
 * Hook that shows toast notifications for new features based on user role.
 * Each announcement is shown only once per user (tracked in localStorage).
 */
export function useFeatureAnnouncements(userRole: string | null, isLoggedIn: boolean) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const hasShownRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !userRole || hasShownRef.current) return;

    const seenAnnouncements = getSeenAnnouncements();

    const pendingAnnouncements = FEATURE_ANNOUNCEMENTS.filter(announcement => {
      if (announcement.expiresAt && new Date() > announcement.expiresAt) {
        return false;
      }
      if (seenAnnouncements.includes(announcement.id)) {
        return false;
      }
      return announcement.targetRoles.includes(userRole);
    });

    if (pendingAnnouncements.length === 0) return;

    hasShownRef.current = true;

    // Show announcements with a delay after login toast
    setTimeout(() => {
      pendingAnnouncements.forEach((announcement, index) => {
        setTimeout(() => {
          toast({
            title: announcement.title,
            description: announcement.description,
            duration: 8000,
            action: announcement.actionPath ? (
              <ToastAction
                altText={announcement.actionLabel || 'Ver'}
                onClick={() => navigate(announcement.actionPath!)}
              >
                {announcement.actionLabel || 'Ver'}
              </ToastAction>
            ) : undefined,
          });

          markAnnouncementAsSeen(announcement.id);
        }, index * 1500);
      });
    }, 2000);

  }, [userRole, isLoggedIn, toast, navigate]);
}

function getSeenAnnouncements(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markAnnouncementAsSeen(announcementId: string): void {
  try {
    const seen = getSeenAnnouncements();
    if (!seen.includes(announcementId)) {
      seen.push(announcementId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    }
  } catch (error) {
    console.error('Error saving announcement state:', error);
  }
}
