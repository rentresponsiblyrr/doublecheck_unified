
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  console.log('🏠 Index page loading - redirecting to properties');

  useEffect(() => {
    // Immediate redirect to properties page without any loading state
    navigate('/properties', { replace: true });
  }, [navigate]);

  // Return null to avoid any flash of content during redirect
  return null;
};

export default Index;
