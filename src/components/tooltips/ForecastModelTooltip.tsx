import React from 'react';

export const ForecastModelTooltip: React.FC = () => {
  return (
    <div className="max-w-md space-y-3">
      <h4 className="text-sm font-semibold">Algoritmo de Predicción · Ensemble AI</h4>
      <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
        <p>
          Diseño propietario basado en un ensemble ponderado de modelos especializados. Cada
          componente aporta una perspectiva distinta del patrón temporal y la combinación
          se optimiza para minimizar el error de pronóstico.
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            Componentes: Holt-Winters (suavizado exponencial triple con estacionalidad),
            tendencia lineal robusta (regresión regularizada), estacionalidad intra‑mes
            (descomposición tipo STL), aceleración/momentum (derivadas sobre series suavizadas)
            y ajustes externos (señales de negocio/eventos).
          </li>
          <li>
            Optimización: pesos w_i ≥ 0, Σw_i = 1. Se calibran por backtesting walk‑forward
            minimizando sMAPE con regularización L2 para evitar sobreajuste.
          </li>
          <li>
            Métricas: sMAPE primaria (reportamos sMAPE/MAPE). El nivel de confianza deriva de la
            varianza residual, estabilidad de pesos y calidad de datos (completitud/anomalías).
          </li>
          <li>
            Salvaguardas: detección y atenuación de outliers (IQR/Winsorization), imputación con EMA
            y límites a cambios extremos para mantener estabilidad operativa.
          </li>
          <li>
            Lógica final: forecast = Σ w_i · y_i. Bandas de confianza a partir de σ_residual y
            recalibración periódica con datos recientes.
          </li>
        </ul>
      </div>
    </div>
  );
};
