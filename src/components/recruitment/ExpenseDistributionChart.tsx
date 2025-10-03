import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useCPADetails } from '@/hooks/useCPADetails';

const COLORS = {
  staff: '#3b82f6',      // Blue - matches the blue metric card
  technology: '#8b5cf6',  // Purple - matches the purple metric card  
  recruitment: '#10b981', // Green - matches the green metric card
  marketing: '#f59e0b',   // Orange - matches the orange metric card
};

const LABELS = {
  staff: 'Personal',
  technology: 'Tecnología',
  recruitment: 'Reclutamiento',
  marketing: 'Marketing',
};

export const ExpenseDistributionChart = () => {
  const { cpaDetails, loading } = useCPADetails();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = [
    {
      name: LABELS.staff,
      value: cpaDetails.yearlyBreakdown.costBreakdown.staff,
      key: 'staff',
    },
    {
      name: LABELS.technology,
      value: cpaDetails.yearlyBreakdown.costBreakdown.technology,
      key: 'technology',
    },
    {
      name: LABELS.recruitment,
      value: cpaDetails.yearlyBreakdown.costBreakdown.recruitment,
      key: 'recruitment',
    },
    {
      name: LABELS.marketing,
      value: cpaDetails.yearlyBreakdown.costBreakdown.marketing,
      key: 'marketing',
    },
  ].filter(item => item.value > 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribución de Costos</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.key as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos de distribución disponibles
          </div>
        )}
      </CardContent>
    </Card>
  );
};
