import type { CSSProperties } from "react";

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: CSSProperties;
};

export default function Skeleton({ width = "100%", height = 20, borderRadius = 4, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        ...style
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 12,
        background: "#fff",
        display: "grid",
        gap: 12
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton width={80} height={16} />
        <Skeleton width={60} height={20} borderRadius={999} />
      </div>
      <Skeleton height={14} />
      <Skeleton width="70%" height={13} />
      <Skeleton width="80%" height={13} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Skeleton height={40} borderRadius={10} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <Skeleton width={60} height={12} />
            <Skeleton width={40} height={22} style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
        <Skeleton width={120} height={14} />
        <Skeleton height={220} style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}
