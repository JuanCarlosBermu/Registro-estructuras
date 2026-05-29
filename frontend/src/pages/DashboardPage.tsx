import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getDashboardPorTipo, getDashboardPorUnidad, getDashboardResumen } from "../lib/api";
import type { DashboardResumen } from "../types";
import { DashboardSkeleton } from "../components/Skeleton";
import { useToast } from "../contexts/ToastContext";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#334155"];
type DashboardRange = { fecha_desde?: string; fecha_hasta?: string };

function cardStyle(): CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
    background: "#fff"
  };
}

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function subtractDays(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setDate(copy.getDate() - days);
  return copy;
}

function quickRange(type: "today" | "week" | "month" | "threeMonths"): DashboardRange {
  const today = new Date();
  const end = toDateInput(today);

  if (type === "today") {
    return { fecha_desde: end, fecha_hasta: end };
  }

  if (type === "week") {
    return { fecha_desde: toDateInput(subtractDays(today, 6)), fecha_hasta: end };
  }

  if (type === "month") {
    return { fecha_desde: toDateInput(subtractDays(today, 29)), fecha_hasta: end };
  }

  return { fecha_desde: toDateInput(subtractDays(today, 89)), fecha_hasta: end };
}

export default function DashboardPage() {
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [porTipo, setPorTipo] = useState<{ tipo: string; total_fabricada: number }[]>([]);
  const [porUnidad, setPorUnidad] = useState<{ unidad: string; total_entregada: number }[]>([]);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePreset, setActivePreset] = useState<"" | "today" | "week" | "month" | "threeMonths">("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  async function load(range?: DashboardRange) {
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
    setActivePreset("");
    load({
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined
    });
  }

  function onClearFilter() {
    setFechaDesde("");
    setFechaHasta("");
    setActivePreset("");
    load();
  }

  function onQuickFilter(type: "today" | "week" | "month" | "threeMonths") {
    const range = quickRange(type);
    setFechaDesde(range.fecha_desde ?? "");
    setFechaHasta(range.fecha_hasta ?? "");
    setActivePreset(type);
    load(range);
  }

  async function exportToPdf() {
    if (!dashboardRef.current) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 1.5,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true
      });

      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF("p", "mm", "a4");
      
      pdf.setFontSize(16);
      pdf.text("Dashboard - LeanShop", 105, 12, { align: "center" });
      
      pdf.setFontSize(9);
      const fecha = new Date().toLocaleDateString("es-MX");
      pdf.text(`Generado: ${fecha}`, 105, 18, { align: "center" });
      
      let position = 24;
      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      
      if (imgHeight < pageHeight - position - 10) {
        pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - position;
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }
      
      pdf.save(`dashboard-${fecha.replace(/\//g, "-")}.pdf`);
      showToast("PDF exportado exitosamente", "success");
    } catch (err) {
      console.error("Error exporting PDF:", err);
      showToast("No se pudo exportar el PDF", "error");
    } finally {
      setExporting(false);
    }
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

  if (loading && !resumen) {
    return <DashboardSkeleton />;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button
        type="button"
        onClick={exportToPdf}
        disabled={exporting}
        style={{
          border: "none",
          borderRadius: 10,
          padding: "10px 12px",
          background: exporting ? "#94a3b8" : "#7c3aed",
          color: "white",
          fontWeight: 700,
          fontSize: 14,
          cursor: exporting ? "not-allowed" : "pointer"
        }}
      >
        {exporting ? "Exportando..." : "Exportar PDF"}
      </button>

      <div ref={dashboardRef} style={{ display: "grid", gap: 12 }}>
        <section style={cardStyle()}>
          <button
            type="button"
            onClick={() => setFilterOpen((prev) => !prev)}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              padding: 0,
              margin: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer"
            }}
          >
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>Filtro de tiempo</h2>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{filterOpen ? "Ocultar" : "Mostrar"}</span>
          </button>

        {filterOpen ? (
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <button type="button" style={quickButtonStyle(activePreset === "today")} onClick={() => onQuickFilter("today")}>
              Hoy
            </button>
            <button type="button" style={quickButtonStyle(activePreset === "week")} onClick={() => onQuickFilter("week")}>
              Ultima semana
            </button>
            <button type="button" style={quickButtonStyle(activePreset === "month")} onClick={() => onQuickFilter("month")}>
              Ultimo mes
            </button>
            <button
              type="button"
              style={quickButtonStyle(activePreset === "threeMonths")}
              onClick={() => onQuickFilter("threeMonths")}
            >
              3 meses
            </button>
            </div>

            <label style={{ display: "grid", gap: 4, fontSize: 12, color: "#334155" }}>
            Desde
            <input
              type="date"
              value={fechaDesde}
              onChange={(event) => setFechaDesde(event.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "8px 9px",
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
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "8px 9px",
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
                borderRadius: 8,
                padding: "8px 10px",
                background: "#111827",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13
              }}
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={onClearFilter}
              style={{
                flex: 1,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "8px 10px",
                background: "#fff",
                color: "#334155",
                fontWeight: 600,
                fontSize: 13
              }}
            >
              Limpiar
            </button>
            </div>
            {loading ? <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Cargando...</p> : null}
            {error ? <p style={{ margin: 0, fontSize: 12, color: "#dc2626" }}>{error}</p> : null}
          </div>
        ) : null}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {cards.map((item) => (
          <div key={item.label} style={cardStyle()}>
            <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>{item.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 700 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <section style={cardStyle()}>
        <h2 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600 }}>Fabricacion por tipo</h2>
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
        <h2 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600 }}>Entregas por unidad</h2>
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
    </div>
  );
}

function quickButtonStyle(active: boolean): CSSProperties {
  return {
    border: `1px solid ${active ? "#111827" : "#d1d5db"}`,
    borderRadius: 8,
    padding: "7px 8px",
    background: active ? "#111827" : "#fff",
    color: active ? "#fff" : "#374151",
    fontSize: 12,
    fontWeight: 600
  };
}
