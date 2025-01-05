import React from "react";
import { Navigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <div>Loading...</div>;
  }

  if (!keycloak?.authenticated) {
    try {
      keycloak?.login({
        redirectUri: window.location.origin,
      });
      return null;
    } catch (error) {
      console.error("Login failed:", error);
      return <Navigate to="/" />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
