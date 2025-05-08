
import { Navigate } from "react-router-dom";

const Index = () => {
  // Redirect to dashboard - this is also handled in App.tsx
  return <Navigate to="/dashboard" replace />;
};

export default Index;
