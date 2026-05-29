const styleMap: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: "#e2e8f0", text: "#334155", label: "Pendiente" },
  en_proceso: { bg: "#fef3c7", text: "#92400e", label: "En proceso" },
  terminada: { bg: "#dbeafe", text: "#1d4ed8", label: "Terminada" },
  entregada: { bg: "#dcfce7", text: "#15803d", label: "Entregada" }
};

export default function StatusBadge({ estado }: { estado: string }) {
  const item = styleMap[estado] ?? styleMap.pendiente;
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: 999,
        padding: "3px 10px",
        background: item.bg,
        color: item.text,
        fontSize: 12,
        fontWeight: 700
      }}
    >
      {item.label}
    </span>
  );
}
