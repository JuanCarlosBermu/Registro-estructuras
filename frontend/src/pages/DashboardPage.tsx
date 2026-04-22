import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import { getDashboardPorTipo, getDashboardPorUnidad, getDashboardResumen } from "../lib/api";
import type { DashboardResumen } from "../types";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#334155"];

function cardStyle(): CSSProperties {
  return {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
    background: "#fff"
  };
}

export default function DashboardPage() {
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [porTipo, setPorTipo] = useState<{ tipo: string; total_fabricada: number }[]>([]);
  const [porUnidad, setPorUnidad] = useState<{ unidad: string; total_entregada: number }[]>([]);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(range?: { fecha_desde?: string; fecha_hasta?: string }) {
    setLoading(true);
    setError("");
    try {
      const [resumenData, tipoData, unidadData] = await Promise.all([
        getDashboardResumen(range),
        getDashboardPorTipo(range),
        getDashboardPorUnidad(range)
      ]);
      setResumen(resumenData);
      setPorTipo(tipoData);
      setPorUnidad(unidadData);
    } catch (_err) {
      setResumen({ total_fabricadas: 0, total_entregadas: 0, pendientes: 0, cumplimiento_pct: 0 });
      setPorTipo([]);
      setPorUnidad([]);
      setError("No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onApplyFilter() {
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      setError("La fecha inicial no puede ser mayor a la final.");
      return;
    }
    load({
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined
    });
  }

  function onClearFilter() {
    setFechaDesde("");
    setFechaHasta("");
    load();
  }

  const cards = useMemo(
    () => [
      { label: "Fabricadas", value: resumen?.total_fabricadas ?? 0 },
      { label: "Entregadas", value: resumen?.total_entregadas ?? 0 },
      { label: "Pendientes", value: resumen?.pendientes ?? 0 },
      { label: "Cumplimiento", value: `${resumen?.cumplimiento_pct ?? 0}%` }
    ],
    [resumen]
  );

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <section style={cardStyle()}>
        <h2 style={{ margin: "0 0 8px", fontSize: 15 }}>Filtro de tiempo</h2>
        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ display: "grid", gap: 4, fontSize: 12, color: "#334155" }}>
            Desde
            <input
              type="date"
              value={fechaDesde}
              onChange={(event) => setFechaDesde(event.target.value)}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "9px 10px",
                fontSize: 13
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 12, color: "#334155" }}>
            Hasta
            <input
              type="date"
              value={fechaHasta}
              onChange={(event) => setFechaHasta(event.target.value)}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "9px 10px",
                fontSize: 13
              }}
            />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onApplyFilter}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 10,
                padding: "9px 10px",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 700
              }}
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={onClearFilter}
              style={{
                flex: 1,
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "9px 10px",
                background: "#fff",
                color: "#334155",
                fontWeight: 700
              }}
            >
              Limpiar
            </button>
          </div>
          {loading ? <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Cargando...</p> : null}
          {error ? <p style={{ margin: 0, fontSize: 12, color: "#dc2626" }}>{error}</p> : null}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {cards.map((item) => (
          <div key={item.label} style={cardStyle()}>
            <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>{item.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 700 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <section style={cardStyle()}>
        <h2 style={{ margin: "0 0 8px", fontSize: 15 }}>Fabricacion por tipo</h2>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={porTipo}>
              <XAxis dataKey="tipo" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_fabricada" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section style={cardStyle()}>
        <h2 style={{ margin: "0 0 8px", fontSize: 15 }}>Entregas por unidad</h2>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={porUnidad} dataKey="total_entregada" nameKey="unidad" outerRadius={85}>
                {porUnidad.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
