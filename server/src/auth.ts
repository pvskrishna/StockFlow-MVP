import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { env } from "./env.js";
import { prisma } from "./db.js";

const COOKIE_NAME = "sf_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type Role = "ADMIN" | "MANAGER" | "GUEST";
export const ROLES: Role[] = ["ADMIN", "MANAGER", "GUEST"];

export type SessionPayload = {
  userId: string;
  organizationId: string;
  email: string;
  role: Role;
};

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function readSession(req: Request): SessionPayload | null {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, env.jwtSecret) as SessionPayload;
  } catch {
    return null;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: SessionPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: "Unauthorized" });
  // Back-compat: tokens issued before roles existed have no `role` claim.
  // Fetch the current role from DB so guards work without forcing re-login.
  if (!s.role) {
    const u = await prisma.user.findUnique({
      where: { id: s.userId },
      select: { role: true },
    });
    if (!u) return res.status(401).json({ error: "Unauthorized" });
    s.role = u.role as Role;
  }
  req.session = s;
  next();
}

export function requireRole(...allowed: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let s = req.session ?? readSession(req);
    if (!s) return res.status(401).json({ error: "Unauthorized" });
    if (!s.role) {
      const u = await prisma.user.findUnique({
        where: { id: s.userId },
        select: { role: true },
      });
      if (!u) return res.status(401).json({ error: "Unauthorized" });
      s.role = u.role as Role;
    }
    if (!allowed.includes(s.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    req.session = s;
    next();
  };
}
