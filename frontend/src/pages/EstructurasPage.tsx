import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getEstructuras } from "../lib/api";
import type { Estructura } from "../types";
import StatusBadge from "../components/StatusBadge";

export default function EstructurasPage() {
  const [rows, setRows] = useState<Estructura[]>([]);
  const [status, setStatus] = useState<string>("todos");

  useEffect(() => {
    getEstructuras()
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  const filtered = useMemo(() => {
    if (status === "todos") {
      return rows;
    }
    return rows.filter((item) => item.estado === status);
  }, [rows, status]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <Link
        to="/estructuras/nueva"
        style={{
          display: "inline-block",
          textDecoration: "none",
          borderRadius: 10,
          padding: "10px 12px",
          background: "#16a34a",
          color: "white",
          fontWeight: 700,
          fontSize: 14,
          textAlign: "center"
        }}
      >
        + Nueva estructura
      </Link>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {["todos", "pendiente", "en_proceso", "terminada", "entregada"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 999,
              padding: "6px 10px",
              background: status === item ? "#2563eb" : "#fff",
              color: status === item ? "#fff" : "#334155",
              fontWeight: 700,
              fontSize: 12
            }}
          >
            {item === "todos" ? "Todos" : item}
          </button>
        ))}
      </div>

      {filtered.map((item) => (
        <article
          key={item.id}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 12,
            background: "#fff"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: 14 }}>{item.folio}</strong>
            <StatusBadge estado={item.estado} />
          </div>

          <p style={{ margin: "6px 0 0", color: "#334155", fontSize: 14 }}>
            {item.tipo_nombre} - {item.descripcion}
          </p>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
            Destino: {item.unidad_destino_nombre ?? "N/A"}
          </p>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
            Fabricada: {item.cantidad_fabricada} | Entregada: {item.cantidad_entregada_total ?? 0} | Pendiente:{" "}
            {item.saldo_pendiente ?? item.cantidad_fabricada}
          </p>

          <Link
            to={`/estructuras/${item.id}/entregar`}
            style={{
              display: "inline-block",
              marginTop: 10,
              textDecoration: "none",
              borderRadius: 10,
              padding: "8px 12px",
              background: "#2563eb",
              color: "white",
              fontWeight: 700,
              fontSize: 13
            }}
          >
            Registrar entrega
          </Link>
        </article>
      ))}
    </div>
  );
}
