import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 400
        }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const colors = {
    success: { bg: "#dcfce7", border: "#16a34a", text: "#15803d" },
    error: { bg: "#fee2e2", border: "#dc2626", text: "#991b1b" },
    info: { bg: "#dbeafe", border: "#2563eb", text: "#1e40af" }
  };

  const color = colors[toast.type];

  return (
    <div
      style={{
        background: color.bg,
        border: `2px solid ${color.border}`,
        borderRadius: 8,
        padding: "12px 16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        animation: "slideIn 0.3s ease-out"
      }}
    >
      <span style={{ flex: 1, color: color.text, fontSize: 14, fontWeight: 500 }}>
        {toast.message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: color.text,
          fontSize: 20,
          cursor: "pointer",
          padding: 0,
          lineHeight: 1
        }}
      >
        ×
      </button>
    </div>
  );
}
