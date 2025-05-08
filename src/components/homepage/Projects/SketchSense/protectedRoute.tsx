import React, { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import api from "./lib_sketchsense/axios";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/@me");
        setIsAuthenticated(response.status === 200);
      } catch (err) {
        console.error("Unauthorized:", err);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) return <div>Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/sketchsense" replace />;
};

export default ProtectedRoute;
