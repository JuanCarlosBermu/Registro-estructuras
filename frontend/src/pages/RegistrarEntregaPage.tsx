import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getUnidades, postEntrega } from "../lib/api";
import type { UnidadNegocio } from "../types";

export default function RegistrarEntregaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([]);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const [form, setForm] = useState({
    unidad_id: 1,
    cantidad_entregada: 1,
    fecha_entrega: new Date().toISOString().slice(0, 10),
    recibido_por: "",
    comentarios: ""
  });

  useEffect(() => {
    getUnidades()
      .then((items) => {
        setUnidades(items);
        if (items.length > 0) {
          setForm((prev) => ({ ...prev, unidad_id: items[0].id }));
        }
      })
      .catch(() => setUnidades([]));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) {
      setError("No se encontro la estructura");
      return;
    }

    if (!form.recibido_por.trim()) {
      setError("Recibido por es obligatorio");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await postEntrega(id, {
        unidad_id: form.unidad_id,
        cantidad_entregada: form.cantidad_entregada,
        fecha_entrega: form.fecha_entrega,
        recibido_por: form.recibido_por.trim(),
        comentarios: form.comentarios.trim() ? form.comentarios.trim() : null
      });
      navigate("/estructuras");
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message ?? "No se pudo registrar la entrega");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>Registrar entrega</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
          Unidad de negocio
          <select
            value={form.unidad_id}
            onChange={(e) => setForm({ ...form, unidad_id: Number(e.target.value) })}
            style={inputStyle()}
          >
            {unidades.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {unidad.nombre}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
          Cantidad entregada
          <input
            type="number"
            min={1}
            value={form.cantidad_entregada}
            onChange={(e) => setForm({ ...form, cantidad_entregada: Number(e.target.value) })}
            style={inputStyle()}
          />
        </label>

        <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
          Fecha de entrega
          <input
            type="date"
            value={form.fecha_entrega}
            onChange={(e) => setForm({ ...form, fecha_entrega: e.target.value })}
            style={inputStyle()}
          />
        </label>

        <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
          Recibido por
          <input
            type="text"
            value={form.recibido_por}
            onChange={(e) => setForm({ ...form, recibido_por: e.target.value })}
            placeholder="Nombre"
            style={inputStyle()}
          />
        </label>

        <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
          Comentarios
          <textarea
            value={form.comentarios}
            onChange={(e) => setForm({ ...form, comentarios: e.target.value })}
            style={{ ...inputStyle(), minHeight: 80, resize: "vertical" }}
          />
        </label>

        {error ? (
          <p style={{ margin: 0, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "10px 12px",
            background: saving ? "#94a3b8" : "#2563eb",
            color: "#fff",
            fontWeight: 700
          }}
        >
          {saving ? "Guardando..." : "Guardar entrega"}
        </button>

        <Link to="/estructuras" style={{ textAlign: "center", color: "#2563eb", fontWeight: 600 }}>
          Regresar
        </Link>
      </form>
    </div>
  );
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
