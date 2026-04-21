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

  useEffect(() => {
    async function load() {
      const [resumenData, tipoData, unidadData] = await Promise.all([
        getDashboardResumen(),
        getDashboardPorTipo(),
        getDashboardPorUnidad()
      ]);
      setResumen(resumenData);
      setPorTipo(tipoData);
      setPorUnidad(unidadData);
    }

    load().catch(() => {
      setResumen({ total_fabricadas: 0, total_entregadas: 0, pendientes: 0, cumplimiento_pct: 0 });
      setPorTipo([]);
      setPorUnidad([]);
    });
  }, []);

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
