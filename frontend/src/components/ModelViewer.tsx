import { useEffect, useRef } from "react";
import "@google/model-viewer";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function ModelViewer({ src, size = 120 }: { src: string; size?: number }) {
  const fullUrl = src.startsWith("http") ? src : `${API_URL}${src}`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const el = document.createElement("model-viewer") as any;
    el.setAttribute("src", fullUrl);
    el.setAttribute("auto-rotate", "");
    el.setAttribute("camera-controls", "");
    el.setAttribute("shadow-intensity", "1");
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = "12px";
    el.style.background = "#f1f5f9";

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(el);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [fullUrl, size]);

  return <div ref={containerRef} style={{ width: size, height: size, flexShrink: 0 }} />;
}
