// src/contexts/AuthContext.tsx
import React from "react";
import { AuthProvider as OidcProvider } from "react-oidc-context";

const oidcConfig = {
  authority: "http://localhost:8080/realms/myrealm",
  client_id: "myclient",
  redirect_uri: "http://localhost:5127",
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <OidcProvider {...oidcConfig}>{children}</OidcProvider>;
};
