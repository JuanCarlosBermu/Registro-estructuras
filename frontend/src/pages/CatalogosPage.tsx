import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  deleteModeloTipo,
  deleteTipoEstructura,
  deleteUnidadNegocio,
  getTiposEstructura,
  getUnidades,
  postTipoEstructura,
  postUnidadNegocio,
  uploadModeloTipo
} from "../lib/api";
import type { TipoEstructura, UnidadNegocio } from "../types";
import TipoIcon from "../components/TipoIcon";

export default function CatalogosPage() {
  const [tipos, setTipos] = useState<TipoEstructura[]>([]);
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([]);
  const [newTipo, setNewTipo] = useState("");
  const [newUnidad, setNewUnidad] = useState({ nombre: "", ubicacion: "RAM" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  async function loadCatalogs() {
    const [tiposData, unidadesData] = await Promise.all([getTiposEstructura(), getUnidades()]);
    setTipos(tiposData);
    setUnidades(unidadesData);
  }

  useEffect(() => {
    loadCatalogs().catch(() => {
      setError("No se pudieron cargar los catalogos.");
    });
  }, []);

  async function onAddTipo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!newTipo.trim()) {
      setError("Escribe un nombre de tipo.");
      return;
    }
    try {
      await postTipoEstructura(newTipo.trim());
      setNewTipo("");
      await loadCatalogs();
      setSuccess("Tipo agregado correctamente.");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo agregar el tipo.");
    }
  }

  async function onRemoveTipo(id: number) {
    setError("");
    setSuccess("");
    try {
      await deleteTipoEstructura(id);
      await loadCatalogs();
      setSuccess("Tipo quitado correctamente.");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo quitar el tipo.");
    }
  }

  async function onUploadModelo(id: number, file: File) {
    setError("");
    setSuccess("");
    setUploadingId(id);
    try {
      await uploadModeloTipo(id, file);
      await loadCatalogs();
      setSuccess("Modelo 3D subido correctamente.");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo subir el modelo.");
    } finally {
      setUploadingId(null);
    }
  }

  async function onRemoveModelo(id: number) {
    setError("");
    setSuccess("");
    try {
      await deleteModeloTipo(id);
      await loadCatalogs();
      setSuccess("Modelo 3D eliminado.");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo eliminar el modelo.");
    }
  }

  async function onAddUnidad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!newUnidad.nombre.trim()) {
      setError("Escribe un nombre de unidad.");
      return;
    }
    try {
      await postUnidadNegocio({
        nombre: newUnidad.nombre.trim(),
        ubicacion: newUnidad.ubicacion.trim()
      });
      setNewUnidad({ nombre: "", ubicacion: "RAM" });
      await loadCatalogs();
      setSuccess("Unidad agregada correctamente.");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo agregar la unidad.");
    }
  }

  async function onRemoveUnidad(id: number) {
    setError("");
    setSuccess("");
    try {
      await deleteUnidadNegocio(id);
      await loadCatalogs();
      setSuccess("Unidad quitada correctamente.");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo quitar la unidad.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={cardStyle()}>
        <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>Tipos de estructura</h2>

        <form onSubmit={onAddTipo} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            style={{ ...inputStyle(), flex: 1 }}
            value={newTipo}
            onChange={(e) => setNewTipo(e.target.value)}
            placeholder="Nuevo tipo"
          />
          <button type="submit" style={primaryButton()}>
            Agregar
          </button>
        </form>

        <div style={{ display: "grid", gap: 8 }}>
          {tipos.map((item) => (
            <div key={item.id} style={tipoRowStyle()}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <TipoIcon tipo={item.nombre} size={44} color="#2563eb" modeloUrl={item.modelo_url} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.nombre}</div>
                  {item.modelo_url ? (
                    <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Modelo 3D cargado</div>
                  ) : (
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Sin modelo 3D</div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <input
                  ref={(el) => { fileRefs.current[item.id] = el; }}
                  type="file"
                  accept=".glb"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadModelo(item.id, file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  style={uploadButton()}
                  disabled={uploadingId === item.id}
                  onClick={() => fileRefs.current[item.id]?.click()}
                >
                  {uploadingId === item.id ? "..." : item.modelo_url ? "Cambiar 3D" : "Subir 3D"}
                </button>
                {item.modelo_url && (
                  <button type="button" style={removeModelButton()} onClick={() => onRemoveModelo(item.id)}>
                    Quitar 3D
                  </button>
                )}
                <button type="button" style={dangerButton()} onClick={() => onRemoveTipo(item.id)}>
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={cardStyle()}>
        <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>Unidades de negocio</h2>

        <form onSubmit={onAddUnidad} style={{ display: "grid", gap: 8, marginBottom: 10 }}>
          <input
            style={inputStyle()}
            value={newUnidad.nombre}
            onChange={(e) => setNewUnidad((prev) => ({ ...prev, nombre: e.target.value }))}
            placeholder="Nombre de unidad"
          />
          <input
            style={inputStyle()}
            value={newUnidad.ubicacion}
            onChange={(e) => setNewUnidad((prev) => ({ ...prev, ubicacion: e.target.value }))}
            placeholder="Ubicacion (opcional)"
          />
          <button type="submit" style={primaryButton()}>
            Agregar unidad
          </button>
        </form>

        <div style={{ display: "grid", gap: 8 }}>
          {unidades.map((item) => (
            <div key={item.id} style={rowStyle()}>
              <div>
                <strong style={{ fontSize: 14 }}>{item.nombre}</strong>
                <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 12 }}>{item.ubicacion || "Sin ubicacion"}</p>
              </div>
              <button type="button" style={dangerButton()} onClick={() => onRemoveUnidad(item.id)}>
                Quitar
              </button>
            </div>
          ))}
        </div>
      </section>

      {error ? <p style={{ margin: 0, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{error}</p> : null}
      {success ? <p style={{ margin: 0, color: "#15803d", fontSize: 13, fontWeight: 600 }}>{success}</p> : null}
    </div>
  );
}

function cardStyle(): CSSProperties {
  return {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
    background: "#fff"
  };
}

function rowStyle(): CSSProperties {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "8px 10px"
  };
}

function tipoRowStyle(): CSSProperties {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "8px 10px",
    gap: 8,
    flexWrap: "wrap"
  };
}

function inputStyle(): CSSProperties {
  return {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14
  };
}

function primaryButton(): CSSProperties {
  return {
    border: "none",
    borderRadius: 10,
    padding: "10px 12px",
    background: "#16a34a",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer"
  };
}

function dangerButton(): CSSProperties {
  return {
    border: "none",
    borderRadius: 10,
    padding: "8px 10px",
    background: "#dc2626",
    color: "#fff",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer"
  };
}

function uploadButton(): CSSProperties {
  return {
    border: "none",
    borderRadius: 10,
    padding: "8px 10px",
    background: "#7c3aed",
    color: "#fff",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer"
  };
}

function removeModelButton(): CSSProperties {
  return {
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "8px 10px",
    background: "#fff",
    color: "#64748b",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer"
  };
}
