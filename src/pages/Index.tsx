
import { Navigate } from "react-router-dom";

const Index = () => {
  // Redirect to home page instead of dashboard
  return <Navigate to="/home" replace />;
};

export default Index;
