import type { CSSProperties, ReactElement } from "react";
import ModelViewer from "./ModelViewer";

const iconStyle = (size: number): CSSProperties => ({
  width: size,
  height: size,
  flexShrink: 0
});

function MesaIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" style={iconStyle(size)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="20" width="48" height="6" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="8" y="20" width="48" height="6" rx="2" />
      <line x1="14" y1="26" x2="14" y2="50" />
      <line x1="50" y1="26" x2="50" y2="50" />
      <line x1="10" y1="50" x2="18" y2="50" />
      <line x1="46" y1="50" x2="54" y2="50" />
    </svg>
  );
}

function CarritoIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" style={iconStyle(size)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="12" y="14" width="36" height="28" rx="3" fill="currentColor" opacity="0.15" />
      <rect x="12" y="14" width="36" height="28" rx="3" />
      <circle cx="20" cy="48" r="4" />
      <circle cx="44" cy="48" r="4" />
      <line x1="24" y1="48" x2="40" y2="48" />
      <line x1="30" y1="22" x2="30" y2="34" />
      <line x1="34" y1="22" x2="34" y2="34" />
    </svg>
  );
}

function RackIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" style={iconStyle(size)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="12" y="8" width="40" height="48" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="12" y="8" width="40" height="48" rx="2" />
      <line x1="12" y1="24" x2="52" y2="24" />
      <line x1="12" y1="40" x2="52" y2="40" />
      <line x1="32" y1="8" x2="32" y2="56" />
    </svg>
  );
}

function SoporteIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" style={iconStyle(size)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="32,10 52,50 12,50" fill="currentColor" opacity="0.15" />
      <polygon points="32,10 52,50 12,50" />
      <line x1="22" y1="34" x2="42" y2="34" />
      <circle cx="32" cy="44" r="3" />
    </svg>
  );
}

function ConveyorIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" style={iconStyle(size)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="24" width="52" height="12" rx="6" fill="currentColor" opacity="0.15" />
      <rect x="6" y="24" width="52" height="12" rx="6" />
      <circle cx="16" cy="30" r="3" />
      <circle cx="32" cy="30" r="3" />
      <circle cx="48" cy="30" r="3" />
      <line x1="16" y1="40" x2="16" y2="50" />
      <line x1="48" y1="40" x2="48" y2="50" />
      <line x1="12" y1="50" x2="20" y2="50" />
      <line x1="44" y1="50" x2="52" y2="50" />
    </svg>
  );
}

function PizarronIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" style={iconStyle(size)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="10" width="48" height="34" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="8" y="10" width="48" height="34" rx="2" />
      <line x1="16" y1="20" x2="40" y2="20" />
      <line x1="16" y1="28" x2="48" y2="28" />
      <line x1="16" y1="36" x2="34" y2="36" />
      <line x1="28" y1="44" x2="28" y2="54" />
      <line x1="36" y1="44" x2="36" y2="54" />
      <line x1="22" y1="54" x2="42" y2="54" />
    </svg>
  );
}

function OtroIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" style={iconStyle(size)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="12" y="12" width="40" height="40" rx="8" fill="currentColor" opacity="0.15" />
      <rect x="12" y="12" width="40" height="40" rx="8" />
      <circle cx="24" cy="32" r="2.5" fill="currentColor" />
      <circle cx="32" cy="32" r="2.5" fill="currentColor" />
      <circle cx="40" cy="32" r="2.5" fill="currentColor" />
    </svg>
  );
}

const iconMap: Record<string, (props: { size: number }) => ReactElement> = {
  "mesa de trabajo": MesaIcon,
  "carrito": CarritoIcon,
  "rack": RackIcon,
  "soporte": SoporteIcon,
  "conveyor": ConveyorIcon,
  "pizarron": PizarronIcon,
};

export default function TipoIcon({ tipo, size = 40, color = "#475569", modeloUrl }: { tipo: string; size?: number; color?: string; modeloUrl?: string | null }) {
  if (modeloUrl) {
    return <ModelViewer src={modeloUrl} size={size} />;
  }

  const key = tipo.toLowerCase().trim();
  const IconComponent = iconMap[key] ?? OtroIcon;

  return (
    <span style={{ color, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <IconComponent size={size} />
    </span>
  );
}
