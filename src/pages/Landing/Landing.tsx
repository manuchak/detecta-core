
import React from 'react';
import { Link } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/landing/Logo';

const Landing = () => {
  const { user, loading } = useAuth();
  
  // Solo redirigir si el usuario está autenticado y no estamos cargando
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden md:flex gap-6 items-center">
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Beneficios</a>
            <a href="#for-who" className="text-sm text-muted-foreground hover:text-foreground transition-colors">¿Para quién?</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Características</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonios</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preguntas frecuentes</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-orange-500 hover:bg-orange-600">Únete como Custodio</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <HeroSection />

        {/* Benefits Section */}
        <BenefitsSection id="benefits" />
        
        {/* For Who Section */}
        <ForWhoSection id="for-who" />
        
        {/* Features Section */}
        <FeaturesSection id="features" />
        
        {/* Testimonials Section */}
        <TestimonialsSection id="testimonials" />
        
        {/* Integrations Section */}
        <IntegrationsSection />
        
        {/* Earnings Section (Replaces Pricing) */}
        <PricingSection id="earnings" />
        
        {/* FAQ Section */}
        <FaqSection id="faq" />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
