// src/App.tsx
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./Keycloak";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Whiteboard from "./pages/Whiteboard";
import PrivateRoute from "./components/PrivateRoute";
import { WebSocketProvider } from "./contexts/WebSocketContext";

function App() {
  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: "check-sso",
        silentCheckSsoRedirectUri:
          window.location.origin + "/silent-check-sso.html",
      }}
    >
      <WebSocketProvider>
        <BrowserRouter>
          <div className="app">
            <Navbar />
            <Routes>
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/whiteboard/:id"
                element={
                  <PrivateRoute>
                    <Whiteboard />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </WebSocketProvider>
    </ReactKeycloakProvider>
  );
}

export default App;
