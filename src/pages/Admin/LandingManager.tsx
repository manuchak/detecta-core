
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestimonialsManager } from '@/components/admin/landing/TestimonialsManager';
import { HeroManager } from '@/components/admin/landing/HeroManager';
import { BenefitsManager } from '@/components/admin/landing/BenefitsManager';
import { PricesManager } from '@/components/admin/landing/PricesManager';
import { FaqManager } from '@/components/admin/landing/FaqManager';

const LandingManager = () => {
  const [activeTab, setActiveTab] = useState('testimonios');

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Administrador de Landing Page</h1>
        <Link to="/" className="text-sm text-primary hover:underline">
          Ver Landing Page
        </Link>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="testimonios">Testimonios</TabsTrigger>
          <TabsTrigger value="hero">Sección Hero</TabsTrigger>
          <TabsTrigger value="beneficios">Beneficios</TabsTrigger>
          <TabsTrigger value="precios">Precios</TabsTrigger>
          <TabsTrigger value="faq">Preguntas Frecuentes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="testimonios" className="space-y-6">
          <TestimonialsManager />
        </TabsContent>
        
        <TabsContent value="hero">
          <HeroManager />
        </TabsContent>
        
        <TabsContent value="beneficios">
          <BenefitsManager />
        </TabsContent>
        
        <TabsContent value="precios">
          <PricesManager />
        </TabsContent>
        
        <TabsContent value="faq">
          <FaqManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LandingManager;
