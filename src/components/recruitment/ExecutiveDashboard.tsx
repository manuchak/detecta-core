import React from "react";
import { useUnifiedRecruitmentMetrics } from "@/hooks/useUnifiedRecruitmentMetrics";
import { RealRotationCard } from './RealRotationCard';

export const ExecutiveDashboard = () => {
  const { 
    metrics, 
    loading, 
    realRotation, 
    realRotationLoading, 
    fetchAll 
  } = useUnifiedRecruitmentMetrics();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RealRotationCard 
          data={realRotation} 
          loading={realRotationLoading} 
        />
      </div>
    </div>
  );
};
