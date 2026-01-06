import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LMSAdopcionDashboard } from "@/components/lms/reportes/LMSAdopcionDashboard";
import { LMSProgresoDashboard } from "@/components/lms/reportes/LMSProgresoDashboard";
import { LMSRendimientoDashboard } from "@/components/lms/reportes/LMSRendimientoDashboard";
import { LMSGamificacionDashboard } from "@/components/lms/reportes/LMSGamificacionDashboard";
import { BarChart3, Users, Target, Trophy } from "lucide-react";

export default function LMSReportes() {
  return (
    <div className="container max-w-7xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reportes LMS</h1>
        <p className="text-muted-foreground mt-1">
          Análisis completo de adopción, progreso, rendimiento y gamificación
        </p>
      </div>

      <Tabs defaultValue="adopcion" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="adopcion" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Adopción</span>
          </TabsTrigger>
          <TabsTrigger value="progreso" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Progreso</span>
          </TabsTrigger>
          <TabsTrigger value="rendimiento" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Rendimiento</span>
          </TabsTrigger>
          <TabsTrigger value="gamificacion" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Gamificación</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adopcion">
          <LMSAdopcionDashboard />
        </TabsContent>

        <TabsContent value="progreso">
          <LMSProgresoDashboard />
        </TabsContent>

        <TabsContent value="rendimiento">
          <LMSRendimientoDashboard />
        </TabsContent>

        <TabsContent value="gamificacion">
          <LMSGamificacionDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
