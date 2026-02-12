import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Shield, 
  Car,
  Clock,
  TrendingUp,
  Trophy,
  Medal,
  Award,
  Hash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { OperativeProfileFull, ArmadoProfileFull } from '../hooks/useOperativeProfile';
import { useOperativeRating } from '../hooks/useOperativeRating';
import { useFleetRanking, type RankingTier } from '../hooks/useFleetRanking';

interface PerfilHeaderProps {
  profile: OperativeProfileFull | ArmadoProfileFull | null | undefined;
  tipo: 'custodio' | 'armado';
  isLoading?: boolean;
}

const TIER_CONFIG: Record<RankingTier, { icon: typeof Trophy; color: string; bg: string }> = {
  gold:     { icon: Trophy, color: 'text-amber-500',  bg: 'bg-amber-500/10' },
  silver:   { icon: Medal,  color: 'text-slate-400',  bg: 'bg-slate-400/10' },
  bronze:   { icon: Award,  color: 'text-orange-700', bg: 'bg-orange-700/10' },
  standard: { icon: Hash,   color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function PerfilHeader({ profile, tipo, isLoading }: PerfilHeaderProps) {
  const navigate = useNavigate();
  const isCustodio = tipo === 'custodio';
  const custodioProfile = isCustodio ? profile as OperativeProfileFull : null;

  // Always call hooks - they handle undefined internally
  const { rating, isLoading: ratingLoading } = useOperativeRating(
    isCustodio ? custodioProfile?.id : undefined,
    isCustodio ? profile?.nombre : undefined,
    isCustodio ? (profile as OperativeProfileFull)?.telefono : undefined
  );
  const { data: ranking } = useFleetRanking(isCustodio ? profile?.nombre : undefined);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse flex gap-6">
          <div className="w-24 h-24 bg-muted rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/4" />
          </div>
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Perfil no encontrado
        </div>
      </Card>
    );
  }

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'default';
      case 'inactivo':
        return 'secondary';
      case 'suspendido':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getDisponibilidadColor = (disponibilidad: string) => {
    switch (disponibilidad) {
      case 'disponible':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'ocupado':
        return 'bg-amber-500/20 text-amber-700 border-amber-500/30';
      case 'no_disponible':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      default:
        return '';
    }
  };

  const armadoProfile = !isCustodio ? profile as ArmadoProfileFull : null;

  return (
    <Card className="p-6">
      <div className="flex items-start gap-6">
        {/* Back button and avatar */}
        <div className="flex flex-col items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/perfiles-operativos')}
            className="self-start"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">
              {profile.nombre?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
        </div>

        {/* Profile info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{profile.nombre}</h1>
              <p className="text-muted-foreground">
                {isCustodio ? 'Custodio Operativo' : `Armado - ${armadoProfile?.tipo_armado || 'N/A'}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={getEstadoBadgeVariant(profile.estado)}>
                {profile.estado}
              </Badge>
              <Badge className={getDisponibilidadColor(profile.disponibilidad)}>
                {profile.disponibilidad}
              </Badge>
            </div>
          </div>

          {/* Contact info */}
          <div className="flex flex-wrap gap-4 text-sm">
            {profile.telefono && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {profile.telefono}
              </span>
            )}
            {profile.email && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {profile.email}
              </span>
            )}
            {profile.zona_base && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {profile.zona_base}
              </span>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 pt-2">
            {/* Rating - real-time for custodios, static for armados */}
            {isCustodio && !ratingLoading && rating ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-lg">
                <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                <span className="font-medium">{rating.ratingGeneral.toFixed(1)}</span>
                <span className={`text-xs font-medium ${rating.labelColor}`}>{rating.label}</span>
              </div>
            ) : !isCustodio && profile.rating_promedio ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-lg">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{profile.rating_promedio.toFixed(1)}</span>
              </div>
            ) : null}

            {/* Ranking - only custodios */}
            {isCustodio && ranking && (() => {
              const tierCfg = TIER_CONFIG[ranking.tier];
              const TierIcon = tierCfg.icon;
              return (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 ${tierCfg.bg} rounded-lg`}>
                  <TierIcon className={`h-4 w-4 ${tierCfg.color}`} />
                  <span className="font-medium">#{ranking.posicion}</span>
                  <span className="text-xs text-muted-foreground">de {ranking.totalFlota}</span>
                </div>
              );
            })()}

            {profile.numero_servicios != null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-lg">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{profile.numero_servicios} servicios</span>
              </div>
            )}

            {/* Score - real-time for custodios, static for armados */}
            {isCustodio && !ratingLoading && rating ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium">Score: {rating.scoreGeneral}</span>
              </div>
            ) : !isCustodio && profile.score_total != null ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium">Score: {profile.score_total.toFixed(0)}</span>
              </div>
            ) : null}

            {isCustodio && custodioProfile?.vehiculo_propio && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 rounded-lg">
                <Car className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Vehículo propio</span>
              </div>
            )}
            {!isCustodio && armadoProfile?.licencia_portacion && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 rounded-lg">
                <Shield className="h-4 w-4 text-purple-500" />
                <span className="font-medium">{armadoProfile.licencia_portacion}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
