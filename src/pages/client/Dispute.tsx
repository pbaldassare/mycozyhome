import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

// Disputes are now handled through the Support system
export default function ClientDispute() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/client/support", { replace: true });
  }, [navigate]);

  return null;
}
