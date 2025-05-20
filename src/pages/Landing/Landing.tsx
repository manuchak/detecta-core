
import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { HeroSection } from '@/components/landing/HeroSection';
import { BenefitsSection } from '@/components/landing/BenefitsSection';
import { ForWhoSection } from '@/components/landing/ForWhoSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { IntegrationsSection } from '@/components/landing/IntegrationsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { Footer } from '@/components/landing/Footer';
import { Logo } from '@/components/landing/Logo';
import { Button } from '@/components/ui/button';

const Landing = () => {
  const { user } = useAuth();
  
  // Si el usuario está autenticado, redirigir al dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden md:flex gap-6 items-center">
            <Link to="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Características</Link>
            <Link to="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Precios</Link>
            <Link to="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonios</Link>
            <Link to="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
            <Link to="/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <HeroSection />

        {/* Benefits Section */}
        <BenefitsSection />
        
        {/* For Who Section */}
        <ForWhoSection />
        
        {/* Features Section */}
        <FeaturesSection id="features" />
        
        {/* Testimonials Section */}
        <TestimonialsSection id="testimonials" />
        
        {/* Integrations Section */}
        <IntegrationsSection />
        
        {/* Pricing Section */}
        <PricingSection id="pricing" />
        
        {/* FAQ Section */}
        <FaqSection id="faq" />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
