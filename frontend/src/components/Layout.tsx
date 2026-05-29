import type { CSSProperties } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navLinkStyle = ({ isActive }: { isActive: boolean }): CSSProperties => ({
  flex: 1,
  textAlign: "center",
  textDecoration: "none",
  padding: "10px 8px",
  color: isActive ? "#2563eb" : "#475569",
  fontWeight: isActive ? 700 : 600,
  fontSize: 14
});

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "0 auto",
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 0 0 1px #e2e8f0"
      }}
    >
      <header style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div style={{ padding: "12px 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18 }}>LeanShop</h1>
            <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 13 }}>Registro de estructuras creeform</p>
          </div>
          {user && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>{user.nombre}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "capitalize" }}>{user.rol}</div>
              <button
                onClick={logout}
                style={{
                  marginTop: 4,
                  border: "none",
                  background: "transparent",
                  color: "#dc2626",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
        <nav style={{ display: "flex", borderTop: "1px solid #e2e8f0" }}>
          <NavLink to="/dashboard" style={navLinkStyle}>
            Dashboard
          </NavLink>
          <NavLink to="/estructuras" style={navLinkStyle}>
            Estructuras
          </NavLink>
          <NavLink to="/catalogos" style={navLinkStyle}>
            Catalogos
          </NavLink>
        </nav>
      </header>

      <main style={{ flex: 1, padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
