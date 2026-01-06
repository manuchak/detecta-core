import { useState } from "react";
import { BookOpen, Users, BarChart3, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { LMSCursosLista } from "@/components/lms/admin/LMSCursosLista";
import { LMSInscripcionesPanel } from "@/components/lms/admin/LMSInscripcionesPanel";

export default function LMSAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cursos");

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Administración LMS</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona cursos, usuarios y configuración del sistema de aprendizaje
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/lms/reportes')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver Reportes
          </Button>
          <Button onClick={() => navigate('/lms/admin/cursos/nuevo')}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Curso
          </Button>
        </div>
      </div>

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
