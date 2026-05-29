import { useState } from "react";
import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from "react";
import { useHover } from "../hooks/useHover";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
};

const variantStyles: Record<ButtonVariant, { base: CSSProperties; hover: CSSProperties }> = {
  primary: {
    base: { background: "#2563eb", color: "#fff", border: "none" },
    hover: { background: "#1d4ed8" }
  },
  secondary: {
    base: { background: "#fff", color: "#334155", border: "1px solid #d1d5db" },
    hover: { background: "#f8fafc" }
  },
  danger: {
    base: { background: "#dc2626", color: "#fff", border: "none" },
    hover: { background: "#b91c1c" }
  },
  ghost: {
    base: { background: "transparent", color: "#2563eb", border: "none" },
    hover: { background: "#f1f5f9" }
  }
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: { padding: "6px 10px", fontSize: 12 },
  md: { padding: "10px 12px", fontSize: 14 },
  lg: { padding: "12px 16px", fontSize: 16 }
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { isHovered, hoverProps } = useHover();
  const [isPressed, setIsPressed] = useState(false);

  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const buttonStyle: CSSProperties = {
    ...variantStyle.base,
    ...sizeStyle,
    borderRadius: 10,
    fontWeight: 700,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    transform: isPressed ? "scale(0.98)" : "scale(1)",
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? "100%" : "auto",
    ...(isHovered && !disabled && !loading ? variantStyle.hover : {}),
    ...style
  };

  return (
    <button
      {...props}
      {...hoverProps}
      disabled={disabled || loading}
      style={buttonStyle}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        hoverProps.onMouseLeave();
      }}
    >
      {loading ? "Cargando..." : children}
    </button>
  );
}
