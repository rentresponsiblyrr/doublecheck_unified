
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to properties page
    navigate('/properties');
  }, [navigate]);

  return <LoadingSpinner />;
};

export default Index;
