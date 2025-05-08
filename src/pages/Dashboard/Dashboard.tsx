
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Map, MessageSquare, ArrowUp, ArrowDown } from "lucide-react";

export const Dashboard = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 md:px-0 animate-fade-in">
      <div className="py-6">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Lead Flow Navigator
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">1,245</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">12%</span> desde el mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Servicios Activos</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">342</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">8%</span> desde el mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Instalaciones</CardTitle>
            <Map className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">89</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
              <span className="text-red-500">3%</span> desde el mes anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-apple hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tickets Abiertos</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">32</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowDown className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">5%</span> desde el mes anterior
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 card-apple">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Rendimiento de Servicios</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <div className="text-muted-foreground flex flex-col items-center">
              <div className="w-64 h-64 bg-accent rounded-full flex items-center justify-center">
                <p className="font-medium text-accent-foreground">Conecte a Supabase para<br/>visualizar gráficos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 card-apple">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Estado de Leads</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">Nuevos</p>
                  <p className="text-sm font-medium">235</p>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary w-[45%]" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">En proceso</p>
                  <p className="text-sm font-medium">489</p>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary w-[75%]" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">En aprobación</p>
                  <p className="text-sm font-medium">324</p>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary w-[60%]" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">Aprobados</p>
                  <p className="text-sm font-medium">158</p>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary w-[30%]" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">Rechazados</p>
                  <p className="text-sm font-medium">39</p>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-destructive w-[8%]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="card-apple mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Tickets recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-secondary/50 p-8">
            <div className="text-muted-foreground text-center flex flex-col items-center">
              <Calendar className="h-8 w-8 mb-2 opacity-50" />
              <p>Conecte a Supabase para cargar datos en tiempo real</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
