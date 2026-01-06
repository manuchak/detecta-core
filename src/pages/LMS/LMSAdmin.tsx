import { useState } from "react";
import { BookOpen, Users, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LMSCursosLista } from "@/components/lms/admin/LMSCursosLista";
import { LMSInscripcionesPanel } from "@/components/lms/admin/LMSInscripcionesPanel";
import { CustomBreadcrumb } from "@/components/ui/custom-breadcrumb";

export default function LMSAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cursos");

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      {/* Breadcrumb */}
      <CustomBreadcrumb 
        items={[
          { label: "LMS", href: "/lms" },
          { label: "Administración" }
        ]} 
      />

      {/* Header - Apple Style */}
      <div className="apple-section-header">
        <div>
          <h1 className="apple-text-largetitle">Administración LMS</h1>
          <p className="apple-text-subtitle mt-1">
            Gestiona cursos, usuarios y configuración del sistema de aprendizaje
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/lms/reportes')}>
          <BarChart3 className="w-4 h-4 mr-2" />
          Ver Reportes
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="cursos" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Cursos
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="w-4 h-4" />
            Inscripciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cursos" className="mt-6">
          <LMSCursosLista />
        </TabsContent>

        <TabsContent value="usuarios" className="mt-6">
          <LMSInscripcionesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
