import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import CatalogosPage from "./pages/CatalogosPage";
import DashboardPage from "./pages/DashboardPage";
import EstructurasPage from "./pages/EstructurasPage";
import NuevaEstructuraPage from "./pages/NuevaEstructuraPage";
import RegistrarEntregaPage from "./pages/RegistrarEntregaPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/estructuras" element={<EstructurasPage />} />
        <Route path="/estructuras/nueva" element={<NuevaEstructuraPage />} />
        <Route path="/estructuras/:id/entregar" element={<RegistrarEntregaPage />} />
        <Route path="/catalogos" element={<CatalogosPage />} />
      </Route>
    </Routes>
  );
}
