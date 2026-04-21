import type { CSSProperties } from "react";
import { NavLink, Outlet } from "react-router-dom";

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
      <header style={{ padding: "16px 16px 8px", borderBottom: "1px solid #e2e8f0" }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Lean Taller</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Registro de estructuras metalicas</p>
      </header>

      <main style={{ flex: 1, padding: 16 }}>
        <Outlet />
      </main>

      <nav style={{ display: "flex", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <NavLink to="/dashboard" style={navLinkStyle}>
          Dashboard
        </NavLink>
        <NavLink to="/estructuras" style={navLinkStyle}>
          Estructuras
        </NavLink>
      </nav>
    </div>
  );
}
