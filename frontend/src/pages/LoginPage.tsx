import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    nombre: "",
    rol: "operador"
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await register(form.email, form.password, form.nombre, form.rol);
      } else {
        await login(form.email, form.password);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: 16
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 24, textAlign: "center" }}>LeanShop</h1>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14, textAlign: "center" }}>
          {isRegister ? "Crear cuenta" : "Iniciar sesión"}
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          {isRegister && (
            <label style={labelStyle()}>
              Nombre
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                style={inputStyle()}
                placeholder="Tu nombre"
                required
              />
            </label>
          )}

          <label style={labelStyle()}>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle()}
              placeholder="tu@email.com"
              required
            />
          </label>

          <label style={labelStyle()}>
            Contraseña
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={inputStyle()}
              placeholder="••••••••"
              required
            />
          </label>

          {isRegister && (
            <label style={labelStyle()}>
              Rol
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
                style={inputStyle()}
              >
                <option value="admin">Admin</option>
                <option value="operador">Operador</option>
                <option value="visor">Visor</option>
              </select>
            </label>
          )}

          {error && (
            <p style={{ margin: 0, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              border: "none",
              borderRadius: 10,
              padding: "12px",
              background: loading ? "#94a3b8" : "#2563eb",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer"
            }}
          >
            {loading ? "Cargando..." : isRegister ? "Registrarse" : "Iniciar sesión"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
          }}
          style={{
            marginTop: 16,
            width: "100%",
            border: "none",
            background: "transparent",
            color: "#2563eb",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer"
          }}
        >
          {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
        </button>
      </div>
    </div>
  );
}

function labelStyle(): CSSProperties {
  return { display: "grid", gap: 6, fontSize: 13 };
}

function inputStyle(): CSSProperties {
  return {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none"
  };
}
