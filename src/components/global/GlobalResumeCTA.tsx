import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, X, Clock, ArrowRight } from 'lucide-react';
import { useDraftResume } from '@/contexts/DraftResumeContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function GlobalResumeCTA() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getMostRecentDraft, clearDraft } = useDraftResume();
  const [draft, setDraft] = useState<ReturnType<typeof getMostRecentDraft>>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkDraft = () => {
      const recentDraft = getMostRecentDraft();
      setDraft(recentDraft);
    };

    checkDraft();
    const interval = setInterval(checkDraft, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [getMostRecentDraft]);

  // Don't show if no draft, dismissed, or already on the resume path
  if (!draft || dismissed || location.pathname === draft.resumePath) {
    return null;
  }

  const timeAgo = draft.lastModified
    ? formatDistanceToNow(draft.lastModified, { addSuffix: true, locale: es })
    : 'hace un momento';

  const handleResume = () => {
    console.log('🔄 [GlobalResumeCTA] Resuming draft:', draft.moduleName, 'ID:', draft.id);
    
    // Navigate to declarative resume route
    navigate(`/resume/${draft.id}`);
    setDismissed(true);
  };

  const handleDiscard = () => {
    console.log('🗑️ [GlobalResumeCTA] Discarding draft:', draft.moduleName);
    
    clearDraft(draft.storageKey);
    sessionStorage.setItem('scw_suppress_restore', '1');
    setDismissed(true);
  };

  const handleRemindLater = () => {
    console.log('⏰ [GlobalResumeCTA] Remind later:', draft.moduleName);
    setDismissed(true);
  };

  return (
    <Card className="fixed bottom-6 right-6 w-96 shadow-lg border-primary/20 bg-background z-50 animate-in slide-in-from-bottom-5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              {draft.moduleName} en progreso
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Guardado {timeAgo}
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleResume}
                className="flex-1 h-8 text-xs"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Reanudar
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemindLater}
                className="h-8 text-xs"
              >
                <Clock className="h-3 w-3" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDiscard}
                className="h-8 text-xs text-destructive hover:text-destructive"
              >
                Descartar
              </Button>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemindLater}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
