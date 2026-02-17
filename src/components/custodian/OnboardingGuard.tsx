/**
 * Guard que verifica si el custodio completó el onboarding de documentos
 * Redirige a /custodian/onboarding si faltan documentos obligatorios
 */
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCustodianProfile } from '@/hooks/useCustodianProfile';
import { useCustodianDocuments } from '@/hooks/useCustodianDocuments';
import type { TipoDocumentoCustodio } from '@/types/checklist';

const REQUIRED_DOCUMENTS: TipoDocumentoCustodio[] = [
  'licencia_conducir',
  'tarjeta_circulacion',
  'poliza_seguro'
];

interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { profile, loading: profileLoading } = useCustodianProfile();
  const { documents, isLoading: docsLoading, refetch } = useCustodianDocuments(profile?.phone);
  const [isChecking, setIsChecking] = useState(true);

  // Invalidar cache de documentos al montar (previene loop post-onboarding)
  useEffect(() => {
    if (profile?.phone && location.pathname !== '/custodian/onboarding') {
      queryClient.invalidateQueries({
        queryKey: ['custodian-documents'],
      });
    }
  }, [profile?.phone, location.pathname, queryClient]);

  useEffect(() => {
    // No verificar si estamos en la página de onboarding
    if (location.pathname === '/custodian/onboarding') {
      setIsChecking(false);
      return;
    }

    // Esperar a que carguen los datos
    if (profileLoading || docsLoading) return;

    // Solo aplicar a custodios (no admin/owner)
    if (!profile?.phone) {
      setIsChecking(false);
      return;
    }

    // Verificar documentos obligatorios
    const today = new Date().toISOString().split('T')[0];
    const validDocuments = documents.filter(doc => {
      const isRequired = REQUIRED_DOCUMENTS.includes(doc.tipo_documento as TipoDocumentoCustodio);
      const isValid = doc.fecha_vigencia >= today;
      return isRequired && isValid;
    });

    const hasAllRequired = validDocuments.length === REQUIRED_DOCUMENTS.length;

    if (!hasAllRequired) {
      const missing = REQUIRED_DOCUMENTS.filter(
        req => !documents.find(d => d.tipo_documento === req)
      );
      const expired = documents.filter(d => {
        const isReq = REQUIRED_DOCUMENTS.includes(d.tipo_documento as TipoDocumentoCustodio);
        return isReq && d.fecha_vigencia < today;
      });

      navigate('/custodian/onboarding', {
        replace: true,
        state: {
          reason: missing.length > 0 ? 'missing' : 'expired',
          missingDocs: missing,
          expiredDocs: expired.map(d => d.tipo_documento),
        },
      });
    }

    setIsChecking(false);
  }, [profile, documents, profileLoading, docsLoading, navigate, location.pathname]);

  // Mostrar loading mientras verifica
  if (isChecking || profileLoading || docsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Verificando documentos...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
