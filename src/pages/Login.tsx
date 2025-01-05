import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

const Login: React.FC = () => {
  const { keycloak, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized) {
      if (keycloak?.authenticated) {
        navigate("/");
      } else {
        keycloak?.login();
      }
    }
  }, [keycloak, initialized, navigate]);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default Login;
