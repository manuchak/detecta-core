
import { Navigate } from "react-router-dom";

const Index = () => {
  // Redirect to landing page instead of dashboard
  return <Navigate to="/" replace />;
};

export default Index;
