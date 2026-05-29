import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import Layout from "./components/Layout";
import CatalogosPage from "./pages/CatalogosPage";
import DashboardPage from "./pages/DashboardPage";
import EditarEstructuraPage from "./pages/EditarEstructuraPage";
import EstructuraDetallePage from "./pages/EstructuraDetallePage";
import EstructurasPage from "./pages/EstructurasPage";
import LoginPage from "./pages/LoginPage";
import NuevaEstructuraPage from "./pages/NuevaEstructuraPage";
import RegistrarEntregaPage from "./pages/RegistrarEntregaPage";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/estructuras" element={<EstructurasPage />} />
            <Route path="/estructuras/nueva" element={<NuevaEstructuraPage />} />
            <Route path="/estructuras/:id" element={<EstructuraDetallePage />} />
            <Route path="/estructuras/:id/editar" element={<EditarEstructuraPage />} />
            <Route path="/estructuras/:id/entregar" element={<RegistrarEntregaPage />} />
            <Route path="/catalogos" element={<CatalogosPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
