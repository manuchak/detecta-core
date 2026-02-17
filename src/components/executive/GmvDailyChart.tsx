import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { DollarSign } from 'lucide-react';
import { useExecutiveMultiYearData } from '@/hooks/useExecutiveMultiYearData';

/** Polynomial least-squares fit (degree n). Returns coefficients [a0, a1, …, an]. */
function polyFit(xs: number[], ys: number[], degree: number): number[] {
  const n = degree + 1;
  const m = xs.length;
  // Build normal matrix A·c = b
  const A: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const b: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < m; k++) s += Math.pow(xs[k], i + j);
      A[i][j] = s;
    }
    let s = 0;
    for (let k = 0; k < m; k++) s += ys[k] * Math.pow(xs[k], i);
    b[i] = s;
  }
  // Gaussian elimination
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) maxRow = row;
    [A[col], A[maxRow]] = [A[maxRow], A[col]];
    [b[col], b[maxRow]] = [b[maxRow], b[col]];
    if (Math.abs(A[col][col]) < 1e-12) continue;
    for (let row = col + 1; row < n; row++) {
      const f = A[row][col] / A[col][col];
      for (let j = col; j < n; j++) A[row][j] -= f * A[col][j];
      b[row] -= f * b[col];
    }
  }
  const c = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * c[j];
    c[i] = Math.abs(A[i][i]) > 1e-12 ? s / A[i][i] : 0;
  }
  return c;
}

function evalPoly(coeffs: number[], x: number): number {
  return coeffs.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0);
}

export const GmvDailyChart = () => {
  const { dailyCurrent, loading } = useExecutiveMultiYearData();

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const dataWithTrend = useMemo(() => {
    if (!dailyCurrent?.length) return dailyCurrent;
    // Only fit on days with actual data (gmv > 0)
    const realPoints = dailyCurrent
      .map((d: any, i: number) => ({ x: i, y: d.gmv }))
      .filter((p: any) => p.y > 0);
    if (realPoints.length < 3) return dailyCurrent;
    const coeffs = polyFit(
      realPoints.map((p: any) => p.x),
      realPoints.map((p: any) => p.y),
      Math.min(3, realPoints.length - 1)
    );
    return dailyCurrent.map((d: any, i: number) => ({
      ...d,
      gmvTrend: d.gmv > 0 ? Math.max(0, evalPoly(coeffs, i)) : undefined,
    }));
  }, [dailyCurrent]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />GMV Diario
          </CardTitle>
        </CardHeader>
        <CardContent><div className="h-[280px] animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />GMV Diario (Mes Actual)
          </CardTitle>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: 'hsl(30 80% 55%)' }} />
            Tendencia
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dataWithTrend} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradientDailyGmv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="dayLabel" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={{ stroke: 'hsl(var(--border))' }} width={50} />
              <Tooltip content={({ active, payload }) => {
                if (active && payload?.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-foreground">Día {d.day}</p>
                      <p className="text-sm text-muted-foreground">GMV: {formatCurrency(d.gmv)}</p>
                      {d.gmvTrend != null && <p className="text-sm" style={{ color: 'hsl(30 80% 55%)' }}>Tendencia: {formatCurrency(d.gmvTrend)}</p>}
                      <p className="text-sm text-muted-foreground">{d.services} servicios</p>
                    </div>
                  );
                }
                return null;
              }} />
              <Area type="monotone" dataKey="gmv" fill="url(#gradientDailyGmv)" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 3 }} activeDot={{ r: 5 }}>
                <LabelList dataKey="gmv" position="top" formatter={(v: number) => v > 0 ? formatCurrency(v) : ''} style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: 500 }} />
              </Area>
              <Line type="monotone" dataKey="gmvTrend" stroke="hsl(30 80% 55%)" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
