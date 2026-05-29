import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteEstructura, deleteEntrega, getEstructuraById, getEntregasByEstructura } from "../lib/api";
import type { Estructura } from "../types";
import StatusBadge from "../components/StatusBadge";
import TipoIcon from "../components/TipoIcon";

export default function EstructuraDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [estructura, setEstructura] = useState<Estructura | null>(null);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    Promise.all([getEstructuraById(id), getEntregasByEstructura(id)])
      .then(([estructuraData, entregasData]) => {
        setEstructura(estructuraData);
        setEntregas(entregasData);
      })
      .catch(() => {
        setEstructura(null);
        setEntregas([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!id) return;
    if (!confirm("¿Estás seguro de eliminar esta estructura?")) return;

    setDeleting(true);
    try {
      await deleteEstructura(id);
      navigate("/estructuras");
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "No se pudo eliminar la estructura");
      setDeleting(false);
    }
  }

  async function handleDeleteEntrega(entregaId: string) {
    if (!confirm("¿Estás seguro de eliminar esta entrega?")) return;

    try {
      await deleteEntrega(entregaId);
      if (id) {
        const [estructuraData, entregasData] = await Promise.all([
          getEstructuraById(id),
          getEntregasByEstructura(id)
        ]);
        setEstructura(estructuraData);
        setEntregas(entregasData);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "No se pudo eliminar la entrega");
    }
  }

  if (loading) {
    return <p style={{ textAlign: "center", color: "#64748b" }}>Cargando...</p>;
  }

  if (!estructura) {
    return <p style={{ textAlign: "center", color: "#dc2626" }}>Estructura no encontrada</p>;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Link
        to="/estructuras"
        style={{
          display: "inline-block",
          textDecoration: "none",
          color: "#2563eb",
          fontWeight: 600,
          fontSize: 14
        }}
      >
        ← Regresar
      </Link>

      <article
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          background: "#fff"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TipoIcon tipo={estructura.tipo_nombre ?? ""} size={48} color="#2563eb" modeloUrl={estructura.tipo_modelo_url} />
            <h2 style={{ margin: 0, fontSize: 18 }}>{estructura.folio}</h2>
          </div>
          <StatusBadge estado={estructura.estado} />
        </div>

        <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
          <div>
            <strong>Tipo:</strong> {estructura.tipo_nombre}
          </div>
          <div>
            <strong>Descripción:</strong> {estructura.descripcion}
          </div>
          <div>
            <strong>Unidad destino:</strong> {estructura.unidad_destino_nombre}
          </div>
          <div>
            <strong>Responsable:</strong> {estructura.responsable}
          </div>
          {estructura.linea_produccion && (
            <div>
              <strong>Línea de producción:</strong> {estructura.linea_produccion}
            </div>
          )}
          {estructura.estacion && (
            <div>
              <strong>Estación:</strong> {estructura.estacion}
            </div>
          )}
          <div>
            <strong>Fecha inicio:</strong> {estructura.fecha_inicio}
          </div>
          {estructura.fecha_termino && (
            <div>
              <strong>Fecha término:</strong> {estructura.fecha_termino}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#f8fafc",
            borderRadius: 8,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            textAlign: "center"
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Fabricada</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{estructura.cantidad_fabricada}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Entregada</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>
              {estructura.cantidad_entregada_total ?? 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Pendiente</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>
              {estructura.saldo_pendiente ?? estructura.cantidad_fabricada}
            </div>
          </div>
        </div>

        <Link
          to={`/estructuras/${estructura.id}/entregar`}
          style={{
            display: "block",
            marginTop: 16,
            textDecoration: "none",
            borderRadius: 10,
            padding: "10px 12px",
            background: "#2563eb",
            color: "white",
            fontWeight: 700,
            fontSize: 14,
            textAlign: "center"
          }}
        >
          Registrar entrega
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          <Link
            to={`/estructuras/${estructura.id}/editar`}
            style={{
              textDecoration: "none",
              borderRadius: 10,
              padding: "10px 12px",
              background: "#f59e0b",
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              textAlign: "center"
            }}
          >
            Editar
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{
              border: "none",
              borderRadius: 10,
              padding: "10px 12px",
              background: deleting ? "#94a3b8" : "#dc2626",
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer"
            }}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </article>

      <section
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          background: "#fff"
        }}
      >
        <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Historial de entregas</h3>

        {entregas.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 14, textAlign: "center" }}>Sin entregas registradas</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {entregas.map((entrega) => (
              <div
                key={entrega.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: 12,
                  background: "#f8fafc"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>{entrega.fecha_entrega}</strong>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>
                    {entrega.cantidad_entregada} unidades
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#475569" }}>
                  <div>
                    <strong>Unidad:</strong> {entrega.unidad_nombre}
                  </div>
                  <div>
                    <strong>Recibido por:</strong> {entrega.recibido_por}
                  </div>
                  {entrega.comentarios && (
                    <div style={{ marginTop: 4, fontStyle: "italic" }}>
                      <strong>Comentarios:</strong> {entrega.comentarios}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteEntrega(entrega.id)}
                  style={{
                    marginTop: 8,
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 10px",
                    background: "#dc2626",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer"
                  }}
                >
                  Eliminar entrega
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
