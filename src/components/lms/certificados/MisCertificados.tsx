import { useState } from "react";
import { useLMSCertificados, Certificado } from "@/hooks/useLMSCertificados";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CertificadoCard } from "./CertificadoCard";
import { CertificadoViewer } from "./CertificadoViewer";
import { Award, FileX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const MisCertificados = () => {
  const { data: certificados, isLoading } = useLMSCertificados();
  const [selectedCertificado, setSelectedCertificado] = useState<Certificado | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Mis Certificados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Mis Certificados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certificados && certificados.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certificados.map((cert) => (
                <CertificadoCard
                  key={cert.id}
                  certificado={cert}
                  onView={() => setSelectedCertificado(cert)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Aún no tienes certificados</p>
              <p className="text-sm">Completa cursos para obtener tus certificados</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CertificadoViewer
        certificado={selectedCertificado}
        open={!!selectedCertificado}
        onClose={() => setSelectedCertificado(null)}
      />
    </>
  );
};
