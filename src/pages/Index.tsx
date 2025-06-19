
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Immediate redirect to properties page
    navigate('/properties', { replace: true });
  }, [navigate]);

  // Return null to avoid any flash of content during redirect
  return null;
};

export default Index;
