import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useHomeData } from '@/hooks/useHomeData';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HeroActionCard } from '@/components/home/HeroActionCard';
import { MetricWidget } from '@/components/home/MetricWidget';
import { ModuleGrid } from '@/components/home/ModuleGrid';
import { MainNavigation } from '@/components/layout/MainNavigation';
import type { UserRole } from '@/config/roleHomeConfig';

const Home = () => {
  const { user, userRole, signOut } = useAuth();
  const { hero, widgets, modules, shouldRedirect, isLoading } = useHomeData(userRole as UserRole);

  // Redirect for roles with dedicated portals (custodio)
  if (shouldRedirect) {
    return <Navigate to={shouldRedirect} replace />;
  }

  // Show loading state
  if (isLoading && !hero && widgets.length === 0) {
    return (
      <div className="glass-mesh-background min-h-screen">
        <MainNavigation />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="glass-skeleton h-20 rounded-2xl" />
            <div className="glass-skeleton h-40 rounded-3xl" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-skeleton h-24 rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="glass-mesh-background min-h-screen">
      <MainNavigation />
      
      <main className="max-w-4xl mx-auto px-4 pb-12 space-y-8">
        {/* Header with greeting */}
        <HomeHeader 
          userName={user?.user_metadata?.display_name}
          userEmail={user?.email}
          onSignOut={signOut}
        />

        {/* Hero Card - Primary Action */}
        {hero && (
          <HeroActionCard
            title={hero.title}
            description={hero.description}
            value={hero.value}
            cta={hero.cta}
            icon={hero.icon}
            urgency={hero.urgency}
            isLoading={hero.isLoading}
          />
        )}

        {/* Widgets - Key Metrics */}
        {widgets.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {widgets.map((widget, index) => (
              <MetricWidget
                key={index}
                label={widget.label}
                value={widget.value}
                isLoading={widget.isLoading}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Modules - Quick Access */}
        {modules.length > 0 && (
          <section className="pt-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              Acceso Rápido
            </h2>
            <ModuleGrid modules={modules} />
          </section>
        )}

        {/* Fallback for roles without configuration */}
        {!hero && widgets.length === 0 && modules.length === 0 && (
          <div className="liquid-glass-widget text-center py-12">
            <p className="text-muted-foreground">
              Tu rol aún no tiene configuración de home personalizada.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
