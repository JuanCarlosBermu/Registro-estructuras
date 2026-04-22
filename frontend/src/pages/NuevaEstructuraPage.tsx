import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTiposEstructura, postEstructura } from "../lib/api";
import type { TipoEstructura } from "../types";

export default function NuevaEstructuraPage() {
  const navigate = useNavigate();
  const [tipos, setTipos] = useState<TipoEstructura[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    tipo_id: 1,
    descripcion: "",
    cantidad_fabricada: 1,
    fecha_inicio: new Date().toISOString().slice(0, 10),
    fecha_termino: "",
    responsable: "",
    costo_estimado: "",
    observaciones: ""
  });

  useEffect(() => {
    getTiposEstructura()
      .then((items) => {
        const activos = items.filter((item) => item.activo);
        setTipos(activos);
        if (activos.length > 0) {
          setForm((prev) => ({ ...prev, tipo_id: activos[0].id }));
        }
      })
      .catch(() => setTipos([]));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.descripcion.trim() || !form.responsable.trim()) {
      setError("Completa descripcion y responsable.");
      return;
    }

    if (form.cantidad_fabricada <= 0) {
      setError("La cantidad debe ser mayor a 0.");
      return;
    }

    setSaving(true);
    try {
      await postEstructura({
        tipo_id: form.tipo_id,
        descripcion: form.descripcion.trim(),
        cantidad_fabricada: form.cantidad_fabricada,
        fecha_inicio: form.fecha_inicio,
        fecha_termino: form.fecha_termino.trim() ? form.fecha_termino : null,
        responsable: form.responsable.trim(),
        costo_estimado: form.costo_estimado.trim() ? Number(form.costo_estimado) : null,
        observaciones: form.observaciones.trim() ? form.observaciones.trim() : null
      });
      navigate("/estructuras");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo crear la estructura.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>Nueva estructura</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label style={labelStyle()}>
          Tipo de estructura
          <select
            value={form.tipo_id}
            onChange={(e) => setForm({ ...form, tipo_id: Number(e.target.value) })}
            style={inputStyle()}
          >
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle()}>
          Descripcion
          <input
            type="text"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            style={inputStyle()}
            placeholder="Ej. Conveyor de rodillos 3m"
          />
        </label>

        <label style={labelStyle()}>
          Cantidad fabricada
          <input
            type="number"
            min={1}
            value={form.cantidad_fabricada}
            onChange={(e) => setForm({ ...form, cantidad_fabricada: Number(e.target.value) })}
            style={inputStyle()}
          />
        </label>

        <label style={labelStyle()}>
          Fecha inicio
          <input
            type="date"
            value={form.fecha_inicio}
            onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
            style={inputStyle()}
          />
        </label>

        <label style={labelStyle()}>
          Fecha termino (opcional)
          <input
            type="date"
            value={form.fecha_termino}
            onChange={(e) => setForm({ ...form, fecha_termino: e.target.value })}
            style={inputStyle()}
          />
        </label>

        <label style={labelStyle()}>
          Responsable
          <input
            type="text"
            value={form.responsable}
            onChange={(e) => setForm({ ...form, responsable: e.target.value })}
            style={inputStyle()}
            placeholder="Nombre"
          />
        </label>

        <label style={labelStyle()}>
          Costo estimado (opcional)
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.costo_estimado}
            onChange={(e) => setForm({ ...form, costo_estimado: e.target.value })}
            style={inputStyle()}
          />
        </label>

        <label style={labelStyle()}>
          Observaciones
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            style={{ ...inputStyle(), minHeight: 72, resize: "vertical" }}
          />
        </label>

        {error ? <p style={{ margin: 0, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{error}</p> : null}

        <button
          type="submit"
          disabled={saving}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "10px 12px",
            background: saving ? "#94a3b8" : "#16a34a",
            color: "#fff",
            fontWeight: 700
          }}
        >
          {saving ? "Guardando..." : "Crear estructura"}
        </button>

        <Link to="/estructuras" style={{ textAlign: "center", color: "#2563eb", fontWeight: 600 }}>
          Regresar
        </Link>
      </form>
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
