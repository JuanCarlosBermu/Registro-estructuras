import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { getEstructuras, getTiposEstructura, getUnidades } from "../lib/api";
import type { Estructura, TipoEstructura, UnidadNegocio } from "../types";
import StatusBadge from "../components/StatusBadge";
import TipoIcon from "../components/TipoIcon";
import { CardSkeleton } from "../components/Skeleton";
import { useHover } from "../hooks/useHover";

export default function EstructurasPage() {
  const [rows, setRows] = useState<Estructura[]>([]);
  const [tipos, setTipos] = useState<TipoEstructura[]>([]);
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [tipoId, setTipoId] = useState<number | "">("");
  const [unidadId, setUnidadId] = useState<number | "">("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getEstructuras({
      estado: status === "todos" ? undefined : status,
      tipo_id: tipoId === "" ? undefined : tipoId,
      unidad_id: unidadId === "" ? undefined : unidadId,
      q: search.trim() || undefined,
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined
    })
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [status, tipoId, unidadId, search, fechaDesde, fechaHasta]);

  useEffect(() => {
    getTiposEstructura()
      .then((items) => setTipos(items.filter((i) => i.activo)))
      .catch(() => setTipos([]));
    getUnidades()
      .then((items) => setUnidades(items.filter((i) => i.activo)))
      .catch(() => setUnidades([]));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  function clearFilters() {
    setSearch("");
    setStatus("todos");
    setTipoId("");
    setUnidadId("");
    setFechaDesde("");
    setFechaHasta("");
  }

  const hasActiveFilters =
    tipoId !== "" || unidadId !== "" || fechaDesde !== "" || fechaHasta !== "" || search !== "";

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

      <input
        type="text"
        placeholder="Buscar por folio, descripcion o responsable..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          border: "1px solid #cbd5e1",
          borderRadius: 10,
          padding: "10px 12px",
          fontSize: 14,
          outline: "none"
        }}
      />

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
              fontSize: 12,
              whiteSpace: "nowrap"
            }}
          >
            {item === "todos" ? "Todos" : item}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setFiltersOpen((prev) => !prev)}
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 8,
          padding: "8px 10px",
          background: filtersOpen ? "#f1f5f9" : "#fff",
          color: "#334155",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <span>Filtros avanzados</span>
        <span style={{ fontSize: 11 }}>{filtersOpen ? "Ocultar" : "Mostrar"}</span>
      </button>

      {filtersOpen && (
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 12,
            display: "grid",
            gap: 8,
            background: "#f8fafc"
          }}
        >
          <label style={labelStyle()}>
            Tipo
            <select
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value ? Number(e.target.value) : "")}
              style={inputStyle()}
            >
              <option value="">Todos</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle()}>
            Unidad destino
            <select
              value={unidadId}
              onChange={(e) => setUnidadId(e.target.value ? Number(e.target.value) : "")}
              style={inputStyle()}
            >
              <option value="">Todas</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={labelStyle()}>
              Desde
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                style={inputStyle()}
              />
            </label>
            <label style={labelStyle()}>
              Hasta
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                style={inputStyle()}
              />
            </label>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "8px 10px",
                background: "#fff",
                color: "#334155",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer"
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {loading && rows.length === 0 && (
        <>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </>
      )}

      {!loading && rows.length === 0 && (
        <p style={{ textAlign: "center", color: "#64748b", fontSize: 14 }}>No se encontraron estructuras</p>
      )}

      {rows.map((item) => (
        <EstructuraCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function EstructuraCard({ item }: { item: Estructura }) {
  const { isHovered, hoverProps } = useHover();

  return (
    <article
      {...hoverProps}
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 12,
        background: "#fff",
        transition: "all 0.2s ease",
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.05)"
      }}
    >
      <Link
        to={`/estructuras/${item.id}`}
        style={{ textDecoration: "none", color: "inherit", display: "flex", gap: 12, alignItems: "flex-start" }}
      >
        <TipoIcon tipo={item.tipo_nombre ?? ""} size={44} color="#2563eb" modeloUrl={item.tipo_modelo_url} />
        <div style={{ flex: 1, minWidth: 0 }}>
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
        </div>
      </Link>

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
  );
}

function labelStyle(): CSSProperties {
  return { display: "grid", gap: 4, fontSize: 12, color: "#334155" };
}

function inputStyle(): CSSProperties {
  return {
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    outline: "none"
  };
}
