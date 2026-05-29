import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type UserRole = "admin" | "operador" | "visor";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    rol: UserRole;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Token requerido" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string; rol: UserRole };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Token invalido" });
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "No autenticado" });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: "FORBIDDEN", message: "Sin permisos" });
    }
    next();
  };
}
